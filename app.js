// Crazy Cakes Bogotá · Opción A «Apaga la luz»
// Lights on at load, the cakes take turns in the arch, the light travels along the gallery,
// one step candle lit at a time, and the order candle you blow to send the WhatsApp.
(() => {
  const WA = "573171812316";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const wide = matchMedia("(min-width: 1021px)");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  root.classList.add("js");
  window.__cc = true;

  /* Hero: split the title into lines for the rise, then put the plain text back */
  const hero = document.querySelector(".hero");
  const title = document.querySelector("[data-lines]");
  function splitLines(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(" ").map((w) => `<span class="w">${w}</span>`).join(" ");
    const lines = [];
    let top = null;
    el.querySelectorAll(".w").forEach((w) => {
      if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map((l, i) => `<span class="line" style="--i:${i}"><span>${l.join(" ")}</span></span>`).join("");
    el.setAttribute("aria-label", text);
    return text;
  }
  if (hero) {
    const lightsOn = () => hero.classList.add("is-on");
    if (reduced.matches || !title) lightsOn();
    else {
      const ready = document.fonts ? document.fonts.ready : Promise.resolve();
      ready.then(() => {
        const text = splitLines(title);
        title.classList.add("is-split");
        requestAnimationFrame(() => requestAnimationFrame(lightsOn));
        setTimeout(() => { title.textContent = text; title.removeAttribute("aria-label"); }, 2400);
      });
    }
  }

  /* Hero: the cakes take turns under the candle */
  const stage = document.querySelector("[data-stage]");
  if (stage) {
    const slides = [...stage.querySelectorAll("[data-slide]")];
    const dots = [...stage.querySelectorAll("[data-dot]")];
    const plate = stage.querySelector(".plate");
    const pName = stage.querySelector("[data-plate-name]");
    const pNote = stage.querySelector("[data-plate-note]");
    let i = 0, timer = null, turns = 0, held = false, visible = true;

    const go = (n) => {
      if (n === i) return;
      slides[i].classList.remove("is-on");
      i = (n + slides.length) % slides.length;
      const s = slides[i];
      if (!s.complete) s.loading = "eager";
      s.classList.add("is-on");
      dots.forEach((d, k) => d.setAttribute("aria-pressed", String(k === i)));
      plate.classList.add("is-changing");
      setTimeout(() => {
        pName.textContent = s.dataset.name;
        pNote.textContent = s.dataset.note;
        plate.classList.remove("is-changing");
      }, 320);
    };
    const tick = () => {
      if (held || !visible || document.hidden) return;
      go(i + 1);
      if (i === 0 && ++turns >= 2) stop();
    };
    const start = () => { if (!reduced.matches && !timer) timer = setInterval(tick, 5200); };
    const stop = () => { clearInterval(timer); timer = null; };

    dots.forEach((d) => d.addEventListener("click", () => { stop(); go(+d.dataset.dot); }));
    stage.addEventListener("pointerenter", () => { held = true; });
    stage.addEventListener("pointerleave", () => { held = false; });
    stage.addEventListener("focusin", () => { held = true; });
    stage.addEventListener("focusout", () => { held = false; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
    }
    setTimeout(start, 2400);
  }

  /* Band: two copies of the themes so the loop never shows a seam */
  const ticker = document.querySelector(".band-track");
  if (ticker) ticker.innerHTML += ticker.innerHTML;

  /* Bar turns solid once the page moves; the nav marks where you are */
  const bar = document.querySelector("[data-bar]");
  const navLinks = [...document.querySelectorAll(".nav a")];
  const onBar = () => bar && bar.classList.toggle("is-solid", scrollY > 24);
  addEventListener("scroll", onBar, { passive: true });
  onBar();
  if ("IntersectionObserver" in window) {
    const marks = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-here", a.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); s && marks.observe(s); });
    hero && marks.observe(hero); // back at the top, no section is marked
  }

  /* Gallery: pinned on wide screens, the light travels from the first cake to the last */
  const gallery = document.querySelector("[data-gallery]");
  const track = document.querySelector("[data-track]");
  const items = track ? [...track.children] : [];
  const gdots = [];
  if (track) {
    const row = document.createElement("div");
    row.className = "g-dots";
    row.setAttribute("aria-hidden", "true");
    items.forEach(() => gdots.push(row.appendChild(document.createElement("span"))));
    const foot = document.createElement("div");
    foot.className = "g-foot";
    track.parentElement.after(foot);
    foot.append(row);
    const more = gallery && gallery.querySelector(".g-more");
    if (more) foot.append(more);
  }
  let distance = 0;
  const SPEED = 2.2; // the cakes travel faster than the page scrolls

  function layoutGallery() {
    if (!gallery || !track) return;
    const pin = wide.matches && !reduced.matches;
    gallery.classList.toggle("is-pinned", pin);
    if (pin) {
      track.style.setProperty("--x", "0px");
      distance = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      gallery.style.setProperty("--pin-h", `${innerHeight + distance / SPEED}px`);
    } else {
      gallery.style.removeProperty("--pin-h");
      track.style.removeProperty("--x");
    }
    lightGallery();
  }

  function lightGallery() {
    if (!track || !items.length) return;
    const pinned = gallery.classList.contains("is-pinned");
    let p;
    if (pinned) {
      p = clamp(-gallery.getBoundingClientRect().top / Math.max(1, distance / SPEED), 0, 1);
      track.style.setProperty("--x", `${(-p * distance).toFixed(1)}px`);
    } else {
      const max = track.scrollWidth - track.clientWidth;
      p = max > 0 ? clamp(track.scrollLeft / max, 0, 1) : 0;
    }
    const first = items[0].getBoundingClientRect();
    const last = items[items.length - 1].getBoundingClientRect();
    const span = (last.left + last.width / 2) - (first.left + first.width / 2);
    const light = first.left + first.width / 2 + p * span;
    items.forEach((it, k) => {
      const r = it.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - light);
      const lit = clamp(1 - d / (r.width * 0.95), 0, 1).toFixed(3);
      it.style.setProperty("--lit", lit);
      gdots[k] && gdots[k].style.setProperty("--lit", lit);
    });
  }

  track && track.addEventListener("focusin", (e) => {
    track.parentElement.scrollLeft = 0;
    if (!gallery.classList.contains("is-pinned")) return;
    const k = items.indexOf(e.target.closest(".g-item"));
    if (k < 0) return;
    requestAnimationFrame(() => {
      const top = gallery.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + (k / (items.length - 1)) * (distance / SPEED), behavior: "instant" });
    });
  });

  /* Hero: the arch rises a little slower than the page and its light grows */
  const stageEl = document.querySelector("[data-stage]");
  function heroDrift() {
    if (!stageEl || reduced.matches || scrollY > innerHeight * 1.2) return;
    stageEl.style.setProperty("--hp", clamp(scrollY / innerHeight, 0, 1).toFixed(3));
  }

  let frame = false;
  const onScroll = () => {
    if (frame) return;
    frame = true;
    requestAnimationFrame(() => { frame = false; lightGallery(); drift(); heroDrift(); });
  };
  addEventListener("scroll", onScroll, { passive: true });
  track && track.addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", layoutGallery);
  wide.addEventListener("change", layoutGallery);
  if (document.fonts) document.fonts.ready.then(layoutGallery);
  addEventListener("load", layoutGallery);
  layoutGallery();

  /* A slow drift on the big photographs */
  const drifters = [...document.querySelectorAll("[data-drift]")];
  function drift() {
    if (reduced.matches) return;
    drifters.forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.setProperty("--py", `${(c * -28).toFixed(1)}px`);
    });
  }

  /* Steps: one candle lit at a time */
  const steps = [...document.querySelectorAll("[data-step]")];
  if ("IntersectionObserver" in window && steps.length) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-lit", e.isIntersecting));
    }, { rootMargin: "-38% 0px -38% 0px" });
    steps.forEach((s) => so.observe(s));
  } else steps.forEach((s) => s.classList.add("is-lit"));

  /* Order: the name on the cake, the days left, and the candle you blow */
  const form = document.querySelector("[data-order]");
  const THEMES = {
    "Dragones y fantasía": { cake: "#5a2c19", drip: "#2b140b", band: "#ffb21a", plaque: "#fff6e6", letter: "#d7262e", candle: "#d7262e" },
    "Dinosaurios": { cake: "#6b4a2b", drip: "#3f8f3a", band: "#9fd36a", plaque: "#f3e3b5", letter: "#2f6b2a", candle: "#3f8f3a" },
    "Películas y series": { cake: "#232842", drip: "#0d0f1f", band: "#ffc53a", plaque: "#fff6e6", letter: "#c8102e", candle: "#6b3fa0" },
    "Videojuegos": { cake: "#3aa0e8", drip: "#e3262b", band: "#ffc53a", plaque: "#fff6e6", letter: "#e3262b", candle: "#2fa84f" },
    "Infantil y animalitos": { cake: "#fff6e6", drip: "#ffc53a", band: "#f2679f", plaque: "#ffd95e", letter: "#14183a", candle: "#f2679f" },
    "Princesas y flores": { cake: "#f8c9dc", drip: "#ffffff", band: "#6b3fa0", plaque: "#fff6e6", letter: "#6b3fa0", candle: "#f2679f" },
    "Deportes y pasiones": { cake: "#2f8f4e", drip: "#14183a", band: "#fff6e6", plaque: "#fff6e6", letter: "#14183a", candle: "#ffc53a" },
    "Otra idea": { cake: "#25b0b4", drip: "#14183a", band: "#ffc53a", plaque: "#fff6e6", letter: "#6b3fa0", candle: "#ffc53a" },
  };

  if (form) {
    const $ = (s) => form.querySelector(s);
    const fName = $("#f-name"), fAge = $("#f-age"), fTheme = $("#f-theme"),
      fPeople = $("#f-people"), fDate = $("#f-date"), fIdea = $("#f-idea");
    const cake = document.querySelector("[data-cake]");
    const nameText = document.querySelector("[data-name-text]");
    const ageText = document.querySelector("[data-age]");
    const label = document.querySelector("#cake-label");
    const msgOut = document.querySelector("[data-message]");
    const daysOut = form.querySelector("[data-days]");
    const fallback = form.querySelector("[data-fallback-text]");
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    fDate.min = iso(today);

    const parse = (v) => { const d = new Date(`${v}T12:00:00`); return isNaN(d) ? null : d; };
    const longDate = (d) => d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
    const daysLeft = (d) => Math.round((d - today) / 86400000);

    function message() {
      const lines = ["Hola Crazy Cakes, quiero cotizar una torta personalizada."];
      const name = fName.value.trim();
      if (name) lines.push(`Nombre en la torta: ${name}${fAge.value ? `, ${fAge.value} años` : ""}`);
      else if (fAge.value) lines.push(`Edad: ${fAge.value} años`);
      lines.push(`Temática: ${fTheme.value}`);
      if (fPeople.value) lines.push(`Para unas ${fPeople.value} personas`);
      const d = parse(fDate.value);
      if (d) lines.push(`Fecha: ${longDate(d)}${daysLeft(d) >= 0 ? ` (faltan ${daysLeft(d)} días)` : ""}`);
      if (fIdea.value.trim()) lines.push(`Idea: ${fIdea.value.trim()}`);
      return lines.join("\n");
    }

    function days() {
      const d = parse(fDate.value);
      if (!d) { daysOut.textContent = "Mientras antes la pidas, más fácil es separar tu fecha."; return; }
      const n = daysLeft(d);
      if (n < 0) daysOut.textContent = "Esa fecha ya pasó: revisa el día y el año.";
      else if (n === 0) daysOut.innerHTML = "<strong>Es hoy.</strong> Escríbenos ya y miramos si hay cupo.";
      else if (n <= 7) daysOut.innerHTML = `<strong>Faltan ${n} ${n === 1 ? "día" : "días"}.</strong> Escríbenos ya para confirmar si hay cupo.`;
      else daysOut.innerHTML = `<strong>Faltan ${n} días</strong> para tu celebración: buen momento para separar la fecha.`;
    }

    function render() {
      const raw = fName.value.trim() || "Rocco";
      const name = raw.charAt(0).toUpperCase() + raw.slice(1);
      nameText.textContent = name;
      nameText.style.fontSize = "56px";
      const w = nameText.getComputedTextLength ? nameText.getComputedTextLength() : 0;
      if (w > 250) nameText.style.fontSize = `${Math.max(26, 56 * (250 / w)).toFixed(1)}px`;
      const age = fAge.value.trim().slice(0, 3) || "5";
      ageText.textContent = age || "";
      const t = THEMES[fTheme.value] || THEMES["Otra idea"];
      Object.entries(t).forEach(([k, v]) => cake.style.setProperty(`--${k}`, v));
      label.textContent = `Vista previa de la torta con el nombre ${name}${age ? ` y una vela de ${age}` : ""}`;
      days();
      const text = message();
      msgOut.textContent = text;
      fallback.value = text;
    }

    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message())}`, "_blank", "noopener");
      const room = cake.closest("[data-room]");
      [cake, room].forEach((el) => { el && el.classList.remove("is-blown"); });
      void cake.getBoundingClientRect();
      [cake, room].forEach((el) => { el && el.classList.add("is-blown"); });
      setTimeout(() => [cake, room].forEach((el) => el && el.classList.remove("is-blown")), 2600);
    });

    // A cake in the gallery opens the order already themed after it
    document.querySelectorAll("[data-pick]").forEach((a) => a.addEventListener("click", () => {
      fTheme.value = a.dataset.theme;
      const n = a.querySelector(".g-name");
      fIdea.value = `Algo como la torta de ${n ? n.textContent.trim() : "la galería"} (${a.dataset.kind.toLowerCase()})`;
      render();
      setTimeout(() => fName.focus({ preventScroll: true }), 700);
    }));

    if (document.fonts) document.fonts.ready.then(render);
    render();
  }

  /* Phone dock hides where the order already is */
  const dock = document.querySelector("[data-dock]");
  if (dock && "IntersectionObserver" in window) {
    const hide = new Set();
    const dio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? hide.add(e.target) : hide.delete(e.target)));
      dock.classList.toggle("is-hidden", hide.size > 0);
    });
    [hero, document.querySelector("#pedido"), document.querySelector(".foot")].forEach((el) => el && dio.observe(el));
  }

  /* Entrances: heading, then text, then picture, once per section */
  const reveals = [...document.querySelectorAll("[data-reveal], [data-open]")];
  if (reduced.matches || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    // On phones only the headings rise; everything else is simply there
    if (matchMedia("(max-width: 760px)").matches) reveals.forEach((el) => { if (!el.matches("h2")) el.classList.add("is-in"); });
    const groups = new Map();
    reveals.forEach((el) => {
      const g = el.closest("li, figure, section, footer") || document.body;
      const list = groups.get(g) || [];
      el.style.setProperty("--d", `${list.length * 80}ms`);
      list.push(el);
      groups.set(g, list);
    });
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => { if (!el.classList.contains("is-in")) ro.observe(el); });
  }
})();
