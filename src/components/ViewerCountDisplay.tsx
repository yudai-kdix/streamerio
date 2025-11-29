import { useEffect, useRef, useState } from "react";

interface ViewerCountDisplayProps {
  latestCount: number | null;
}

export default function ViewerCountDisplay({ latestCount }: ViewerCountDisplayProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // アニメーション用の現在値（浮動小数点数）
  const currentValueRef = useRef(0);
  // 目標値
  const targetValueRef = useRef(0);
  // アニメーションループのID
  const requestRef = useRef<number>();

  useEffect(() => {
    if (latestCount !== null) {
      targetValueRef.current = latestCount;
      
      // 初回ロード時は即座に反映
      if (currentValueRef.current === 0 && displayValue === 0) {
        currentValueRef.current = latestCount;
        setDisplayValue(latestCount);
      }
    }
  }, [latestCount, displayValue]);

  useEffect(() => {
    const animate = () => {
      const target = targetValueRef.current;
      const current = currentValueRef.current;
      
      // 差分を計算
      const diff = target - current;
      
      // 差分が十分に小さい場合は目標値に固定して停止（CPU負荷軽減）
      // ただし、閾値を小さくしすぎると「止まった」感が出るので調整
      if (Math.abs(diff) < 0.1) {
        if (current !== target) {
          currentValueRef.current = target;
          setDisplayValue(target);
        }
        // ループは継続せず、次の更新を待つ（またはuseEffectの依存で再開）
        // ここではシンプルにループを止めず、次のフレームもチェックする形にするが、
        // 実際には動きがないなら描画更新しない方が良い。
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      // Lerp (線形補間)
      // 係数 0.02: 60fpsの場合、1秒で約70%進む、2秒で約90%進む。
      // 1.5秒間隔でデータが来ても、まだ完全に追いついていないため、動きが止まらない。
      const factor = 0.02;
      const nextValue = current + diff * factor;

      currentValueRef.current = nextValue;
      
      // 表示用に整数化（Math.floorだと増減で挙動が違うのでMath.round推奨だが、
      // 元コードに合わせて一旦floorにするか、見た目の安定性でroundにする）
      // ここでは四捨五入(Math.round)を採用
      setDisplayValue(Math.round(nextValue));

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  if (latestCount === null && displayValue === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-6 py-2 border border-white/10 shadow-lg flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-white/80 text-sm font-medium">視聴者数</span>
        </div>
        <div className="text-2xl font-bold text-white tabular-nums tracking-wider">
          {displayValue.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
