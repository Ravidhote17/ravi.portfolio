/* ============================================================
   3D TAG SPHERE (Education section)

   A Fibonacci/golden-angle sphere distribution projected with a
   manual perspective calculation — no Three.js, no extra
   dependencies. Elements are created once and only their
   transform/opacity/z-index are touched every frame, per the
   project's existing performance conventions (marquees etc. also
   run continuously via CSS/GSAP rather than rebuilding the DOM).
   ============================================================ */

(function initTagSphere(){
  const TAGS = [
    "PYTHON", "REACT", "JQUERY", "JAVA", "MYSQL", "SASS", "EXPRESS",
    "CSS", "HTML", "MONGOOSE", "MONGODB", "NODEJS", "REACT JS",
    "JAVASCRIPT", "SWIFT"
  ];

  const wrap = document.getElementById("tagSphereWrap");
  const sphereEl = document.getElementById("tagSphere");
  if (!wrap || !sphereEl) return;

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const BASE_SPEED = 0.0016;   // radians/frame — slow, elegant auto-orbit
  const MAX_EXTRA_YAW = 0.5;   // max radians the mouse can bias rotation by
  const MAX_TILT = 0.35;       // max radians of up/down tilt from the mouse
  const EASE = 0.06;           // interpolation factor for the smooth "follow" feel

  let radius = 0;
  let centerX = 0;
  let centerY = 0;

  let rotationY = 0;                    // continuous auto-rotation accumulator
  let extraYaw = 0, extraYawTarget = 0;  // mouse/touch-driven yaw offset (eased)
  let tiltX = 0, tiltXTarget = 0;        // mouse/touch-driven tilt (eased)
  let speedBoost = 0;                   // transient speed increase from fast mouse movement

  let dragging = false;
  let dragStartX = 0, dragStartY = 0;
  let dragStartYaw = 0, dragStartTilt = 0;
  let lastPointerX = null, lastPointerY = null;

  // Create every tag element once and cache a reference alongside its
  // sphere coordinates — the animation loop never touches the DOM
  // structure again, only style properties on these cached elements.
  const points = TAGS.map((label) => {
    const el = document.createElement("span");
    el.className = "tag-sphere-item";
    el.textContent = label;
    sphereEl.appendChild(el);

    const point = { el, hovered: false, x0: 0, y0: 0, z0: 0 };
    el.addEventListener("mouseenter", () => { el.classList.add("is-hovered"); point.hovered = true; });
    el.addEventListener("mouseleave", () => { el.classList.remove("is-hovered"); point.hovered = false; });
    return point;
  });

  function layoutSphere(){
    // Golden-angle / Fibonacci sphere distribution so tags spread evenly
    // over the whole surface rather than clustering at the equator.
    const total = points.length;
    points.forEach((p, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      p.x0 = Math.sin(phi) * Math.cos(theta);
      p.y0 = Math.sin(phi) * Math.sin(theta);
      p.z0 = Math.cos(phi);
    });
  }
  layoutSphere();

  function measure(){
    const rect = wrap.getBoundingClientRect();
    centerX = rect.width / 2;
    centerY = rect.height / 2;
    radius = Math.min(rect.width, rect.height) * 0.36;
  }

  function updateTag(p, cosY, sinY, cosX, sinX){
    // Unit-sphere coordinates scaled to the actual pixel radius.
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
      `translate(-50%, -50%) translate(${(centerX + rx).toFixed(1)}px, ${(centerY + ry).toFixed(1)}px) scale(${(scale * hoverScale).toFixed(3)})`;
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

  function animate(){
    if (reduceMotionQuery.matches) return; // reduced motion: stay on the static render() below

    rotationY += BASE_SPEED + speedBoost;
    speedBoost *= 0.92; // decay the mouse-speed boost back to baseline
    extraYaw += (extraYawTarget - extraYaw) * EASE;
    tiltX += (tiltXTarget - tiltX) * EASE;

    render();
    requestAnimationFrame(animate);
  }

  function handlePointerMove(clientX, clientY){
    const rect = wrap.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));

    extraYawTarget = nx * MAX_EXTRA_YAW;
    tiltXTarget = ny * MAX_TILT;

    if (lastPointerX !== null){
      const speed = Math.hypot(clientX - lastPointerX, clientY - lastPointerY);
      speedBoost = Math.min(speedBoost + speed * 0.00006, 0.01);
    }
    lastPointerX = clientX;
    lastPointerY = clientY;
  }

  function handleMouseMove(e){
    handlePointerMove(e.clientX, e.clientY);
  }

  function handleMouseLeave(){
    extraYawTarget = 0;
    tiltXTarget = 0;
    lastPointerX = null;
    lastPointerY = null;
  }

  function handleTouchStart(e){
    if (!e.touches || !e.touches.length) return;
    dragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragStartYaw = extraYawTarget;
    dragStartTilt = tiltXTarget;
  }

  function handleTouchMove(e){
    if (!dragging || !e.touches || !e.touches.length) return;
    e.preventDefault(); // only blocks scrolling while a finger is dragging directly on the sphere
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    extraYawTarget = dragStartYaw + (dx / wrap.clientWidth) * 2;
    tiltXTarget = Math.max(-1.2, Math.min(1.2, dragStartTilt + (dy / wrap.clientHeight) * 1.4));
  }

  function handleTouchEnd(){
    dragging = false;
    // release back into the automatic rotation smoothly (eased, not a snap)
    extraYawTarget = 0;
    tiltXTarget = 0;
  }

  function handleResize(){
    measure();
    if (reduceMotionQuery.matches) render();
  }

  measure();
  wrap.addEventListener("mousemove", handleMouseMove);
  wrap.addEventListener("mouseleave", handleMouseLeave);
  wrap.addEventListener("touchstart", handleTouchStart, { passive: true });
  wrap.addEventListener("touchmove", handleTouchMove, { passive: false });
  wrap.addEventListener("touchend", handleTouchEnd);
  wrap.addEventListener("touchcancel", handleTouchEnd);
  window.addEventListener("resize", handleResize);

  if (reduceMotionQuery.matches){
    render(); // static but correctly-positioned sphere, no motion
  } else {
    requestAnimationFrame(animate);
  }

  reduceMotionQuery.addEventListener("change", (e) => {
    if (e.matches) render();
    else requestAnimationFrame(animate);
  });
})();
