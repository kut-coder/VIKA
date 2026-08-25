const HALLS = [
  { id: "vestibule", title: "Вестибюль", nav: false },
  { id: "origin", title: "Происхождение", nav: true },
  { id: "childhood", title: "Детство", nav: true },
  { id: "school", title: "Школьные годы", nav: true },
  { id: "people", title: "Люди рядом", nav: true },
  { id: "friends", title: "С друзьями", nav: true },
  { id: "hobbies", title: "Увлечения", nav: true },
  { id: "chapter", title: "Глава, которая начинается", nav: true },
  { id: "foryou", title: "Для тебя", nav: true },
];

const TRANSITION_MS = 820;

const app = document.getElementById("app");
const topnav = document.getElementById("topnav");
const navCurrent = document.getElementById("nav-current");
const plan = document.getElementById("plan");
const planList = document.getElementById("plan-list");
const btnPlan = document.getElementById("btn-plan");
const btnPlanClose = document.getElementById("btn-plan-close");
const transitionVeil = document.getElementById("transition-veil");

let currentId = "vestibule";
let transitioning = false;

function getHall(id) {
  return app.querySelector(`[data-hall="${id}"]`);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function updateNav(next) {
  const showNav = next.nav;
  topnav.hidden = !showNav;
  navCurrent.textContent = showNav ? next.title : "";
}

function finishHallState(id, next) {
  currentId = id;
  updateNav(next);
  updatePlanCurrent();
  closePlan();
}

function goTo(id, { instant = false } = {}) {
  if (id === currentId) return;
  if (transitioning && !instant) return;

  const next = HALLS.find((h) => h.id === id);
  const section = getHall(id);
  if (!next || !section) return;

  const prev = getHall(currentId);
  const useMotion = !instant && !prefersReducedMotion() && prev;

  if (!useMotion) {
    if (prev) {
      prev.hidden = true;
      prev.classList.remove("is-active", "is-leaving", "is-entering");
    }
    section.hidden = false;
    section.classList.add("is-active");
    section.classList.remove("is-leaving", "is-entering");
    transitionVeil.classList.remove("is-visible");
    finishHallState(id, next);
    window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
    return;
  }

  transitioning = true;
  window.scrollTo({ top: 0, behavior: "auto" });

  section.hidden = false;
  section.classList.add("is-entering");
  section.classList.remove("is-active", "is-leaving");

  prev.classList.add("is-leaving");
  prev.classList.remove("is-active", "is-entering");

  transitionVeil.classList.add("is-visible");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      section.classList.remove("is-entering");
      section.classList.add("is-active");
    });
  });

  window.setTimeout(() => {
    prev.hidden = true;
    prev.classList.remove("is-leaving", "is-entering", "is-active");
    section.classList.remove("is-entering");
    transitionVeil.classList.remove("is-visible");
    transitioning = false;
    finishHallState(id, next);
  }, TRANSITION_MS);
}

function buildPlan() {
  planList.innerHTML = "";
  HALLS.forEach((hall, index) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.go = hall.id;
    btn.innerHTML = `<span class="num">${index}</span><span>${hall.title}</span>`;
    li.appendChild(btn);
    planList.appendChild(li);
  });
}

function updatePlanCurrent() {
  planList.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("is-current", btn.dataset.go === currentId);
  });
}

function openPlan() {
  plan.hidden = false;
  btnPlan.setAttribute("aria-expanded", "true");
  updatePlanCurrent();
}

function closePlan() {
  plan.hidden = true;
  btnPlan.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", (event) => {
  const goBtn = event.target.closest("[data-go]");
  if (!goBtn) return;
  event.preventDefault();

  if (goBtn.classList.contains("door-btn")) {
    openDoorAndEnter(goBtn);
    return;
  }

  goTo(goBtn.dataset.go);
});

function openDoorAndEnter(btn) {
  if (btn.classList.contains("is-opening") || transitioning) return;

  const target = btn.dataset.go;
  if (prefersReducedMotion()) {
    goTo(target);
    return;
  }

  btn.classList.add("is-opening");
  btn.setAttribute("aria-busy", "true");

  window.setTimeout(() => {
    goTo(target);
    window.setTimeout(() => {
      btn.classList.remove("is-opening");
      btn.removeAttribute("aria-busy");
    }, TRANSITION_MS + 80);
  }, 780);
}

btnPlan.addEventListener("click", () => {
  if (plan.hidden) openPlan();
  else closePlan();
});

btnPlanClose.addEventListener("click", closePlan);

plan.addEventListener("click", (event) => {
  if (event.target === plan) closePlan();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePlan();
    closeLightbox();
    return;
  }
  if (lightbox.hidden) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showLightboxAt(lightboxIndex - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    showLightboxAt(lightboxIndex + 1);
  }
});

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");
const lightboxCounter = document.getElementById("lightbox-counter");

let lightboxItems = [];
let lightboxIndex = 0;

function collectHallLightboxItems(frame) {
  const hall = frame.closest("[data-hall]");
  if (!hall) return [];
  return Array.from(hall.querySelectorAll("[data-lightbox]")).map((el) => {
    const img = el.querySelector("img");
    return {
      src: el.dataset.lightbox,
      alt: img ? img.alt : "",
    };
  });
}

function updateLightboxChrome() {
  const total = lightboxItems.length;
  const multi = total > 1;
  lightboxPrev.hidden = !multi;
  lightboxNext.hidden = !multi;
  lightboxCounter.hidden = !multi;
  if (multi) {
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${total}`;
  }
}

function showLightboxAt(index) {
  if (!lightboxItems.length) return;
  const total = lightboxItems.length;
  lightboxIndex = ((index % total) + total) % total;
  const item = lightboxItems[lightboxIndex];
  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt || "";
  updateLightboxChrome();
}

function openLightboxFromFrame(frame) {
  lightboxItems = collectHallLightboxItems(frame);
  const start = lightboxItems.findIndex((item) => item.src === frame.dataset.lightbox);
  lightboxIndex = start >= 0 ? start : 0;
  showLightboxAt(lightboxIndex);
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxItems = [];
  lightboxIndex = 0;
  lightboxCounter.hidden = true;
  lightboxPrev.hidden = true;
  lightboxNext.hidden = true;
}

document.addEventListener("click", (event) => {
  const frame = event.target.closest("[data-lightbox]");
  if (frame) {
    event.preventDefault();
    openLightboxFromFrame(frame);
  }
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", (event) => {
  event.stopPropagation();
  showLightboxAt(lightboxIndex - 1);
});
lightboxNext.addEventListener("click", (event) => {
  event.stopPropagation();
  showLightboxAt(lightboxIndex + 1);
});
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

let touchStartX = 0;
lightbox.addEventListener(
  "touchstart",
  (event) => {
    if (event.changedTouches.length === 1) {
      touchStartX = event.changedTouches[0].clientX;
    }
  },
  { passive: true }
);
lightbox.addEventListener(
  "touchend",
  (event) => {
    if (lightbox.hidden || lightboxItems.length < 2) return;
    if (event.changedTouches.length !== 1) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 50) return;
    if (delta > 0) showLightboxAt(lightboxIndex - 1);
    else showLightboxAt(lightboxIndex + 1);
  },
  { passive: true }
);

buildPlan();
goTo("vestibule", { instant: true });
