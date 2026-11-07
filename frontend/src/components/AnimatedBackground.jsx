import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground({ theme = 'dark', speed = 1, mode = 'quantum' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);

    // Mouse coordinates (virtual coordinates multiplied by dpr)
    const mouse = {
      x: null,
      y: null,
      radius: 180 * dpr,
      active: false
    };

    // Shockwaves created on user click
    const shockwaves = [];

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      mouse.radius = 180 * dpr;
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
      shockwaves.push({
        x: e.clientX * dpr,
        y: e.clientY * dpr,
        radius: 5 * dpr,
        maxRadius: (Math.random() * 80 + 160) * dpr,
        alpha: 0.85,
        speed: (Math.random() * 4 + 7) * dpr * speed,
        color: Math.random() > 0.5 ? '#00f5d4' : '#a855f7'
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const isDark = theme === 'dark';

    // Color palettes for futuristic cyber theme
    const darkPalette = [
      { r: 0, g: 245, b: 212 },   // Neon Cyber Cyan
      { r: 0, g: 229, b: 255 },   // Aqua Electric
      { r: 168, g: 85, b: 247 },  // Neon Violet
      { r: 121, g: 40, b: 202 },  // Deep Purple
      { r: 56, g: 189, b: 248 },  // Laser Blue
      { r: 255, g: 255, b: 255 }   // Pure White Photon
    ];

    const lightPalette = [
      { r: 2, g: 132, b: 199 },   // Electric Sky
      { r: 124, g: 58, b: 237 },  // Deep Indigo
      { r: 13, g: 148, b: 136 },  // Cyan Teal
      { r: 79, g: 70, b: 229 }    // Royal Cyber
    ];

    const palette = isDark ? darkPalette : lightPalette;

    // Determine particle count based on display size
    const PARTICLE_COUNT = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 12000), 125);
    const MAX_DISTANCE = 145 * dpr;

    let particles = [];
    let radarY = 0;

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const color = palette[Math.floor(Math.random() * palette.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.35 * dpr * speed,
          vy: (Math.random() - 0.5) * 1.35 * dpr * speed,
          radius: (Math.random() * 2.2 + 1.2) * dpr,
          color,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: (Math.random() * 0.03 + 0.015) * speed,
          baseAlpha: Math.random() * 0.45 + 0.45,
          // For warp mode
          warpZ: Math.random() * width,
          warpSpeed: (Math.random() * 12 + 8) * dpr * speed
        });
      }
    };

    initParticles();

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- 1. AMBIENT CYBER SCANNER RADAR BEAM ---
      radarY = (radarY + 1.5 * dpr * speed) % (height + 200 * dpr);
      const scanGrad = ctx.createLinearGradient(0, radarY - 120 * dpr, 0, radarY);
      scanGrad.addColorStop(0, 'rgba(0, 245, 212, 0)');
      scanGrad.addColorStop(0.7, isDark ? 'rgba(0, 245, 212, 0.025)' : 'rgba(2, 132, 199, 0.02)');
      scanGrad.addColorStop(1, isDark ? 'rgba(0, 245, 212, 0.08)' : 'rgba(2, 132, 199, 0.06)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, radarY - 120 * dpr, width, 120 * dpr);

      // --- 2. PERSPECTIVE CYBER GRID HORIZON (Lower display) ---
      const gridHorizon = height * 0.72;
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.04)' : 'rgba(2, 132, 199, 0.04)';
      ctx.lineWidth = 1 * dpr;

      // Horizontal lines with exponential perspective spacing
      let currentY = gridHorizon;
      let step = 8 * dpr;
      while (currentY < height) {
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(width, currentY);
        ctx.stroke();
        currentY += step;
        step *= 1.32;
      }

      // Vanishing perspective rays
      const centerX = width * 0.5;
      const rayCount = 14;
      for (let r = 0; r <= rayCount; r++) {
        const spreadX = (width / rayCount) * r;
        ctx.beginPath();
        ctx.moveTo(centerX, gridHorizon);
        ctx.lineTo(spreadX, height);
        ctx.stroke();
      }
      ctx.restore();

      // --- 3. EXPANDING SHOCKWAVES ON CLICK ---
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const wave = shockwaves[s];
        wave.radius += wave.speed;
        wave.alpha *= 0.945;

        // Outer neon shockwave ring
        ctx.save();
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = Math.max(wave.alpha, 0);
        ctx.lineWidth = 2.5 * dpr;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 15 * dpr;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner echo ring
        if (wave.radius > 25 * dpr) {
          ctx.lineWidth = 1 * dpr;
          ctx.globalAlpha = Math.max(wave.alpha * 0.5, 0);
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, wave.radius * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Shockwave pushes particles outward
        for (let p = 0; p < particles.length; p++) {
          const part = particles[p];
          const dx = part.x - wave.x;
          const dy = part.y - wave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - wave.radius) < 35 * dpr) {
            const angle = Math.atan2(dy, dx);
            const force = (35 * dpr - Math.abs(dist - wave.radius)) * 0.12;
            part.x += Math.cos(angle) * force;
            part.y += Math.sin(angle) * force;
          }
        }

        if (wave.alpha < 0.02 || wave.radius > wave.maxRadius) {
          shockwaves.splice(s, 1);
        }
      }

      // --- 4. RENDER QUANTUM PARTICLES & ENERGY FILAMENTS ---
      if (mode === 'warp') {
        // Hyperspace Warp Mode: particles stream outward from center
        const cx = width / 2;
        const cy = height / 2;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.warpZ -= p.warpSpeed;
          if (p.warpZ <= 0) {
            p.warpZ = width;
            p.x = (Math.random() - 0.5) * width;
            p.y = (Math.random() - 0.5) * height;
          }

          const k = 250 / p.warpZ;
          const px = p.x * k + cx;
          const py = p.y * k + cy;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const size = (1 - p.warpZ / width) * 3.5 * dpr;
            const alpha = (1 - p.warpZ / width);

            // Streak tail toward center
            const prevK = 250 / (p.warpZ + p.warpSpeed * 1.5);
            const tailX = p.x * prevK + cx;
            const tailY = p.y * prevK + cy;

            ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.75})`;
            ctx.lineWidth = size * 0.7;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(px, py);
            ctx.stroke();

            // Head glow
            ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
            ctx.beginPath();
            ctx.arc(px, py, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // Quantum Neural Network Mode (Default)

        // Update positions & physics
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          p.x += p.vx;
          p.y += p.vy;
          p.pulse += p.pulseSpeed;

          // Bounce off boundary edges with gentle padding
          if (p.x < 0) {
            p.x = 0;
            p.vx = -p.vx;
          } else if (p.x > width) {
            p.x = width;
            p.vx = -p.vx;
          }

          if (p.y < 0) {
            p.y = 0;
            p.vy = -p.vy;
          } else if (p.y > height) {
            p.y = height;
            p.vy = -p.vy;
          }

          // Mouse Gravitational Field & Interaction
          if (mouse.active && mouse.x !== null) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius) {
              const force = (1 - dist / mouse.radius);
              // Orbit & gentle gravitational draw
              const angle = Math.atan2(dy, dx);
              p.x += Math.cos(angle) * force * 2.8 * dpr;
              p.y += Math.sin(angle) * force * 2.8 * dpr;

              // Draw energetic laser filament to cursor
              const lineAlpha = (1 - dist / mouse.radius) * 0.65;
              ctx.save();
              ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${lineAlpha})`;
              ctx.lineWidth = 1.3 * dpr;
              ctx.shadowColor = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
              ctx.shadowBlur = 8 * dpr;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // Draw Inter-Particle Neural Filaments
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MAX_DISTANCE) {
              const alphaRatio = 1 - dist / MAX_DISTANCE;
              const alpha = alphaRatio * (isDark ? 0.28 : 0.22);

              const lineGrad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
              lineGrad.addColorStop(0, `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${alpha})`);
              lineGrad.addColorStop(1, `rgba(${p2.color.r}, ${p2.color.g}, ${p2.color.b}, ${alpha})`);

              ctx.strokeStyle = lineGrad;
              ctx.lineWidth = alphaRatio * 1.25 * dpr;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // Render Glowing Quantum Nodes
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dynamicAlpha = p.baseAlpha + Math.sin(p.pulse) * 0.25;
          const currentRadius = p.radius + Math.sin(p.pulse) * 0.4 * dpr;

          // Outer Neon Halo
          ctx.save();
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${dynamicAlpha * 0.35})`;
          ctx.shadowColor = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
          ctx.shadowBlur = 10 * dpr;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Inner Core Node (Bright high-energy photon)
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${Math.min(dynamicAlpha * 1.2, 1)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Specular white center for higher energy nodes
          if (p.radius > 2 * dpr) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
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
    <div className="animated-bg-container" aria-hidden="true">
      {/* Futuristic Deep Space & Cyber Nebula Backdrops */}
      <div className="cyber-nebula-glow" />
      <div className="cyber-grid-mesh" />

      {/* Interactive Quantum Physics & Laser Canvas */}
      <canvas ref={canvasRef} className="ambient-quantum-canvas" />

      {/* Cyber HUD Scanline & Vignette Overlay */}
      <div className="cyber-hud-scanlines" />
      <div className="cyber-hud-vignette" />
    </div>
  );
}
