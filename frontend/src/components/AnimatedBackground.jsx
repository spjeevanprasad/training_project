import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground({ theme = 'dark', speed = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      initEngine();
    };
    window.addEventListener('resize', handleResize);

    const isDark = theme === 'dark';

    // -------------------------------------------------------------
    // PURE ATMOSPHERIC RAIN ON WINDOW ENGINE
    // - Fast, elegant falling rain streaks outside the window
    // - Soft glass impact ripples (concentric water rings on glass)
    // - Natural round condensation water beads (NO TAILS, NO SPERM SHAPES)
    // -------------------------------------------------------------
    const RAIN_COUNT = 180;
    const RIPPLE_COUNT = 16;
    const CONDENSATION_COUNT = 90;

    let rainStreaks = [];
    let glassRipples = [];
    let condensationDrops = [];

    const initEngine = () => {
      rainStreaks = [];
      glassRipples = [];
      condensationDrops = [];

      // 1. Falling rain streaks outside window (clean straight diagonal lines)
      for (let i = 0; i < RAIN_COUNT; i++) {
        rainStreaks.push({
          x: Math.random() * (width + 300) - 150,
          y: Math.random() * height,
          length: (Math.random() * 38 + 24) * dpr,
          speed: (Math.random() * 16 + 22) * dpr * speed,
          thickness: (Math.random() * 1.2 + 0.8) * dpr,
          alpha: Math.random() * 0.35 + 0.2
        });
      }

      // 2. Glass impact ripples (water drops hitting the pane creating expanding soft rings)
      for (let i = 0; i < RIPPLE_COUNT; i++) {
        glassRipples.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: (Math.random() * 6 + 2) * dpr,
          maxRadius: (Math.random() * 18 + 14) * dpr,
          growthSpeed: (Math.random() * 0.45 + 0.3) * dpr * speed,
          alpha: Math.random() * 0.45 + 0.3
        });
      }

      // 3. Natural round water droplets on glass (pure round beads with lens gleam, ZERO tails)
      for (let i = 0; i < CONDENSATION_COUNT; i++) {
        condensationDrops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: (Math.random() * 3.5 + 1.8) * dpr,
          alpha: Math.random() * 0.45 + 0.35
        });
      }
    };

    initEngine();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- 1. RENDER NATURAL ROUND CONDENSATION BEADS ON GLASS (NO TAILS) ---
      for (let i = 0; i < condensationDrops.length; i++) {
        const drop = condensationDrops[i];

        // Soft drop shadow on glass
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(
          drop.x,
          drop.y + drop.radius * 0.4,
          drop.radius,
          drop.radius * 0.9,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Droplet body with water refraction
        const grad = ctx.createLinearGradient(
          drop.x - drop.radius,
          drop.y - drop.radius,
          drop.x + drop.radius,
          drop.y + drop.radius
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${drop.alpha * 0.9})`);
        grad.addColorStop(0.5, `rgba(186, 230, 253, ${drop.alpha * 0.35})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${drop.alpha * 0.8})`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight gleam (crisp white dot)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
          drop.x - drop.radius * 0.32,
          drop.y - drop.radius * 0.32,
          drop.radius * 0.32,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // --- 2. RENDER SOFT GLASS WATER RIPPLES ---
      for (let i = 0; i < glassRipples.length; i++) {
        const rip = glassRipples[i];
        rip.radius += rip.growthSpeed;
        rip.alpha *= 0.975;

        // Reset ripple when faded
        if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
          rip.x = Math.random() * width;
          rip.y = Math.random() * height;
          rip.radius = (Math.random() * 3 + 2) * dpr;
          rip.maxRadius = (Math.random() * 20 + 12) * dpr;
          rip.growthSpeed = (Math.random() * 0.45 + 0.25) * dpr * speed;
          rip.alpha = Math.random() * 0.4 + 0.35;
        }

        ctx.strokeStyle = `rgba(224, 242, 254, ${rip.alpha * 0.6})`;
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner soft ripple ring
        if (rip.radius > 6 * dpr) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.35})`;
          ctx.lineWidth = 0.8 * dpr;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // --- 3. RENDER CONTINUOUS FALLING RAIN STREAKS OUTSIDE (BATCHED) ---
      const windSlant = -0.16;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.1 * dpr;
      ctx.strokeStyle = isDark ? 'rgba(215, 238, 255, 0.38)' : 'rgba(240, 248, 255, 0.48)';

      ctx.beginPath();
      for (let i = 0; i < RAIN_COUNT; i++) {
        const streak = rainStreaks[i];
        streak.y += streak.speed;
        streak.x += windSlant * streak.speed;

        if (streak.y > height + streak.length) {
          streak.y = -streak.length - 15;
          streak.x = Math.random() * (width + 300) - 150;
        }

        const tailX = streak.x - windSlant * streak.length;
        const tailY = streak.y - streak.length;
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(streak.x, streak.y);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, speed]);

  return (
    <div className="animated-bg-container" aria-hidden="true">
      {/* Real Rainy Window Photograph Backdrop */}
      <div className="dim-rain-window-photo" />

      {/* Atmospheric Overcast Color Tint */}
      <div className="dim-moody-overlay" />

      {/* Pure Rain Streaks & Glass Ripples Canvas */}
      <canvas ref={canvasRef} className="ambient-rain-canvas" />

      {/* Atmospheric Vignette */}
      <div className="ambient-glass-vignette" />
    </div>
  );
}
