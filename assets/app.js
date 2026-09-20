/* ============================================================
   Arka & Smritikana — interactions & animations (shared)
   ============================================================ */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Intro overlay ---------- */
  const intro = document.getElementById("intro");
  const openBtn = document.getElementById("openBtn");
  function dismissIntro() {
    if (intro) intro.classList.add("hide");
    document.body.style.overflow = "";
    startMusic(); // gesture unlocks audio
  }
  if (intro) {
    document.body.style.overflow = "hidden";
    if (openBtn) openBtn.addEventListener("click", dismissIntro);
    // allow deep-linking / preview to skip the intro
    if (location.search.includes("preview") || location.hash === "#open") {
      intro.classList.add("hide");
      document.body.style.overflow = "";
    }
  }

  /* ---------- Star wreath (circle of stars) ---------- */
  const wreath = document.getElementById("wreath");
  if (wreath) {
    const count = 40;
    const R = 47; // percentage radius
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "star";
      s.textContent = "✦";
      const angle = (i / count) * Math.PI * 2;
      const x = 50 + R * Math.cos(angle);
      const y = 50 + R * Math.sin(angle);
      s.style.left = x + "%";
      s.style.top = y + "%";
      s.style.transform = `translate(-50%,-50%) rotate(${(angle * 180) / Math.PI + 90}deg)`;
      s.style.fontSize = i % 2 ? "11px" : "16px";
      s.style.opacity = i % 2 ? "0.7" : "1";
      wreath.appendChild(s);
    }
  }

  /* ---------- Sparkles in hero ---------- */
  const sparkles = document.getElementById("sparkles");
  if (sparkles) {
    for (let i = 0; i < 60; i++) {
      const sp = document.createElement("span");
      sp.className = "spark";
      sp.style.left = Math.random() * 100 + "%";
      sp.style.top = Math.random() * 100 + "%";
      sp.style.setProperty("--d", 2 + Math.random() * 4 + "s");
      sp.style.animationDelay = Math.random() * 4 + "s";
      const scale = 0.6 + Math.random() * 1.6;
      sp.style.width = sp.style.height = 3 * scale + "px";
      sparkles.appendChild(sp);
    }
  }

  /* ---------- Floating petals / flowers ---------- */
  const petalsLayer = document.getElementById("petals");
  const petalChars = ["🌸", "🌺", "❁", "✿", "🏵️", "🌼"];
  function makePetal() {
    if (!petalsLayer) return;
    const p = document.createElement("span");
    p.className = "petal";
    p.textContent = petalChars[Math.floor(Math.random() * petalChars.length)];
    p.style.left = Math.random() * 100 + "vw";
    const size = 12 + Math.random() * 20;
    p.style.fontSize = size + "px";
    const dur = 9 + Math.random() * 10;
    p.style.animationDuration = dur + "s";
    p.style.opacity = 0.5 + Math.random() * 0.5;
    petalsLayer.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000 + 500);
  }
  if (petalsLayer && !reduced) {
    for (let i = 0; i < 8; i++) setTimeout(makePetal, i * 500);
    setInterval(makePetal, 1400);
  }

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Countdown (configurable per page) ---------- */
  const clock = document.getElementById("clock");
  if (clock) {
    const target = new Date(clock.dataset.target || "2026-12-13T10:00:00+05:30").getTime();
    const isBn = clock.dataset.lang === "bn";
    const bn = (n) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
    const fmt = (n) => {
      const s = String(n).padStart(2, "0");
      return isBn ? bn(s) : s;
    };
    const el = {
      d: document.getElementById("cd-days"),
      h: document.getElementById("cd-hours"),
      m: document.getElementById("cd-mins"),
      s: document.getElementById("cd-secs"),
    };
    function tick() {
      const diff = target - Date.now();
      const clamp = Math.max(0, diff);
      const days = Math.floor(clamp / 86400000);
      const hours = Math.floor((clamp % 86400000) / 3600000);
      const mins = Math.floor((clamp % 3600000) / 60000);
      const secs = Math.floor((clamp % 60000) / 1000);
      if (el.d) el.d.textContent = fmt(days);
      if (el.h) el.h.textContent = fmt(hours);
      if (el.m) el.m.textContent = fmt(mins);
      if (el.s) el.s.textContent = fmt(secs);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Music (WebAudio ambient tanpura-like drone) ---------- */
  const musicBtn = document.getElementById("musicBtn");
  let audioCtx = null;
  let playing = false;
  let masterGain = null;

  function buildAmbient() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const master = audioCtx.createGain();
    master.gain.value = 0.0;
    master.connect(audioCtx.destination);
    const freqs = [146.83, 220.0, 293.66]; // D3, A3, D4
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = audioCtx.createGain();
      g.gain.value = 0.06;
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.15 + i * 0.05;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(g);
      g.connect(master);
      osc.start();
      lfo.start();
    });
    return master;
  }
  function startMusic() {
    if (playing || !musicBtn) return;
    try {
      if (!audioCtx) masterGain = buildAmbient();
      audioCtx.resume();
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setTargetAtTime(0.5, audioCtx.currentTime, 1.2);
      playing = true;
      musicBtn.classList.add("playing");
    } catch (e) {
      /* audio not supported */
    }
  }
  function stopMusic() {
    if (!playing || !audioCtx) return;
    masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.6);
    playing = false;
    musicBtn.classList.remove("playing");
  }
  if (musicBtn) musicBtn.addEventListener("click", () => (playing ? stopMusic() : startMusic()));
})();
