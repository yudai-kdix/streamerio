"use client";

import { useEffect, useRef } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

type Props = {
  trigger: boolean;
  x: number;
  y: number;
  count?: number;
  color?: string;
};

export default function ParticleEffect({
  trigger,
  x,
  y,
  count = 12,
  color = "#4ade80",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const idCounterRef = useRef(0);

  // Canvas のサイズを初期化・リサイズ時に更新
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const w = typeof window !== "undefined" ? window.innerWidth : 0;
      const h = typeof window !== "undefined" ? window.innerHeight : 0;

      // デバイスピクセルレシオを考慮
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // Canvas のスタイルは物理ピクセルではなく CSS ピクセル
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // コンテキストもスケーリング
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!trigger) return;

    // パーティクルを生成
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 5 + Math.random() * 6; // 広がりを大きくするためスピード増加
      newParticles.push({
        id: idCounterRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // 上方向へ少し
        life: 1,
        maxLife: 1,
        size: 8 + Math.random() * 5,
      });
    }
    particlesRef.current.push(...newParticles);
  }, [trigger, x, y, count, color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // パーティクルを更新・描画
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // 重力
        p.life -= 0.03;

        if (p.life <= 0) return false;

        // 透明度を減衰させる
        const alpha = Math.max(0, p.life);
        ctx.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(
          color.slice(3, 5),
          16
        )}, ${parseInt(color.slice(5, 7), 16)}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      if (particlesRef.current.length > 0) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ left: 0, top: 0 }}
    />
  );
}
