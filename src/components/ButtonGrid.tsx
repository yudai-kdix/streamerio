"use client";

import Image from "next/image";
import buttonPng from "@assets/button.png";
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
              <div className={boxCls}>
                <Image src={buttonPng} alt="skill1" fill className={`object-contain ${btnCls}`} priority />
              </div>
            </div>
            <div className="-translate-x-2" onClick={() => onClick("skill2")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="skill2" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
            <div className="translate-x-1" onClick={() => onClick("skill3")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="skill3" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
          </div>

          {/* 右（enemy）縦並び */}
          <div className="flex flex-col items-center justify-center gap-3 pl-2">
            <div className="-translate-x-1" onClick={() => onClick("enemy1")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="enemy1" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
            <div className="translate-x-2" onClick={() => onClick("enemy2")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="enemy2" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
            <div className="-translate-x-1" onClick={() => onClick("enemy3")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="enemy3" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 縦向き: 上=skill, 下=enemy */}
          <div className="w-full max-w-[920px] grid grid-cols-3 justify-items-center items-center gap-y-3 px-4 py-3 mb-8">
            <div className="translate-y-2" onClick={() => onClick("skill1")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="skill1" fill className={`object-contain ${btnCls}`} priority />
              </div>
            </div>
            <div className="-translate-y-4" onClick={() => onClick("skill2")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="skill2" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
            <div className="translate-y-2" onClick={() => onClick("skill3")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="skill3" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
          </div>

          <div className="w-full max-w-[920px] grid grid-cols-3 justify-items-center items-center gap-y-3 px-4 py-3">
            <div className="-translate-y-2" onClick={() => onClick("enemy1")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="enemy1" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
            <div className="translate-y-4" onClick={() => onClick("enemy2")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="enemy2" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
            <div className="-translate-y-2" onClick={() => onClick("enemy3")}>
              <div className={boxCls}>
                <Image src={buttonPng} alt="enemy3" fill className={`object-contain ${btnCls}`} />
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
