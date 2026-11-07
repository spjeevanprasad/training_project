import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground({ theme = 'dark', speed = 1, mode = 'ambient' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);

    const mouse = {
      x: null,
      y: null,
      radius: 160 * dpr,
      active: false
    };

    const ripples = [];

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      mouse.radius = 160 * dpr;
      initParticles();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX * dpr;
      mouse.y = e.clientY * dpr;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
      mouse.active = false;
    };

    const handleClick = (e) => {
      ripples.push({
        x: e.clientX * dpr,
        y: e.clientY * dpr,
        radius: 4 * dpr,
        maxRadius: 120 * dpr,
        alpha: 0.6,
        speed: 3.5 * dpr * speed
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const isDark = theme === 'dark';

    // Refined, professional SaaS color palette (Linear / Vercel style)
    const particleColors = isDark
      ? [
          { r: 99, g: 102, b: 241 },   // Indigo
          { r: 129, g: 140, b: 248 },  // Soft Iris
          { r: 56, g: 189, b: 248 },   // Sky
          { r: 168, g: 85, b: 247 },   // Violet
          { r: 148, g: 163, b: 184 }   // Slate
        ]
      : [
          { r: 79, g: 70, b: 229 },
          { r: 14, g: 165, b: 233 },
          { r: 100, g: 116, b: 139 }
        ];

    const PARTICLE_COUNT = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14000), 85);
    const MAX_DISTANCE = 135 * dpr;

    let particles = [];

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.75 * dpr * speed,
          vy: (Math.random() - 0.5) * 0.75 * dpr * speed,
          radius: (Math.random() * 1.6 + 1.2) * dpr,
          color,
          alpha: Math.random() * 0.4 + 0.35,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: (Math.random() * 0.02 + 0.01) * speed
        });
      }
    };

    initParticles();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- 1. INTERACTIVE MOUSE SPOTLIGHT ---
      if (mouse.active && mouse.x !== null) {
        const spotlight = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 1.5
        );
        spotlight.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.09)' : 'rgba(79, 70, 229, 0.06)');
        spotlight.addColorStop(0.5, isDark ? 'rgba(56, 189, 248, 0.03)' : 'rgba(14, 165, 233, 0.02)');
        spotlight.addColorStop(1, 'transparent');
        ctx.fillStyle = spotlight;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 2. GENTLE CLICK RIPPLE ---
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += rip.speed;
        rip.alpha *= 0.95;

        ctx.save();
        ctx.strokeStyle = isDark ? `rgba(99, 102, 241, ${rip.alpha})` : `rgba(79, 70, 229, ${rip.alpha})`;
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
          ripples.splice(r, 1);
        }
      }

      // --- 3. PARTICLE PHYSICS & DRIFT ---
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) { p.x = 0; p.vx = -p.vx; }
        else if (p.x > width) { p.x = width; p.vx = -p.vx; }

        if (p.y < 0) { p.y = 0; p.vy = -p.vy; }
        else if (p.y > height) { p.y = height; p.vy = -p.vy; }

        // Gentle mouse interaction (smooth subtle attraction)
        if (mouse.active && mouse.x !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius);
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * force * 1.2 * dpr;
            p.y += Math.sin(angle) * force * 1.2 * dpr;

            // Connect subtle line to mouse
            const lineAlpha = force * (isDark ? 0.35 : 0.25);
            ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${lineAlpha})`;
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // --- 4. CONNECTING FILAMENTS ---
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DISTANCE) {
            const alphaRatio = 1 - dist / MAX_DISTANCE;
            const alpha = alphaRatio * (isDark ? 0.2 : 0.15);

            ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${alpha})`;
            ctx.lineWidth = alphaRatio * 1.1 * dpr;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // --- 5. RENDER PARTICLES ---
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dynamicAlpha = p.alpha + Math.sin(p.pulse) * 0.15;

        // Subtle soft glow
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${dynamicAlpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core particle dot
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${Math.min(dynamicAlpha * 1.1, 0.95)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, [theme, speed, mode]);

  return (
    <div className="ambient-bg-container" aria-hidden="true">
      {/* Subtle organic gradient backdrop */}
      <div className="ambient-aurora-glow" />

      {/* Interactive Mesh Canvas */}
      <canvas ref={canvasRef} className="ambient-flow-canvas" />

      {/* Soft Vignette */}
      <div className="ambient-vignette" />
    </div>
  );
}
