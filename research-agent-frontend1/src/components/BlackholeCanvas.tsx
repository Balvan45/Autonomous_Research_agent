import { useEffect, useRef } from "react";

interface BlackholeCanvasProps {
  /** 1 = full brightness (auth screens), lower = dimmed backdrop (chat page) */
  intensity?: number;
  className?: string;
}

interface Neuron {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
  spiral: number; // how fast it's being pulled inward
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinklePhase: number;
}

/**
 * A field of "neuron" nodes orbiting a central gravity well, connected by
 * bright synapse lines when close together, spiraling into a glowing
 * accretion disk around a pulsing black event horizon, over a starfield.
 * Pure canvas 2D, no deps.
 */
export default function BlackholeCanvas({ intensity = 1, className }: BlackholeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx = ctxOrNull;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const NEURON_COUNT = 190;
    const STAR_COUNT = 220;
    const neurons: Neuron[] = Array.from({ length: NEURON_COUNT }, () => spawnNeuron());
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.3 + 0.3,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    function spawnNeuron(): Neuron {
      return {
        angle: Math.random() * Math.PI * 2,
        radius: 150 + Math.random() * (Math.min(width, height) || 600) * 0.62,
        speed: 0.0006 + Math.random() * 0.0014,
        size: 1.1 + Math.random() * 2.1,
        hue: Math.random() < 0.62 ? 235 : Math.random() < 0.85 ? 165 : 25, // plasma, cyan, ember
        spiral: 0.02 + Math.random() * 0.06,
      };
    }

    let raf = 0;
    let t = 0;

    function draw() {
      const cx = width / 2;
      const cy = height / 2;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0016);
      const horizon = 42 + pulse * 6;

      ctx.clearRect(0, 0, width, height);

      // base void + soft vignette glow
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, width, height);
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.75);
      bg.addColorStop(0, `rgba(28, 22, 48, ${0.5 * intensity})`);
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // starfield
      for (const s of stars) {
        const tw = 0.4 + 0.6 * Math.sin(t * 0.0012 + s.twinklePhase);
        ctx.beginPath();
        ctx.fillStyle = `rgba(237, 239, 247, ${0.5 * intensity * tw})`;
        ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // update + draw neurons
      const points: { x: number; y: number; hue: number }[] = [];
      for (const n of neurons) {
        n.angle += n.speed * (1 + (150 / n.radius) * 0.7);
        if (!reduceMotion) n.radius -= n.spiral;
        if (n.radius < horizon + 8) {
          Object.assign(n, spawnNeuron(), { radius: (Math.min(width, height) || 600) * 0.62 });
        }
        const x = cx + Math.cos(n.angle) * n.radius;
        const y = cy + Math.sin(n.angle) * n.radius * 0.6; // slight ellipse for depth
        points.push({ x, y, hue: n.hue });

        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.002 + n.angle * 3);
        ctx.save();
        ctx.shadowBlur = 8 * intensity;
        ctx.shadowColor = `hsla(${n.hue}, 90%, 65%, ${0.8 * intensity})`;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${n.hue}, 92%, ${72 + twinkle * 10}%, ${intensity * (0.65 + twinkle * 0.35)})`;
        ctx.arc(x, y, n.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // synapse lines between nearby neurons
      ctx.lineWidth = 0.7;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 105 * 105) {
            const alpha = (1 - dist2 / (105 * 105)) * 0.28 * intensity;
            ctx.strokeStyle = `rgba(140, 170, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      // accretion disk glow (pulsing)
      const disk = ctx.createRadialGradient(cx, cy, horizon * 0.85, cx, cy, horizon * 3.8);
      disk.addColorStop(0, `rgba(255, 148, 90, ${(0.6 + pulse * 0.15) * intensity})`);
      disk.addColorStop(0.42, `rgba(124, 156, 255, ${0.32 * intensity})`);
      disk.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.scale(1, 0.6);
      ctx.fillStyle = disk;
      ctx.beginPath();
      ctx.arc(cx, cy / 0.6, horizon * 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // thin bright ring at the disk's inner edge
      ctx.save();
      ctx.scale(1, 0.6);
      ctx.strokeStyle = `rgba(255, 200, 160, ${0.55 * intensity})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy / 0.6, horizon * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // event horizon
      ctx.beginPath();
      ctx.fillStyle = "#020103";
      ctx.ellipse(cx, cy, horizon, horizon * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      t += 16;
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
