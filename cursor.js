/* ============================================================
   CUSTOM CURSOR FOLLOWER

   A single global mouse-follower using a manual requestAnimationFrame + lerp.
   Self-contained: no dependency on GSAP/ScrollTrigger/Locomotive, so it always runs
   even if those CDN scripts fail to load.

   States: default / text / link / image, toggled via a data-state attribute that
   style.css keys off of. Purely decorative (pointer-events: none).
   ============================================================ */

(function initCursorFollower(){
  // Touch/tablet devices have no fine hover pointer: no follower, no listeners.
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasFinePointer) return;

  const follower = document.getElementById("cursorFollower");
  if (!follower) return;

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Priority order: a link containing text should read as "link", not "text".
  const LINK_SELECTOR = "a, button, [role='button'], input, textarea, select, label";
  const IMAGE_SELECTOR = "img, .project-image";
  const TEXT_SELECTOR = "h1, h2, h3, h4, p, span, em, .logo-text, .work-item, .tag-sphere-item";

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let x = mouseX;
  let y = mouseY;
  let hasMoved = false;
  let rafId = 0;

  function stateFor(target){
    if (!(target instanceof Element)) return "default";
    if (target.closest(LINK_SELECTOR)) return "link";
    if (target.closest(IMAGE_SELECTOR)) return "image";
    if (target.closest(TEXT_SELECTOR)) return "text";
    return "default";
  }

  function render(){
    // Reduced motion: skip the trailing lerp and track the pointer directly.
    const ease = reduceMotionQuery.matches ? 1 : 0.18;
    x += (mouseX - x) * ease;
    y += (mouseY - y) * ease;
    follower.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;

    // Stop the loop once the follower has caught up; the next mousemove restarts it.
    if (Math.abs(mouseX - x) < 0.1 && Math.abs(mouseY - y) < 0.1){
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(render);
  }

  function ensureRunning(){
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  function handlePointerMove(e){
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!hasMoved){
      // Snap straight to the pointer on first movement instead of gliding in from the center.
      x = mouseX;
      y = mouseY;
      hasMoved = true;
      follower.style.opacity = "1";
    }

    follower.dataset.state = stateFor(e.target);
    ensureRunning();
  }

  function handlePointerLeaveWindow(){
    follower.style.opacity = "0";
  }

  function handlePointerEnterWindow(){
    if (hasMoved) follower.style.opacity = "1";
  }

  document.addEventListener("mousemove", handlePointerMove, { passive: true });
  // mouseleave/mouseenter don't fire reliably on `document`; the root element does.
  document.documentElement.addEventListener("mouseleave", handlePointerLeaveWindow);
  document.documentElement.addEventListener("mouseenter", handlePointerEnterWindow);
})();
