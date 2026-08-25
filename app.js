const HALLS = [
  { id: "vestibule", title: "Вестибюль", nav: false },
  { id: "origin", title: "Происхождение", nav: true },
  { id: "childhood", title: "Детство", nav: true },
  { id: "school", title: "Школа", nav: true },
  { id: "people", title: "Люди рядом", nav: true },
  { id: "portraits", title: "Сквозь годы", nav: true },
  { id: "dreams", title: "Мечты и выборы", nav: true },
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
  if (goBtn) {
    event.preventDefault();
    goTo(goBtn.dataset.go);
  }
});

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
  }
});

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");

function openLightbox(src, alt) {
  lightboxImage.src = src;
  lightboxImage.alt = alt || "";
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
}

document.addEventListener("click", (event) => {
  const frame = event.target.closest("[data-lightbox]");
  if (frame) {
    event.preventDefault();
    const img = frame.querySelector("img");
    openLightbox(frame.dataset.lightbox, img ? img.alt : "");
  }
});

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

buildPlan();
goTo("vestibule", { instant: true });
