"use client";

import Image from "next/image";
import buttonPng from "@assets/button.png";
import skillIcon from "@assets/skill.png";
import enemyIcon from "@assets/enemy.png";
import bgPng from "@assets/background.png";
import bgLandscapePng from "@assets/background_landscape.png";
import { useEffect, useMemo, useState } from "react";
import type { ButtonName } from "@/lib/api";

type Props = {
  onClick: (name: ButtonName) => void;
};

// 6 つのボタンを所定の配置で描画する（Tailwind ベース）
export default function ButtonGrid({ onClick }: Props) {
  const [isLandscape, setIsLandscape] = useState(false);

  // 端末の向きを検出して背景とレイアウトを切替
  useEffect(() => {
    const detect = () => {
      if (typeof window === "undefined") return false;
      const mm = window.matchMedia && window.matchMedia("(orientation: landscape)");
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

  const style = useMemo<React.CSSProperties>(
    () => ({ backgroundImage: `url(${isLandscape ? bgLandscapePng.src : bgPng.src})` }),
    [isLandscape]
  );

  const btnCls =
    "cursor-pointer transition-transform duration-150 active:scale-95 select-none";
  const boxCls = "relative w-[clamp(80px,22vmin,140px)] h-[clamp(80px,22vmin,140px)]";

  // ボタン＋アイコンの描画（size: sm|md|lg）
  const renderButton = (
    kind: "skill" | "enemy",
    size: "sm" | "md" | "lg",
    opts?: { priority?: boolean }
  ) => {
    // アイコンを一回り小さくするためパディングを増やす
    const pad =
      size === "sm"
        ? kind === "enemy" ? "p-8" : "p-7"
        : size === "md"
          ? kind === "enemy" ? "p-6" : "p-5"
          : kind === "enemy" ? "p-4" : "p-3";
    const icon = kind === "skill" ? skillIcon : enemyIcon;
    return (
      <div className={boxCls}>
        <Image src={buttonPng} alt="button" fill className={`object-contain ${btnCls}`} priority={opts?.priority} />
        <Image
          src={icon}
          alt={kind}
          fill
          className={`object-contain ${pad} pointer-events-none`}
        />
      </div>
    );
  };

  return (
    <main
      className="relative flex-1 flex flex-col items-center justify-center bg-cover bg-center overflow-hidden"
      style={style}
    >
      {isLandscape ? (
        // 横向き: 左 = skill, 右 = enemy
        <div className="w-full max-w-[1000px] grid grid-cols-2 gap-x-6 px-4 py-3">
          {/* 左（skill）縦並び */}
          <div className="flex flex-col items-center justify-center gap-3 pr-2">
            <div className="translate-x-1" onClick={() => onClick("skill1")}>
              {renderButton("skill", "sm", { priority: true })}
            </div>
            <div className="-translate-x-2" onClick={() => onClick("skill2")}>
              {renderButton("skill", "md")}
            </div>
            <div className="translate-x-1" onClick={() => onClick("skill3")}>
              {renderButton("skill", "lg")}
            </div>
          </div>

          {/* 右（enemy）縦並び */}
          <div className="flex flex-col items-center justify-center gap-3 pl-2">
            <div className="-translate-x-1" onClick={() => onClick("enemy1")}>
              {renderButton("enemy", "sm")}
            </div>
            <div className="translate-x-2" onClick={() => onClick("enemy2")}>
              {renderButton("enemy", "md")}
            </div>
            <div className="-translate-x-1" onClick={() => onClick("enemy3")}>
              {renderButton("enemy", "lg")}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 縦向き: 上=skill, 下=enemy */}
          <div className="w-full max-w-[920px] grid grid-cols-3 justify-items-center items-center gap-y-3 px-4 py-3 mb-8">
            <div className="translate-y-2" onClick={() => onClick("skill1")}>
              {renderButton("skill", "sm", { priority: true })}
            </div>
            <div className="-translate-y-4" onClick={() => onClick("skill2")}>
              {renderButton("skill", "md")}
            </div>
            <div className="translate-y-2" onClick={() => onClick("skill3")}>
              {renderButton("skill", "lg")}
            </div>
          </div>

          <div className="w-full max-w-[920px] grid grid-cols-3 justify-items-center items-center gap-y-3 px-4 py-3">
            <div className="-translate-y-2" onClick={() => onClick("enemy1")}>
              {renderButton("enemy", "sm")}
            </div>
            <div className="translate-y-4" onClick={() => onClick("enemy2")}>
              {renderButton("enemy", "md")}
            </div>
            <div className="-translate-y-2" onClick={() => onClick("enemy3")}>
              {renderButton("enemy", "lg")}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
