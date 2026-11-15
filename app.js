/* ============================================================
   LAYOUT MODES
   - Compact (<= 1024px: phones/tablets): plain native scrolling, vertically
     stacked sections, no Locomotive, no horizontal pin, lightweight reveals only.
   - Desktop (> 1024px): Locomotive smooth scroll + GSAP ScrollTrigger horizontal pin.
   style.css switches layouts at the same 1024px breakpoint.
   ============================================================ */

const COMPACT_QUERY = "(max-width: 1024px)";
const compactMQ = window.matchMedia(COMPACT_QUERY);
const isCompactLayout = compactMQ.matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The two layouts are built differently, so crossing the breakpoint (rotating a
// tablet, resizing a window) rebuilds the page rather than leaving half of one mode active.
compactMQ.addEventListener("change", function(){
  window.location.reload();
});

/* ============================================================
   MOBILE HAMBURGER NAV
   Self-contained: runs even if the CDN animation libraries fail to load.
   ============================================================ */

(function initMobileNav(){
  const hamburger = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  const backdrop = document.getElementById("mobileNavBackdrop");
  if (!hamburger || !mobileNav) return;

  function setOpen(open){
    hamburger.setAttribute("aria-expanded", String(open));
    mobileNav.classList.toggle("is-open", open);
    if (backdrop) backdrop.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open); // stop the page scrolling behind the drawer
  }

  hamburger.addEventListener("click", function(){
    setOpen(hamburger.getAttribute("aria-expanded") !== "true");
  });

  if (backdrop) backdrop.addEventListener("click", function(){ setOpen(false); });

  // Close on link tap; the native #anchor jump (smooth via CSS) happens underneath.
  mobileNav.querySelectorAll(".mobile-nav-link").forEach(function(link){
    link.addEventListener("click", function(){ setOpen(false); });
  });

  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") setOpen(false);
  });
})();

/* ============================================================
   COMPACT MODE: light "reveal on enter" (opacity/transform only)
   ============================================================ */

if (isCompactLayout) {
  (function initCompactReveals(){
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const targets = document.querySelectorAll(
      ".project-card, .work-item:not(.work-item-empty), .education-item, " +
      ".contact-heading-line, .contact-message, .contact-socials, .contact-email"
    );

    document.documentElement.classList.add("js-reveal");

    const observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    targets.forEach(function(el){
      el.classList.add("reveal");
      observer.observe(el);
    });
  })();
}

/* ============================================================
   DESKTOP MODE: Locomotive + ScrollTrigger horizontal pin
   ============================================================ */

if (!isCompactLayout) {
  (function initDesktopScroll(){
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      console.warn("GSAP/ScrollTrigger failed to load; scroll animations are disabled.");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const scrollContainer = document.querySelector("[data-scroll-container]");
    const hasLoco = typeof LocomotiveScroll !== "undefined" && !!scrollContainer;
    let locoScroll = null;

    if (hasLoco) {
      locoScroll = new LocomotiveScroll({
        el: scrollContainer,
        smooth: true,
        multiplier: 0.6, // lower = each scroll tick travels less distance
        lerp: 0.05,      // lower = longer glide before settling
      });

      // Keep ScrollTrigger in sync with Locomotive's (smoothed) scroll position.
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
        // Locomotive always drives the container with a CSS transform in smooth mode.
        pinType: "transform",
      });

      ScrollTrigger.defaults({ scroller: scrollContainer });
      ScrollTrigger.addEventListener("refresh", function(){ locoScroll.update(); });
    } else {
      console.warn("Locomotive Scroll failed to load; falling back to native scrolling.");
    }

    window.addEventListener("load", function(){
      if (locoScroll) locoScroll.update();
      ScrollTrigger.refresh();
    });

    // Web fonts change text metrics (and therefore layout heights): re-measure once they arrive.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function(){
        if (locoScroll) locoScroll.update();
        ScrollTrigger.refresh();
      });
    }

    /* ---------- Horizontal scroll section ----------
       .scroll_section is 300vw wide (3 panels: projects, experience, education) inside a
       100vw viewport. progress runs 0->1 over the 250vh pinned distance (350vh parent minus the
       100vh viewport) and maps 1:1 onto the 0 -> -200vw translate, so the last panel lands
       exactly as the pin releases (no dead scroll region). */
    const pinTrigger = ScrollTrigger.create({
      trigger: ".sticky_parent",
      start: "top top",
      end: "bottom bottom",
      pin: ".sticky",
      pinSpacing: false, // .sticky_parent's own 350vh height already reserves the scroll room
      invalidateOnRefresh: true,
      onUpdate: function(self){
        gsap.set(".scroll_section", { x: "-" + (self.progress * 200) + "vw" });
      },
    });

    /* ---------- Desktop nav links (jump to section) ----------
       Panels live inside the horizontal track, so a plain anchor jump can't reach them:
       map each section to the scroll position where the track reveals it. */
    const navLinks = Array.from(document.querySelectorAll(".nav-right a[data-nav]"));

    function sectionPositions(){
      const start = pinTrigger.start;
      const dist = pinTrigger.end - pinTrigger.start;
      const parent = document.querySelector(".sticky_parent");
      return {
        home: 0,
        projects: start,
        experience: start + dist * 0.5,
        education: pinTrigger.end - 2,
        contact: start + (parent ? parent.offsetHeight : dist + window.innerHeight),
      };
    }

    function scrollToPosition(y){
      if (locoScroll) locoScroll.scrollTo(y, { duration: 1200, disableLerp: false });
      else window.scrollTo({ top: y, behavior: "smooth" });
    }

    navLinks.forEach(function(link){
      link.addEventListener("click", function(e){
        const target = sectionPositions()[link.dataset.nav];
        if (typeof target !== "number") return;
        e.preventDefault();
        scrollToPosition(target);
      });
    });

    function updateActiveLink(y){
      const vh = window.innerHeight;
      const start = pinTrigger.start;
      const dist = pinTrigger.end - pinTrigger.start;
      let current = "home";
      if (y >= start - vh * 0.5) current = "projects";
      if (y >= start + dist * 0.25) current = "experience";
      if (y >= start + dist * 0.75) current = "education";
      if (y >= pinTrigger.end + vh * 0.5) current = "contact";
      navLinks.forEach(function(link){
        link.classList.toggle("is-active", link.dataset.nav === current);
      });
    }

    if (locoScroll) locoScroll.on("scroll", function(obj){ updateActiveLink(obj.scroll.y); });
    else window.addEventListener("scroll", function(){ updateActiveLink(window.scrollY); }, { passive: true });
    updateActiveLink(0);

    /* ---------- Entrance + scroll-linked reveals (desktop only) ---------- */
    if (reduceMotion) return;

    const tl = gsap.timeline();

    tl.from(".nav-left, .nav-right a", {
      y: -150,
      duration: 1,
      stagger: 0.2,
    });

    tl.from(".home-content h1", {
      y: 50,
      opacity: 0,
      duration: 0.5,
      stagger: 0.5,
    });

    // These are standalone tweens (not children of the timeline above): ScrollTrigger
    // doesn't support scrollTrigger on tweens nested in a timeline.
    gsap.from(".projects-marquee-track span", {
      opacity: 0,
      duration: 1,
      stagger: 0.5,
      scrollTrigger: {
        trigger: ".projects",
        scrub: 5,
        start: "top 70%",
        end: "top 30%",
      },
    });

    gsap.from(".project-card", {
      y: 50,
      opacity: 0,
      duration: 0.5,
      stagger: 0.5,
      scrollTrigger: {
        trigger: ".projects-grid",
        scrub: 5,
        start: "top 80%",
        end: "top 30%",
      },
    });

    // Work rows sit inside the pinned horizontal track, so they use the same scrubbed shape.
    gsap.from(".work-item", {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.15,
      scrollTrigger: {
        trigger: ".experience-work",
        scrub: 5,
        start: "top 80%",
        end: "top 30%",
      },
    });

    // .contact sits after the track, in normal vertical flow: a plain reveal on entry works.
    gsap.from(".contact-heading-line, .contact-message, .contact-social-btn", {
      y: 24,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      scrollTrigger: {
        trigger: ".contact",
        start: "top 75%",
      },
    });
  })();
}
