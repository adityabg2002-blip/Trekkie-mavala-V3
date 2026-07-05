import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: -100, y: -100, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#e8a13a', '#d9531e', '#f4b860', '#b8420f', '#ffcf7a'];

    const spawn = (x, y, count) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.2 + 0.4;
        particles.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          life: 1,
          decay: Math.random() * 0.03 + 0.015,
          size: Math.random() * 2.6 + 0.8,
          color: colors[(Math.random() * colors.length) | 0],
        });
      }
    };

    let lastX = 0, lastY = 0;
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY, active: true };
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      spawn(e.clientX, e.clientY, Math.min(4, Math.ceil(dist / 8) + 1));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onDown = (e) => spawn(e.clientX, e.clientY, 18);
    const onLeave = () => { mouse.current.active = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseout', onLeave);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const arr = particles.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= p.decay;
        if (p.life <= 0) { arr.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;

      // Custom cursor ring
      if (mouse.current.active) {
        ctx.strokeStyle = '#d9531e';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(mouse.current.x, mouse.current.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#d9531e';
        ctx.beginPath();
        ctx.arc(mouse.current.x, mouse.current.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseout', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
