<<<<<<< HEAD

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
=======
gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   THEME TOGGLE (dark/light) + MOBILE HAMBURGER NAV
   Self-contained, runs regardless of what else on the page succeeds.
   The initial theme itself is already applied by the inline script in
   <head> (to avoid a flash) — this only wires up the click handlers and
   keeps localStorage in sync.
   ============================================================ */

(function initThemeToggle(){
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", function(){
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight){
      document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem("theme", "dark"); } catch (e) {}
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      try { localStorage.setItem("theme", "light"); } catch (e) {}
    }
  });
})();

(function initMobileNav(){
  const hamburger = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  const backdrop = document.getElementById("mobileNavBackdrop");
  if (!hamburger || !mobileNav) return;

  function closeMenu(){
    hamburger.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
  }

  function openMenu(){
    hamburger.setAttribute("aria-expanded", "true");
    mobileNav.classList.add("is-open");
    if (backdrop) backdrop.classList.add("is-open");
  }

  hamburger.addEventListener("click", function(){
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMenu(); else openMenu();
  });

  if (backdrop) backdrop.addEventListener("click", closeMenu);

  // Close on link tap and let the native #anchor jump happen underneath.
  mobileNav.querySelectorAll(".mobile-nav-link").forEach(function(link){
    link.addEventListener("click", closeMenu);
  });

  // If the viewport is resized past the mobile breakpoint while the
  // drawer is open (e.g. rotating a tablet), don't leave it stuck open.
  window.addEventListener("resize", function(){
    if (window.innerWidth > 768) closeMenu();
  });
})();

/* ============================================================
>>>>>>> 67d00d90473c5bf1874e5e00997eeebbc820b441
   LOCOMOTIVE SCROLL + SCROLLTRIGGER SETUP
   This is the only new "system" being introduced. Everything below it
   (tab switching, typed.js, the horizontal scroll pin, the existing
   ScrollTrigger reveal animations) plugs into this single scroll source.
   ============================================================ */

const scrollContainer = document.querySelector("[data-scroll-container]");

<<<<<<< HEAD
const locoScroll = new LocomotiveScroll({
  el: scrollContainer,
  smooth: true,
=======
// Below this width the horizontal-pin scroll effect (see the
// ScrollTrigger.create for .sticky_parent further down) is switched off in
// favor of a plain, native, vertically-stacked layout — see the matching
// max-width:768px override in style.css for .sticky_parent/.scroll_section.
const isMobileLayout = window.matchMedia("(max-width: 768px)").matches;

const locoScroll = new LocomotiveScroll({
  el: scrollContainer,
  smooth: !isMobileLayout, // native scroll on mobile — smoother, cheaper, and pairs with the stacked layout
>>>>>>> 67d00d90473c5bf1874e5e00997eeebbc820b441
  multiplier: 0.6, // lower = each scroll tick travels less distance (slower feel)
  lerp: 0.05, // lower = more gradual catch-up/glide before settling (slower, smoother)
});

// Keep ScrollTrigger in sync with Locomotive's (smoothed) scroll position every frame.
locoScroll.on("scroll", ScrollTrigger.update);

// Tell ScrollTrigger to measure/scroll through Locomotive instead of the native window.
ScrollTrigger.scrollerProxy(scrollContainer, {
  scrollTop(value) {
    return arguments.length
      ? locoScroll.scrollTo(value, { duration: 0, disableLerp: true })
      : locoScroll.scroll.instance.scroll.y;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  },
  pinType: scrollContainer.style.transform ? "transform" : "fixed",
});

// Every ScrollTrigger instance below now targets this scroller.
ScrollTrigger.defaults({ scroller: scrollContainer });

// Keep the two in sync after layout changes (images loading, resize, etc.).
ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
window.addEventListener("load", () => {
  locoScroll.update();
  ScrollTrigger.refresh();
});

gsap.to("nav", {
  backgroundColor: "#0D1117",
  height: "4vh",
  duration: 0.5,
  scrollTrigger: {
      trigger: ".nav",
      // markers : true,
      start: "top -10%",
      end: "top -11%",
      scrub:51
  }
})

var tablinks = document.getElementsByClassName("tab-links");

var tabcontents = document.getElementsByClassName("tab-contents");

function opentab(tabname){
  for(tablink of tablinks){
    tablink.classList.remove("active-link");
  }
  for(tabcontent of tabcontents){
    tabcontent.classList.remove("active-tab");
  }
  event.currentTarget.classList.add("active-link");
  document.getElementById(tabname).classList.add("active-tab")
}

/* ============================================================
   HORIZONTAL SCROLL SECTION (replaces the old manual
   `window.addEventListener('scroll', transform)` + CSS `position: sticky`
   pair — neither survives Locomotive taking over scrolling).

   .scroll_section holds 3 panels (projects, experience, education) —
   300vw wide inside a 100vw viewport, so the pin needs to translate it
   by exactly -200vw to reveal all three panels edge-to-edge.

   self.progress runs 0→1 across the full pinned scroll distance (the
   250vh gap between .sticky_parent's "top top" and "bottom bottom" —
   350vh tall minus the 100vh viewport), so `self.progress * 200` maps
   that 1:1 onto the 0→200vw translate: the panels finish revealing
   exactly as the pin releases, with no flat/frozen scroll region.
   (Previously this divided progress by 0.8 first, which maxed out the
   translate at 80% of the scroll distance and then held the pin
   completely still — no visible movement — for the remaining 20%,
   which is what showed up as scrolling "freezing" after the third
   panel.)
   ============================================================ */

<<<<<<< HEAD
ScrollTrigger.create({
  trigger: ".sticky_parent",
  start: "top top",
  end: "bottom bottom",
  pin: ".sticky",
  pinSpacing: false, // .sticky_parent's own 350vh height already reserves the scroll room
  invalidateOnRefresh: true,
  onUpdate: (self) => {
    const percentage = self.progress * 200;
    gsap.set(".scroll_section", { x: `-${percentage}vw` });
  },
})
=======
if (!isMobileLayout) {
  ScrollTrigger.create({
    trigger: ".sticky_parent",
    start: "top top",
    end: "bottom bottom",
    pin: ".sticky",
    pinSpacing: false, // .sticky_parent's own 350vh height already reserves the scroll room
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const percentage = self.progress * 200;
      gsap.set(".scroll_section", { x: `-${percentage}vw` });
    },
  })
}
// On mobile, .sticky_parent/.sticky/.scroll_section fall back to their
// plain static/stacked CSS (see style.css) and the three panels
// (.projects, .experience, .education) simply flow vertically like any
// other section — no pin, no horizontal translate.
>>>>>>> 67d00d90473c5bf1874e5e00997eeebbc820b441
//APPROACH ONE
// Guarded: these tab/panel elements aren't part of the current markup.
// Querying them is harmless, but calling .addEventListener on a null
// result throws and used to halt every script statement below this
// block (including the reveal animations further down) — only wire
// the tabs up when they actually exist.
var t1 = document.querySelector("#tab1")
var t2 = document.querySelector("#tab2")
var t3 = document.querySelector("#tab3")
var p1 = document.querySelector("#p1")
var p2 = document.querySelector("#p2")
var p3 = document.querySelector("#p3")

var removeAllElement = function(){
  if (p1) p1.style.display = "none"
  if (p2) p2.style.display = "none"
  if (p3) p3.style.display = "none"
}

if (t1 && p1) {
  t1.addEventListener("click", function(){
    removeAllElement()
    p1.style.display = "block"
  })
}

if (t2 && p2) {
  t2.addEventListener("click", function(){
    removeAllElement()
    p2.style.display = "block"
  })
}

if (t3 && p3) {
  t3.addEventListener("click", function(){
    removeAllElement()
    p3.style.display = "block"
  })
}

//APPROACH TWO
// var tab = document.querySelector(".tab")
// var txt = document.querySelector(".txt")

// txt[0].style.display = "block"




const container = document.querySelector('.progress-bars')
const progress = document.querySelectorAll('.progress')
const percentage = document.querySelectorAll('.percentage')
let bol = false;
let count; 

// Was window.addEventListener("scroll", ...) reading pageYOffset — under Locomotive the
// native scroll position stays at 0, so this is now driven by Locomotive's own scroll event.
locoScroll.on("scroll", (obj) => {
  if(container && obj.scroll.y > container.offsetTop - 400 && bol === false){
      for(let i = 0; i < progress.length; i++){
          percentage.innerText = 0;
          count = 0;
          const data = parseInt(progress[i].dataset.count)

          progress[i].style.transition = "width " + (data * 30) + "ms"
          progress[i].style.width = data + "%"

          function updateCount(){
              if(count < data){
                  count++
                  percentage[i].innerText = count + "%"
                  setTimeout(updateCount, 50)
              }else{
                  percentage[i].innerText = data + "%"
              }
          }
          updateCount()
          bol = true;
      }
  }
})

var tl = gsap.timeline()

tl.from(".nav-left, .nav-right a",{
  y:-150,
  // delay:0.5,
  duration:1,
  stagger:0.2
})

tl.from(".home-content h1",{
  y: 50,
  opacity:0,
  duration:0.5,
  stagger:0.5
})

tl.from(".projects-marquee-track span",{
  opacity:0,
  duration:1,
  stagger:0.5,
  scrollTrigger:{
      trigger: ".projects",
      scrub:5,
      markers:false,
      start: "top 70%",
      end: "top 30%"
  }
})

tl.from(".project-card",{
  y: 50,
  opacity:0,
  duration:0.5,
  stagger:0.5,
  scrollTrigger:{
      trigger: ".projects-grid",
      scrub:5,
      markers:false,
      start: "top 80%",
      end: "top 30%"

  }
})

tl.to(".skills",{
  x: 50,
  delay:1,
  opacity:0,
  duration:0.5,
  stagger:0.5,
  scrollTrigger:{
      trigger: ".skills h1",
      markers:false,
      scrub:5,
      start: "top 70%",
      end: "top 20%"

  }
})

/* ============================================================
   REWORKED SECTION ENTRANCES (Work / Skills / Contact)
   Same reveal pattern as the projects/experience panels above —
   scrub-tied ScrollTrigger fades rather than a one-shot timeline,
   since these panels sit inside the horizontal-scroll track and
   aren't guaranteed to be "scrolled into view" vertically.
   Respects prefers-reduced-motion, per the project's convention.
   ============================================================ */

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // Same trigger/scrub shape as the existing .project-card reveal above —
  // .work-item lives inside the same pinned horizontal track as .projects-grid.
  gsap.from(".work-item", {
    y: 20,
    opacity: 0,
    duration: 0.5,
    stagger: 0.15,
    scrollTrigger: {
      trigger: ".experience-work",
      scrub: 5,
      markers: false,
      start: "top 80%",
      end: "top 30%"
    }
  });

  // .contact sits after the horizontal-scroll track resumes normal vertical
  // flow, so a plain (non-scrubbed) reveal on true vertical entry works here.
  gsap.from(".contact-heading-line, .contact-message, .contact-social-btn", {
    y: 24,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    scrollTrigger: {
      trigger: ".contact",
      start: "top 75%"
    }
  });
}
