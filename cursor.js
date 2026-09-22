/* ============================================================
   CUSTOM CURSOR FOLLOWER

   A single global mouse-follower, implemented with the same
   manual requestAnimationFrame + lerp technique as tag-sphere.js
   — self-contained, no dependency on GSAP/ScrollTrigger/Locomotive,
   so it always runs even if those CDN scripts fail to load, and it
   never fights the page's own scroll-driven GSAP timelines.

   States: default / text / link / image, toggled via a data-state
   attribute that style.css keys off of. Purely decorative —
   pointer-events: none — so it never blocks clicks, keyboard
   interaction, or native accessibility behavior.
   ============================================================ */

(function initCursorFollower(){
  // Devices without a real (fine, hover-capable) pointer — touch/tablet —
  // get no follower at all: no listeners created, nothing left on screen.
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasFinePointer) return;

  const follower = document.getElementById("cursorFollower");
  if (!follower) return;

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Elements whose hover should switch the follower's state. Checked in
  // priority order (a link containing text should read as "link", not "text").
  const LINK_SELECTOR = "a, button, [role='button'], input, textarea, select, label";
  const IMAGE_SELECTOR = "img, .project-image";
  const TEXT_SELECTOR = "h1, h2, h3, h4, p, span, em, .logo-text, .work-item, .tag-sphere-item";

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let x = mouseX;
  let y = mouseY;
  let hasMoved = false;

  function stateFor(target){
    if (!(target instanceof Element)) return "default";
    if (target.closest(LINK_SELECTOR)) return "link";
    if (target.closest(IMAGE_SELECTOR)) return "image";
    if (target.closest(TEXT_SELECTOR)) return "text";
    return "default";
  }

  function handlePointerMove(e){
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!hasMoved){
      // Snap straight to the pointer on first movement so the follower
      // doesn't glide in from the viewport center when the mouse re-enters.
      x = mouseX;
      y = mouseY;
      hasMoved = true;
      follower.style.opacity = "1";
    }

    follower.dataset.state = stateFor(e.target);
  }

  function handlePointerLeaveWindow(){
    follower.style.opacity = "0";
  }

  function handlePointerEnterWindow(){
    if (hasMoved) follower.style.opacity = "1";
  }

  function render(){
    // Reduced motion: skip the trailing lerp and track the pointer directly.
    const ease = reduceMotionQuery.matches ? 1 : 0.18;
    x += (mouseX - x) * ease;
    y += (mouseY - y) * ease;
    follower.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  }

  document.addEventListener("mousemove", handlePointerMove, { passive: true });
  document.addEventListener("mouseleave", handlePointerLeaveWindow);
  document.addEventListener("mouseenter", handlePointerEnterWindow);

  requestAnimationFrame(render);
})();
