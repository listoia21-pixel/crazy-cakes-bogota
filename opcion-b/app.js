// Crazy Cakes Bogotá · Opción B «Edición única»
// The box is set down at load and turns in your hand, the shelf drags, the back-of-box
// contents print row by row, and the order builds your own edition live.
(() => {
  const WA = "573171812316";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  root.classList.add("js");

  /* Hero: title lines rise, the box is set down, the seal is stamped */
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
    const on = () => hero.classList.add("is-on");
    if (reduced.matches || !title) on();
    else {
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
        const text = splitLines(title);
        title.classList.add("is-split");
        requestAnimationFrame(() => requestAnimationFrame(on));
        setTimeout(() => { title.textContent = text; title.removeAttribute("aria-label"); }, 2200);
      });
    }
  }

  /* Hero: a new edition takes the window every few seconds */
  const heroBox = document.querySelector("[data-hero-box]");
  if (heroBox) {
    const slides = [...heroBox.querySelectorAll("[data-slide]")];
    const dots = [...heroBox.querySelectorAll("[data-dot]")];
    const strip = heroBox.querySelector(".strip");
    const sName = heroBox.querySelector("[data-strip-name]");
    const sNote = heroBox.querySelector("[data-strip-note]");
    const no = heroBox.querySelector("[data-hero-no]");
    let i = 0, timer = null, turns = 0, held = false, visible = true;

    const go = (n) => {
      if (n === i) return;
      const prev = slides[i];
      prev.classList.remove("is-on");
      prev.classList.add("is-off");
      setTimeout(() => prev.classList.remove("is-off"), 900);
      i = (n + slides.length) % slides.length;
      const s = slides[i];
      if (!s.complete) s.loading = "eager";
      s.classList.add("is-on");
      dots.forEach((d, k) => d.setAttribute("aria-pressed", String(k === i)));
      strip.classList.add("is-printing");
      setTimeout(() => {
        sName.textContent = s.dataset.name;
        sNote.textContent = s.dataset.note;
        no.textContent = s.dataset.no;
        strip.classList.remove("is-printing");
      }, 300);
    };
    const tick = () => {
      if (held || !visible || document.hidden) return;
      go(i + 1);
      if (i === 0 && ++turns >= 2) stop();
    };
    const start = () => { if (!reduced.matches && !timer) timer = setInterval(tick, 5200); };
    const stop = () => { clearInterval(timer); timer = null; };
    dots.forEach((d) => d.addEventListener("click", () => { stop(); go(+d.dataset.dot); }));
    heroBox.addEventListener("focusin", () => { held = true; });
    heroBox.addEventListener("focusout", () => { held = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(heroBox);
    setTimeout(start, 2400);

    // The box turns in your hand
    if (hero && finePointer.matches && !reduced.matches) {
      hero.addEventListener("pointermove", (e) => {
        const r = heroBox.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
        const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
        heroBox.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
        heroBox.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
        held = true;
      });
      hero.addEventListener("pointerleave", () => {
        heroBox.style.setProperty("--ry", "0deg");
        heroBox.style.setProperty("--rx", "0deg");
        held = false;
      });
    }
  }

  /* Bar and current section */
  const bar = document.querySelector("[data-bar]");
  const onBar = () => bar && bar.classList.toggle("is-solid", scrollY > 24);
  addEventListener("scroll", onBar, { passive: true });
  onBar();
  const navLinks = [...document.querySelectorAll(".nav a")];
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

  /* Shelf: boxes drop onto it, it drags, the arrows page through it */
  const shelf = document.querySelector("[data-shelf-track]");
  if (shelf) {
    const items = [...shelf.children];
    items.forEach((li, k) => {
      li.style.setProperty("--k", k);
      li.style.setProperty("--r", `${(k % 2 ? 3 : -3) + (k % 3) - 1}deg`);
    });
    const prev = document.querySelector('[data-shelf="-1"]');
    const next = document.querySelector('[data-shelf="1"]');
    const ends = () => {
      const max = shelf.scrollWidth - shelf.clientWidth - 4;
      prev && (prev.disabled = shelf.scrollLeft <= 4);
      next && (next.disabled = shelf.scrollLeft >= max);
    };
    const page = (dir) => {
      const w = items[0].getBoundingClientRect().width + 20;
      shelf.scrollBy({ left: dir * w * Math.max(1, Math.floor(shelf.clientWidth / w) - 1), behavior: reduced.matches ? "auto" : "smooth" });
    };
    prev && prev.addEventListener("click", () => page(-1));
    next && next.addEventListener("click", () => page(1));
    shelf.addEventListener("scroll", ends, { passive: true });
    addEventListener("resize", ends);
    ends();

    // Drag with the mouse; touch keeps its native swipe
    let down = false, startX = 0, startLeft = 0, moved = 0;
    shelf.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = 0; startX = e.clientX; startLeft = shelf.scrollLeft;
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) shelf.classList.add("is-dragging");
      shelf.scrollLeft = startLeft - dx;
    });
    addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      shelf.classList.remove("is-dragging");
    });
    shelf.addEventListener("click", (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    shelf.addEventListener("dragstart", (e) => e.preventDefault());

    if (reduced.matches || !("IntersectionObserver" in window)) shelf.classList.add("is-in");
    else {
      const so = new IntersectionObserver(([e]) => { if (e.isIntersecting) { shelf.classList.add("is-in"); so.disconnect(); } }, { rootMargin: "0px 0px -15% 0px" });
      so.observe(shelf);
    }
  }

  /* Back of the box: rows print one after the other */
  document.querySelectorAll(".spec tr").forEach((tr, k) => tr.style.setProperty("--k", k));

  /* Order: build your own edition */
  const form = document.querySelector("[data-order]");
  const THEMES = {
    "Dragones y fantasía": { box: "var(--pink)", ink: "#1d2142", photo: "dragon-rojo", alt: "torta de dragón rojo" },
    "Dinosaurios": { box: "var(--teal-deep)", ink: "#ffffff", photo: "dinosaurios", alt: "torta de dinosaurios" },
    "Películas y series": { box: "var(--ink)", ink: "#ffffff", photo: "stranger-things", alt: "torta de Stranger Things" },
    "Videojuegos": { box: "var(--purple)", ink: "#ffffff", photo: "mario", alt: "torta de Mario Bros" },
    "Infantil y animalitos": { box: "var(--flame)", ink: "#1d2142", photo: "paw-patrol", alt: "torta de Paw Patrol" },
    "Princesas y flores": { box: "var(--pink)", ink: "#1d2142", photo: "moana", alt: "torta de Moana" },
    "Deportes y pasiones": { box: "var(--teal-deep)", ink: "#ffffff", photo: "paintball", alt: "torta de un equipo de paintball" },
    "Otra idea": { box: "var(--purple)", ink: "#ffffff", photo: "abejita", alt: "torta de abejita" },
  };

  if (form) {
    const $ = (s) => form.querySelector(s);
    const fName = $("#f-name"), fAge = $("#f-age"), fTheme = $("#f-theme"),
      fPeople = $("#f-people"), fDate = $("#f-date"), fIdea = $("#f-idea");
    const box = document.querySelector("[data-order-box]");
    const photo = document.querySelector("[data-order-photo]");
    const bName = document.querySelector("[data-box-name]");
    const bNote = document.querySelector("[data-box-note]");
    const bAge = document.querySelector("[data-box-age]");
    const bDate = document.querySelector("[data-box-date]");
    const msgOut = document.querySelector("[data-message]");
    const daysOut = form.querySelector("[data-days]");
    const fallback = form.querySelector("[data-fallback-text]");
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    fDate.min = iso(today);
    const parse = (v) => { const d = new Date(`${v}T12:00:00`); return isNaN(d) ? null : d; };
    const longDate = (d) => d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
    const daysLeft = (d) => Math.round((d - today) / 86400000);
    let lastTheme = fTheme.value, lastName = "";

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

    function render() {
      const name = fName.value.trim() || "Rocco";
      const age = fAge.value.trim().slice(0, 3) || "5";
      const t = THEMES[fTheme.value] || THEMES["Otra idea"];
      bName.textContent = name;
      bAge.textContent = age;
      box.style.setProperty("--box", t.box);
      box.style.color = t.ink;
      bNote.textContent = `${fTheme.value} · para ${fPeople.value || 25} personas`;

      if (fTheme.value !== lastTheme) {
        lastTheme = fTheme.value;
        photo.classList.add("is-swapping");
        setTimeout(() => {
          photo.src = `../assets/tortas/${t.photo}.jpg`;
          photo.alt = `Foto de referencia: ${t.alt}`;
          photo.onload = () => photo.classList.remove("is-swapping");
        }, 220);
      }
      if (name !== lastName && !reduced.matches) {
        lastName = name;
        box.classList.remove("is-bump");
        void box.offsetWidth;
        box.classList.add("is-bump");
      }

      const d = parse(fDate.value);
      if (!d) {
        bDate.textContent = "Edición del día que elijas";
        daysOut.textContent = "Mientras antes la pidas, más fácil es separar tu fecha.";
      } else {
        const n = daysLeft(d);
        bDate.textContent = `Edición del ${longDate(d)}`;
        if (n < 0) daysOut.textContent = "Esa fecha ya pasó: revisa el día y el año.";
        else if (n === 0) daysOut.innerHTML = "<strong>Es hoy.</strong> Escríbenos ya y miramos si hay cupo.";
        else if (n <= 7) daysOut.innerHTML = `<strong>Faltan ${n} ${n === 1 ? "día" : "días"}.</strong> Escríbenos ya para confirmar si hay cupo.`;
        else daysOut.innerHTML = `<strong>Faltan ${n} días</strong> para tu celebración: buen momento para separar la fecha.`;
      }
      const text = message();
      msgOut.textContent = text;
      fallback.value = text;
    }

    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message())}`, "_blank", "noopener");
    });

    document.querySelectorAll("[data-pick]").forEach((a) => a.addEventListener("click", () => {
      fTheme.value = a.dataset.theme;
      const n = a.querySelector(".strip-name");
      fIdea.value = `Algo como la torta de ${n ? n.textContent.trim() : "la colección"} (${a.dataset.kind.toLowerCase()})`;
      render();
      setTimeout(() => fName.focus({ preventScroll: true }), 700);
    }));

    lastName = fName.value.trim() || "Rocco";
    render();
  }

  /* Phone dock */
  const dock = document.querySelector("[data-dock]");
  if (dock && "IntersectionObserver" in window) {
    const hide = new Set();
    const dio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? hide.add(e.target) : hide.delete(e.target)));
      dock.classList.toggle("is-hidden", hide.size > 0);
    });
    [hero, document.querySelector("#pedido"), document.querySelector(".foot")].forEach((el) => el && dio.observe(el));
  }

  /* Entrances */
  const reveals = [...document.querySelectorAll("[data-reveal]")];
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
