/* ============================================================
   Arka & Smritikana — interactions & animations (shared)
   ============================================================ */
(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // When embedded in the shell (index.html iframe), the parent owns the music.
  const embedded = window.self !== window.top;
  if (embedded) {
    const mb = document.getElementById("musicBtn");
    if (mb) mb.style.display = "none";
    const au = document.getElementById("bgAudio");
    if (au) { try { au.pause(); au.muted = true; } catch (e) {} }
    // Interactions inside this iframe never reach the parent window that owns the
    // audio, so forward every gesture up to the shell to start/unmute the music.
    const fwd = () => { try { window.parent.postMessage({ __bgm: "kick" }, "*"); } catch (e) {} };
    ["pointerdown", "touchstart", "click", "keydown", "scroll"].forEach((ev) =>
      window.addEventListener(ev, fwd, { capture: true, passive: true }));
  }

  /* tel:/mailto: links must break out of the iframe or iOS Safari silently
     blocks them (won't open the dialer). Force them to the top-level context. */
  document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((a) => {
    a.setAttribute("target", "_top");
    a.setAttribute("rel", "noopener");
  });

  /* ---------- Add to Calendar (platform-aware) ----------
     Android Chrome always downloads .ics and won't open Google Calendar, so on
     Android we use Google Calendar "add event" links (one per event): first tap
     adds the Wedding, second tap adds the Reception. Everywhere else we use the
     all-in-one .ics which adds BOTH at once (iOS/macOS open Calendar directly). */
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows|Win32|Win64|WOW64/i.test(ua);
  const isIOS = /iP(hone|ad|od)/i.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
  const isEn = document.body.classList.contains("en");

  const gcal = (text, dates, details, loc) =>
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(text) +
    "&dates=" + dates +
    "&details=" + encodeURIComponent(details) +
    "&location=" + encodeURIComponent(loc);
  const GCAL_WED = gcal("Arka & Smritikana — Wedding",
    "20261213T133000Z/20261213T173000Z",
    "Wedding ceremony of Arka Manna & Smritikana Paik. 7:00 PM onwards.",
    "Atithi Inn, Raghunathpur Road, Baguiati, Kolkata 700059");
  const GCAL_REC = gcal("Arka & Smritikana — Reception",
    "20261215T133000Z/20261215T173000Z",
    "Reception (Bodhu Boron) of Arka Manna & Smritikana Paik. 7:00 PM onwards.",
    "Imperial Banquet, Mohan Mall (4th Floor), 22 Sahid Surya Sen Road, Berhampore, Murshidabad 742101");
  const RECEPTION_LABEL = isEn ? "Now add Reception  →" : "এবার বধূবরণ যোগ করুন  →";

  function openIcs(el) {
    const url = new URL(el.getAttribute("data-ics"), document.baseURI).href;
    // Trigger from THIS document (works whether embedded in the shell or opened
    // directly) so the user gesture is preserved. Mac/desktop -> webcal:// opens
    // the Calendar app; iOS -> Safari intercepts the .ics and opens Calendar.
    try {
      const a = document.createElement("a");
      a.style.display = "none";
      if (isIOS) {
        a.href = url;
        a.setAttribute("target", "_top");
      } else {
        a.href = url.replace(/^https?:/i, "webcal:"); // Mac/desktop -> Calendar app
      }
      document.body.appendChild(a); a.click();
      setTimeout(() => { try { a.remove(); } catch (e) {} }, 1500);
    } catch (e) {
      window.open(url, "_blank");
    }
    return false;
  }

  document.querySelectorAll("[data-ics]").forEach((el) => {
    const txt = el.querySelector(".cal-txt");
    const orig = txt ? txt.textContent : "";
    let step = 0;
    el.addEventListener("click", (e) => {
      if (isAndroid) {
        e.preventDefault();
        if (step === 0) {
          window.open(GCAL_WED, "_blank");
          step = 1;
          if (txt) txt.textContent = RECEPTION_LABEL;
          el.classList.add("cal-step2");
        } else {
          window.open(GCAL_REC, "_blank");
          step = 0;
          if (txt) txt.textContent = orig;
          el.classList.remove("cal-step2");
        }
        return;
      }
      if (isWindows) {
        // Windows: open both events in two Google Calendar tabs
        e.preventDefault();
        window.open(GCAL_WED, "_blank");
        window.open(GCAL_REC, "_blank");
        return;
      }
      // iOS / macOS: the .ics / webcal adds both events (Mac stays webcal)
      if (openIcs(el) === false) e.preventDefault();
    });
  });

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
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        if (openBtn.classList.contains("opening")) return;
        openBtn.classList.add("opening");
        startMusic(); // gesture unlocks audio right away
        setTimeout(dismissIntro, reduced ? 250 : 1450);
      });
    }
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

  /* ---------- Floating diyas (rising lamps) ---------- */
  const diyasLayer = document.getElementById("diyas");
  function makeDiya() {
    if (!diyasLayer) return;
    const d = document.createElement("span");
    d.className = "diya";
    d.textContent = "🪔";
    d.style.left = Math.random() * 96 + "vw";
    d.style.fontSize = 18 + Math.random() * 14 + "px";
    const dur = 12 + Math.random() * 8;
    d.style.animationDuration = dur + "s";
    diyasLayer.appendChild(d);
    setTimeout(() => d.remove(), dur * 1000 + 500);
  }
  if (diyasLayer && !reduced) {
    for (let i = 0; i < 3; i++) setTimeout(makeDiya, 2000 + i * 2500);
    setInterval(makeDiya, 5200);
  }

  /* ---------- Scroll reveal ---------- */
  // Reveal when the element crosses ~55% down the viewport; toggle so it
  // reverses (flies back out) when scrolled away and replays on return.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle("in", e.isIntersecting);
      });
    },
    { threshold: 0, rootMargin: "0px 0px -45% 0px" }
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

  /* ---------- Music: subtle shehnai melody over a soft tanpura drone ---------- */
  const musicBtn = embedded ? null : document.getElementById("musicBtn");
  let audioCtx = null;
  let master = null;      // overall gain (fade in/out)
  let leadGain = null;    // shehnai
  let droneGain = null;   // tanpura
  let playing = false;
  let built = false;
  let schedTimer = null;

  // Raga Bhairavi-flavoured scale (Sa = C#4)
  const Sa = 277.18;
  const scale = {
    Sa: 277.18, Re: 293.66, Ga: 329.63, Ma: 369.99,
    Pa: 415.30, Dha: 440.0, Ni: 493.88, SA: 554.37, RE: 587.33,
  };
  // gentle, slow phrase: [note, beats]  (REST = silence)
  const phrase = [
    ["Sa", 1], ["Re", 1], ["Ga", 2], ["Ma", 1], ["Pa", 2],
    ["Ma", 1], ["Ga", 1], ["Re", 2], ["Sa", 2], ["REST", 1],
    ["Pa", 1], ["Dha", 1], ["Pa", 1], ["Ma", 2], ["Ga", 1],
    ["Re", 1], ["Sa", 3], ["REST", 2],
    ["Ga", 1], ["Ma", 1], ["Pa", 1], ["Dha", 2], ["Pa", 1],
    ["Ma", 1], ["Ga", 2], ["Re", 1], ["Sa", 3], ["REST", 2],
  ];
  const beat = 0.6; // seconds per beat (slow, soothing)

  function buildAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.0;

    // light stereo "hall" via feedback delay
    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.28;
    const fb = audioCtx.createGain();
    fb.gain.value = 0.22;
    const wet = audioCtx.createGain();
    wet.gain.value = 0.18;
    delay.connect(fb); fb.connect(delay); delay.connect(wet);
    master.connect(audioCtx.destination);
    wet.connect(audioCtx.destination);

    leadGain = audioCtx.createGain();
    leadGain.gain.value = 0.09;
    leadGain.connect(master);
    leadGain.connect(delay);

    droneGain = audioCtx.createGain();
    droneGain.gain.value = 0.055;
    droneGain.connect(master);

    // Tanpura-ish drone: low Sa, Pa, Sa
    [Sa / 2, scale.Pa / 2, Sa].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = audioCtx.createGain();
      g.gain.value = i === 2 ? 0.5 : 0.8;
      // slow shimmer
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.12 + i * 0.03;
      const lfoG = audioCtx.createGain();
      lfoG.gain.value = 0.15;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      osc.connect(g); g.connect(droneGain);
      osc.start(); lfo.start();
    });

    built = true;
  }

  // a single reedy shehnai note with meend (glide) + vibrato
  function playNote(freq, dur, glideFrom) {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    const filt = audioCtx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(1100, t);
    filt.frequency.linearRampToValueAtTime(1700, t + dur * 0.5);
    filt.Q.value = 7;
    const g = audioCtx.createGain();
    g.gain.value = 0;

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoG = audioCtx.createGain();
    lfoG.gain.value = freq * 0.007;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);

    osc.connect(filt); filt.connect(g); g.connect(leadGain);

    if (glideFrom) {
      osc.frequency.setValueAtTime(glideFrom, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
    } else {
      osc.frequency.setValueAtTime(freq, t);
    }

    const a = 0.07, r = 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.9, t + a);
    g.gain.setValueAtTime(0.9, t + Math.max(a, dur - r));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.start(t); lfo.start(t);
    osc.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }

  let idx = 0, lastFreq = null;
  function step() {
    if (!playing) return;
    const [name, beats] = phrase[idx % phrase.length];
    const dur = beats * beat;
    if (name === "REST") {
      lastFreq = null;
    } else {
      const f = scale[name];
      playNote(f, dur * 0.94, lastFreq);
      lastFreq = f;
    }
    idx++;
    schedTimer = setTimeout(step, dur * 1000);
  }

  function startSynth() {
    try {
      if (!built) buildAudio();
      audioCtx.resume();
      master.gain.cancelScheduledValues(audioCtx.currentTime);
      master.gain.setTargetAtTime(0.9, audioCtx.currentTime, 1.4);
      step();
    } catch (e) {
      /* audio not supported */
    }
  }
  function stopSynth() {
    if (!audioCtx) return;
    master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.5);
    if (schedTimer) clearTimeout(schedTimer);
  }

  /* ---- Real audio track (the looped clip) with synth fallback ---- */
  const bgAudio = embedded ? null : document.getElementById("bgAudio");
  let useFile = !!bgAudio;
  let fadeTimer = null;
  const TARGET_VOL = 0.55;
  if (bgAudio) {
    bgAudio.loop = true;
    bgAudio.addEventListener("error", () => { useFile = false; }, { once: true });
  }
  function fadeAudio(to, done) {
    if (fadeTimer) clearInterval(fadeTimer);
    const stepv = (to - bgAudio.volume) / 30;
    fadeTimer = setInterval(() => {
      let v = bgAudio.volume + stepv;
      if ((stepv > 0 && v >= to) || (stepv < 0 && v <= to)) {
        v = to;
        clearInterval(fadeTimer);
        if (done) done();
      }
      bgAudio.volume = Math.min(1, Math.max(0, v));
    }, 50);
  }

  /* ---- Music always starts fresh on every load (preference is NOT remembered) ---- */
  let userInteracted = false;
  let userStopped = false; // session-only: set when the user pauses via the vinyl

  function startMusic() {
    if (playing || !musicBtn) return;
    if (useFile && bgAudio) {
      bgAudio.muted = false;
      bgAudio.volume = 0;
      const p = bgAudio.play();
      if (p && p.catch) {
        p.then(() => {
          playing = true;
          musicBtn.classList.add("playing");
          fadeAudio(TARGET_VOL);
        }).catch(() => {
          // autoplay blocked — will start on the next real gesture
          playing = false;
          musicBtn.classList.remove("playing");
        });
        return;
      }
      fadeAudio(TARGET_VOL);
    } else {
      startSynth();
    }
    playing = true;
    musicBtn.classList.add("playing");
  }
  function stopMusic() {
    if (!playing) return;
    if (useFile && bgAudio) {
      // iOS Safari ignores programmatic volume, so a fade never reaches 0 and the
      // pause callback never fires — pause immediately there. Fade elsewhere, but
      // guarantee a pause afterwards as a safety net.
      if (isIOS) {
        try { bgAudio.pause(); } catch (e) {}
      } else {
        fadeAudio(0, () => { try { bgAudio.pause(); } catch (e) {} });
        setTimeout(() => { if (!playing) { try { bgAudio.pause(); } catch (e) {} } }, 1600);
      }
    } else {
      stopSynth();
    }
    playing = false;
    musicBtn.classList.remove("playing");
  }
  if (musicBtn) {
    musicBtn.addEventListener("click", () => {
      userInteracted = true;
      if (playing) { userStopped = true; stopMusic(); }
      else { userStopped = false; startMusic(); }
    });
  }

  /* Autoplay every load: try UNMUTED first (works on revisits via browser media
     engagement); if blocked, spin the record muted and bring the sound in on the
     first user interaction. Preference is never remembered — only an in-session
     pause via the vinyl stops it (until the next reload). */
  if (musicBtn && useFile && bgAudio) {
    const kEvents = ["pointerdown", "touchstart", "click", "keydown", "scroll"];
    function removeKick() {
      kEvents.forEach((ev) => window.removeEventListener(ev, kick, true));
      window.removeEventListener("message", onMsg);
    }
    // Start / unmute the music (called by direct gestures AND by gestures
    // forwarded from the iframe via postMessage).
    function activate() {
      if (playing || userStopped) return;
      userInteracted = true;
      bgAudio.muted = false;
      if (bgAudio.paused) {
        startMusic();
      } else {
        bgAudio.volume = 0;               // already spinning muted → fade sound in
        playing = true;
        musicBtn.classList.add("playing");
        fadeAudio(TARGET_VOL);
      }
      if (playing) removeKick();
    }
    function kick(e) {
      if (e && e.target && e.target.closest && e.target.closest("#musicBtn")) return;
      activate();
    }
    function onMsg(ev) { if (ev && ev.data && ev.data.__bgm === "kick") activate(); }

    // 1) Attempt to play WITH sound immediately (works on revisits via media engagement).
    bgAudio.muted = false;
    bgAudio.volume = TARGET_VOL;
    const p = bgAudio.play();
    if (p && p.then) {
      p.then(() => { playing = true; musicBtn.classList.add("playing"); })
       .catch(() => {
         // 2) Blocked with sound → spin muted and wait for the first interaction.
         bgAudio.muted = true;
         bgAudio.play().then(() => musicBtn.classList.add("playing")).catch(() => {});
       });
    }
    kEvents.forEach((ev) => window.addEventListener(ev, kick, { capture: true, passive: true }));
    window.addEventListener("message", onMsg); // gestures forwarded from the iframe
  }

  /* ---- Pause when the page is hidden, resume on return (no state writes) ---- */
  function pauseForHide() {
    if (useFile && bgAudio) {
      bgAudio.pause();
    } else if (audioCtx) {
      if (schedTimer) clearTimeout(schedTimer);
      audioCtx.suspend();
    }
  }
  function resumeAfterHide() {
    if (useFile && bgAudio) {
      bgAudio.play().catch(() => {});
    } else if (audioCtx) {
      audioCtx.resume();
      step();
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (playing) pauseForHide();
    } else if (playing) {
      resumeAfterHide();
    } else if (!userStopped && userInteracted) {
      startMusic();
    }
  });
  window.addEventListener("pagehide", () => { if (playing) pauseForHide(); });
})();
