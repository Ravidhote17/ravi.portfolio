/* ============================================================
   3D TAG SPHERE (Education section)

   A Fibonacci/golden-angle sphere distribution projected with a
   manual perspective calculation - no Three.js, no extra
   dependencies. Elements are created once and only their
   transform/opacity/z-index are touched every frame.

   The sphere radius is derived from the container AND from the widest
   label, so long labels (e.g. "SPRING DATA JPA") never get clipped at the
   edges on narrow phones. The animation loop pauses while the sphere is
   off-screen or the tab is hidden.
   ============================================================ */

(function initTagSphere(){
  // Points are laid out along a spiral, so tags that are close together in this list end up
  // as neighbours on the sphere's surface. The long Spring labels are therefore spread out
  // among the shorter ones instead of being appended as one cluster.
  const TAGS = [
    "PYTHON", "SPRING BOOT", "REACT", "JQUERY", "JAVA", "HIBERNATE", "MYSQL",
    "SASS", "SPRING MVC", "EXPRESS", "CSS", "HTML", "SPRING DATA JPA",
    "MONGOOSE", "MONGODB", "NODEJS", "SPRING SECURITY", "REACT JS",
    "JAVASCRIPT", "SWIFT"
  ];

  const wrap = document.getElementById("tagSphereWrap");
  const sphereEl = document.getElementById("tagSphere");
  if (!wrap || !sphereEl) return;

  sphereEl.setAttribute("aria-label", "Technologies: " + TAGS.map(function(t){
    return t.charAt(0) + t.slice(1).toLowerCase();
  }).join(", "));

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const BASE_SPEED = 0.0016;   // radians/frame - slow, elegant auto-orbit
  const MAX_EXTRA_YAW = 0.5;   // max radians the mouse can bias rotation by
  const MAX_TILT = 0.35;       // max radians of up/down tilt from the mouse
  const EASE = 0.06;           // interpolation factor for the smooth "follow" feel
  const RADIUS_FACTOR = 0.38;  // fraction of the container's short side
  const EDGE_PADDING = 8;      // px kept clear between labels and the container edge
  const TOUCH_YAW_PER_PX = 0.012;

  let radius = 0;
  let centerX = 0;
  let centerY = 0;

  let rotationY = 0;                    // continuous auto-rotation accumulator
  let extraYaw = 0, extraYawTarget = 0;  // mouse-driven yaw offset (eased)
  let tiltX = 0, tiltXTarget = 0;        // mouse-driven tilt (eased)
  let speedBoost = 0;                   // transient speed increase from fast mouse movement

  let lastPointerX = null, lastPointerY = null;
  let touchLastX = null;

  let rafId = 0;
  let isVisible = true;

  // Create every tag element once and cache a reference alongside its sphere coordinates.
  const points = TAGS.map(function(label){
    const el = document.createElement("span");
    el.className = "tag-sphere-item";
    el.textContent = label;
    el.setAttribute("aria-hidden", "true");
    sphereEl.appendChild(el);

    const point = { el: el, hovered: false, x0: 0, y0: 0, z0: 0 };
    // Mouse only: on touch screens the emulated mouseenter would leave a tag stuck "hovered".
    el.addEventListener("pointerenter", function(e){
      if (e.pointerType !== "mouse") return;
      el.classList.add("is-hovered");
      point.hovered = true;
    });
    el.addEventListener("pointerleave", function(){
      el.classList.remove("is-hovered");
      point.hovered = false;
    });
    return point;
  });

  function layoutSphere(){
    // Golden-angle / Fibonacci distribution: tags spread evenly over the whole surface.
    const total = points.length;
    points.forEach(function(p, i){
      const phi = Math.acos(1 - 2 * (i + 0.5) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      p.x0 = Math.sin(phi) * Math.cos(theta);
      p.y0 = Math.sin(phi) * Math.sin(theta);
      p.z0 = Math.cos(phi);
    });
  }
  layoutSphere();

  function measure(){
    // clientWidth/Height are unaffected by the CSS transforms the pinned panel is moved with.
    const width = wrap.clientWidth;
    const height = wrap.clientHeight;
    centerX = width / 2;
    centerY = height / 2;

    let maxLabelW = 0;
    let maxLabelH = 0;
    for (const p of points){
      maxLabelW = Math.max(maxLabelW, p.el.offsetWidth);
      maxLabelH = Math.max(maxLabelH, p.el.offsetHeight);
    }

    const byContainer = Math.min(width, height) * RADIUS_FACTOR;
    const byWidth = width / 2 - maxLabelW / 2 - EDGE_PADDING;
    const byHeight = height / 2 - maxLabelH / 2 - EDGE_PADDING;
    radius = Math.max(40, Math.min(byContainer, byWidth, byHeight));
  }

  function updateTag(p, cosY, sinY, cosX, sinX){
    const x = p.x0 * radius;
    const y = p.y0 * radius;
    const z = p.z0 * radius;

    // Rotate around the Y axis (left/right orbit).
    const rx = x * cosY + z * sinY;
    const rzY = -x * sinY + z * cosY;

    // Rotate around the X axis (up/down tilt).
    const ry = y * cosX - rzY * sinX;
    const rz = y * sinX + rzY * cosX;

    // Normalized depth: 0 = back of sphere, 1 = front (closest to viewer).
    const depth = (rz + radius) / (2 * radius);
    const scale = 0.55 + depth * 0.75;
    const opacity = 0.25 + depth * 0.75;
    const hoverScale = p.hovered ? 1.18 : 1;

    p.el.style.transform =
      "translate(-50%, -50%) translate(" + (centerX + rx).toFixed(1) + "px, " + (centerY + ry).toFixed(1) +
      "px) scale(" + (scale * hoverScale).toFixed(3) + ")";
    p.el.style.opacity = opacity.toFixed(2);
    p.el.style.zIndex = Math.round(rz + radius);
  }

  function render(){
    const cosY = Math.cos(rotationY + extraYaw);
    const sinY = Math.sin(rotationY + extraYaw);
    const cosX = Math.cos(tiltX);
    const sinX = Math.sin(tiltX);
    for (const p of points) updateTag(p, cosY, sinY, cosX, sinX);
  }

  function shouldRun(){
    return isVisible && !document.hidden && !reduceMotionQuery.matches;
  }

  function frame(){
    rafId = 0;
    if (!shouldRun()) return;

    rotationY += BASE_SPEED + speedBoost;
    speedBoost *= 0.92; // decay the mouse-speed boost back to baseline
    extraYaw += (extraYawTarget - extraYaw) * EASE;
    tiltX += (tiltXTarget - tiltX) * EASE;

    render();
    rafId = requestAnimationFrame(frame);
  }

  function start(){
    if (!rafId && shouldRun()) rafId = requestAnimationFrame(frame);
  }

  /* ---------- mouse ---------- */

  function handlePointerMove(e){
    if (e.pointerType !== "mouse") return;
    const rect = wrap.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));

    extraYawTarget = nx * MAX_EXTRA_YAW;
    tiltXTarget = ny * MAX_TILT;

    if (lastPointerX !== null){
      const speed = Math.hypot(e.clientX - lastPointerX, e.clientY - lastPointerY);
      speedBoost = Math.min(speedBoost + speed * 0.00006, 0.01);
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }

  function handlePointerLeave(e){
    if (e.pointerType !== "mouse") return;
    extraYawTarget = 0;
    tiltXTarget = 0;
    lastPointerX = null;
    lastPointerY = null;
  }

  /* ---------- touch ----------
     Horizontal finger drags spin the sphere directly (and keep the auto-rotation going when
     released). Listeners are passive and CSS sets touch-action: pan-y, so vertical swipes
     still scroll the page normally instead of getting trapped by the sphere. */

  function handleTouchStart(e){
    touchLastX = e.touches && e.touches.length ? e.touches[0].clientX : null;
  }

  function handleTouchMove(e){
    if (touchLastX === null || !e.touches || !e.touches.length) return;
    const xNow = e.touches[0].clientX;
    rotationY += (xNow - touchLastX) * TOUCH_YAW_PER_PX;
    touchLastX = xNow;
    if (!rafId) render(); // keep it responsive even when the loop is paused (reduced motion)
  }

  function handleTouchEnd(){
    touchLastX = null;
  }

  function handleResize(){
    measure();
    if (!shouldRun()) render();
  }

  measure();
  render();

  wrap.addEventListener("pointermove", handlePointerMove);
  wrap.addEventListener("pointerleave", handlePointerLeave);
  wrap.addEventListener("touchstart", handleTouchStart, { passive: true });
  wrap.addEventListener("touchmove", handleTouchMove, { passive: true });
  wrap.addEventListener("touchend", handleTouchEnd);
  wrap.addEventListener("touchcancel", handleTouchEnd);

  if ("ResizeObserver" in window){
    new ResizeObserver(handleResize).observe(wrap);
  } else {
    window.addEventListener("resize", handleResize);
  }

  // Label widths depend on the web font: re-measure once fonts have loaded.
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(handleResize);
  }

  // Pause while off-screen (the sphere sits in the horizontally-pinned panel on desktop,
  // and far down the page on mobile).
  if ("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      isVisible = entries[entries.length - 1].isIntersecting;
      if (isVisible) start();
    }).observe(wrap);
  }

  document.addEventListener("visibilitychange", start);

  reduceMotionQuery.addEventListener("change", function(){
    if (reduceMotionQuery.matches) render();
    else start();
  });

  start();
})();
