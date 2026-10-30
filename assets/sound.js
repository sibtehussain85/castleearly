/*
 * CastleEarly sounds \u2014 generated in the browser (no audio files to download).
 * "Soft tok" wooden move sound: pitch 620 Hz, softness 78%, wood body 70%, length 70 ms, volume 75%.
 */
(function () {
  "use strict";
  var MOVE = { pitch: 620, soft: 0.78, body: 0.70, len: 0.070, vol: 0.75 };
  var ctx = null, noiseBuf = null, on = true;
  try { on = localStorage.getItem("ce-sound") !== "off"; } catch (e) {}

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noise() {
    var c = ac();
    if (noiseBuf) return noiseBuf;
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  // One wooden "tok"
  function hit(delay, gainMul, pitchMul) {
    var c = ac(), t = c.currentTime + (delay || 0);
    var pitch = MOVE.pitch * (pitchMul || 1), len = MOVE.len;
    var out = c.createGain(); out.gain.value = MOVE.vol * (gainMul || 1); out.connect(c.destination);
    var s = c.createBufferSource(); s.buffer = noise();
    var bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = pitch; bp.Q.value = 2 + MOVE.body * 10;
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9000 - MOVE.soft * 8000; lp.Q.value = 0.5;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.6, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(out);
    s.start(t); s.stop(t + len + 0.05);
    var o = c.createOscillator(), og = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(pitch * 0.35, t); o.frequency.exponentialRampToValueAtTime(pitch * 0.22, t + len);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.9 * MOVE.body + 0.02, t + 0.003); og.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.9);
    o.connect(og); og.connect(out); o.start(t); o.stop(t + len + 0.05);
  }

  // Soft, quiet bell (for check and game end) so it matches the wooden tok
  function bell(freq, vol, delay, dur) {
    var c = ac(), t = c.currentTime + (delay || 0);
    [[1, 1], [2.76, 0.22], [5.4, 0.06]].forEach(function (h) {
      var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 3500;
      o.type = "sine"; o.frequency.value = freq * h[0];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * h[1], t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (h[0] === 1 ? 1 : 0.5));
      o.connect(lp); lp.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }

  function safe(fn) { return function () { if (!on) return; try { fn(); } catch (e) {} }; }

  window.CESound = {
    move: safe(function () { hit(0, 1); }),
    capture: safe(function () { hit(0, 1.15, 1.15); hit(0.04, 1, 0.92); }),
    castle: safe(function () { hit(0, 1); hit(0.11, 0.9, 0.95); }),
    check: safe(function () { hit(0, 1); bell(988, 0.12, 0.05, 0.45); }),
    win: safe(function () { [523, 659, 784, 1046].forEach(function (f, i) { bell(f, 0.14, i * 0.12, 0.8); }); }),
    lose: safe(function () { [392, 330, 262].forEach(function (f, i) { bell(f, 0.12, i * 0.16, 0.8); }); }),
    wrong: safe(function () { hit(0, 0.8, 0.55); }),
    undo: safe(function () { hit(0, 0.75, 0.84); hit(0.07, 0.55, 0.74); }), // soft "sliding back"
    redo: safe(function () { hit(0, 0.6, 0.96); hit(0.07, 0.75, 1.08); }), // soft "sliding forward"
    start: safe(function () { hit(0, 0.6, 1.1); hit(0.08, 0.6, 0.95); hit(0.15, 0.6, 1.05); }),
    isOn: function () { return on; },
    setOn: function (v) { on = !!v; try { localStorage.setItem("ce-sound", on ? "on" : "off"); } catch (e) {} }
  };
})();
