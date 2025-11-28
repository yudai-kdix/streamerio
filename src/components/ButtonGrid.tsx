"use client";

import type { ButtonName, RoomStat } from "@/lib/api";
import { useVibration } from "@/lib/vibration";
import bgPng from "@assets/background.png";
import bgLandscapePng from "@assets/background_landscape.png";
import buttonPng from "@assets/button.png";
import enemyIcon from "@assets/enemy.png";
import skillIcon from "@assets/skill.png";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParticleEffect from "./ParticleEffect";

type Props = {
  onClick: (name: ButtonName) => void;
  stats?: Record<ButtonName, RoomStat | undefined>;
};

type ParticleEvent = {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  color: string;
};

// 数値を滑らかに補間するフック
function useSmoothValue(targetValue: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  
  const displayValueRef = useRef(targetValue);
  const startValueRef = useRef(targetValue);
  const targetValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);
  const reqIdRef = useRef<number | null>(null);

  displayValueRef.current = displayValue;

  useEffect(() => {
    if (targetValue !== targetValueRef.current) {
      startValueRef.current = displayValueRef.current;
      targetValueRef.current = targetValue;
      startTimeRef.current = null;
    }

    const loop = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3); // Ease-out

      const newValue =
        startValueRef.current +
        (targetValueRef.current - startValueRef.current) * ease;

      setDisplayValue(newValue);

      if (progress < 1.0) {
        reqIdRef.current = requestAnimationFrame(loop);
      } else {
        reqIdRef.current = null;
      }
    };

    reqIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [targetValue, duration]);

  return displayValue;
}

// ボタン単体のコンポーネント
const ButtonItem = ({
  name,
  kind,
  size,
  stats,
  priority,
}: {
  name: ButtonName;
  kind: "skill" | "enemy";
  size: "sm" | "md" | "lg";
  stats?: Record<ButtonName, RoomStat | undefined>;
  priority?: boolean;
}) => {
  const boxCls =
    "relative w-[clamp(80px,22vmin,140px)] h-[clamp(80px,22vmin,140px)]";
  const btnCls =
    "cursor-pointer transition-transform duration-150 active:scale-95 select-none";
  
  const pad =
    size === "sm"
      ? kind === "enemy" ? "p-6" : "p-5"
      : size === "md"
      ? kind === "enemy" ? "p-4" : "p-3"
      : kind === "enemy" ? "p-2" : "p-1";
      
  const icon = kind === "skill" ? skillIcon : enemyIcon;
  const barColor = kind === "skill" ? "bg-yellow-400" : "bg-red-500";

  const stat = stats?.[name];
  const rawProgress = stat?.progress ?? 0;

  // アニメーション適用 (800ms)
  const smoothProgress = useSmoothValue(rawProgress, 800);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={boxCls}>
        <Image
          src={buttonPng}
          alt="button"
          fill
          className={`object-contain ${btnCls}`}
          priority={priority}
        />
        <Image
          src={icon}
          alt={kind}
          fill
          className={`object-contain ${pad} pointer-events-none`}
        />
      </div>

      <div className="w-[90%] flex flex-col items-center gap-0.5">
        <div className="relative w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/20 backdrop-blur-sm shadow-inner">
          <div
            className={`h-full ${barColor} shadow-[0_0_10px_rgba(255,255,255,0.4)]`}
            style={{ width: `${Math.min(smoothProgress * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// 6 つのボタンを所定の配置で描画する（Tailwind ベース）
export default function ButtonGrid({ onClick, stats }: Props) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [particles, setParticles] = useState<ParticleEvent[]>([]);
  const { vibrate } = useVibration();
  const particleIdRef = useRef(0);

  // 端末の向きを検出して背景とレイアウトを切替
  useEffect(() => {
    const detect = () => {
      if (typeof window === "undefined") return false;
      const mm =
        window.matchMedia && window.matchMedia("(orientation: landscape)");
      return (mm && mm.matches) || window.innerWidth > window.innerHeight;
    };
    const update = () => setIsLandscape(detect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update as EventListener);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update as EventListener);
    };
  }, []);

  // ボタン押下時のエフェクト処理
  const handleButtonClick = useCallback(
    (buttonName: ButtonName, event: React.MouseEvent<HTMLDivElement>) => {
      // 親要素の onClick イベントがバブルアップしないようにする
      event.stopPropagation();

      // バイブレーション（弱め: 30ms）
      vibrate(30);

      // ボタンの種類に応じてパーティクルの色を決定
      const isSkill = buttonName.startsWith("skill");
      const particleColor = isSkill ? "#f6ff53ff" : "#999b9eff"; // 黄色 or 明るいグレー

      // マウスイベントの座標でパーティクル生成
      const { clientX, clientY } = event;
      const newParticle: ParticleEvent = {
        id: `particle-${particleIdRef.current++}`,
        x: clientX,
        y: clientY,
        timestamp: Date.now(),
        color: particleColor,
      };
      setParticles((prev) => [...prev, newParticle]);

      // パーティクルを300msで削除
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 300);

      // 元の onClick を実行
      onClick(buttonName);
    },
    [onClick, vibrate]
  );

  const style = useMemo<React.CSSProperties>(
    () => ({
      backgroundImage: `url(${isLandscape ? bgLandscapePng.src : bgPng.src})`,
    }),
    [isLandscape]
  );

  const btnCls =
    "cursor-pointer transition-transform duration-150 active:scale-95 select-none";
  const boxCls =
    "relative w-[clamp(80px,22vmin,140px)] h-[clamp(80px,22vmin,140px)]";

  return (
    <main
      className="relative flex-1 h-full flex flex-col items-center justify-center bg-cover bg-center overflow-hidden"
      style={style}
    >
      {/* パーティクルエフェクトコンテナ */}
      {particles.map((p) => (
        <ParticleEffect
          key={p.id}
          trigger={true}
          x={p.x}
          y={p.y}
          count={30}
          color={p.color}
        />
      ))}

      {isLandscape ? (
        // 横向き: 左 = skill, 右 = enemy
        <div className="w-full max-w-[1000px] grid grid-cols-2 gap-x-6 px-4 py-3">
          {/* 左（skill）縦並び */}
          <div className="flex flex-col items-center justify-center gap-3 pr-2">
            <div
              className="translate-x-1"
              onClick={(e) => handleButtonClick("skill1", e)}
            >
              <ButtonItem name="skill1" kind="skill" size="sm" stats={stats} priority />
            </div>
            <div
              className="-translate-x-2"
              onClick={(e) => handleButtonClick("skill2", e)}
            >
              <ButtonItem name="skill2" kind="skill" size="md" stats={stats} />
            </div>
            <div
              className="translate-x-1"
              onClick={(e) => handleButtonClick("skill3", e)}
            >
              <ButtonItem name="skill3" kind="skill" size="lg" stats={stats} />
            </div>
          </div>

          {/* 右（enemy）縦並び */}
          <div className="flex flex-col items-center justify-center gap-3 pl-2">
            <div
              className="-translate-x-1"
              onClick={(e) => handleButtonClick("enemy1", e)}
            >
              <ButtonItem name="enemy1" kind="enemy" size="sm" stats={stats} />
            </div>
            <div
              className="translate-x-2"
              onClick={(e) => handleButtonClick("enemy2", e)}
            >
              <ButtonItem name="enemy2" kind="enemy" size="md" stats={stats} />
            </div>
            <div
              className="-translate-x-1"
              onClick={(e) => handleButtonClick("enemy3", e)}
            >
              <ButtonItem name="enemy3" kind="enemy" size="lg" stats={stats} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 縦向き: 上=skill, 下=enemy */}
          <div className="w-full max-w-[920px] grid grid-cols-3 justify-items-center items-center gap-y-3 px-4 py-3 mb-8">
            <div
              className="translate-y-2"
              onClick={(e) => handleButtonClick("skill1", e)}
            >
              <ButtonItem name="skill1" kind="skill" size="sm" stats={stats} priority />
            </div>
            <div
              className="-translate-y-4"
              onClick={(e) => handleButtonClick("skill2", e)}
            >
              <ButtonItem name="skill2" kind="skill" size="md" stats={stats} />
            </div>
            <div
              className="translate-y-2"
              onClick={(e) => handleButtonClick("skill3", e)}
            >
              <ButtonItem name="skill3" kind="skill" size="lg" stats={stats} />
            </div>
          </div>

          <div className="w-full max-w-[920px] grid grid-cols-3 justify-items-center items-center gap-y-3 px-4 py-3">
            <div
              className="-translate-y-2"
              onClick={(e) => handleButtonClick("enemy1", e)}
            >
              <ButtonItem name="enemy1" kind="enemy" size="sm" stats={stats} />
            </div>
            <div
              className="translate-y-4"
              onClick={(e) => handleButtonClick("enemy2", e)}
            >
              <ButtonItem name="enemy2" kind="enemy" size="md" stats={stats} />
            </div>
            <div
              className="-translate-y-2"
              onClick={(e) => handleButtonClick("enemy3", e)}
            >
              <ButtonItem name="enemy3" kind="enemy" size="lg" stats={stats} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
