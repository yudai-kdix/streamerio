import { useEffect, useRef, useState } from "react";

interface ViewerCountDisplayProps {
  latestCount: number | null;
}

export default function ViewerCountDisplay({ latestCount }: ViewerCountDisplayProps) {
  const [history, setHistory] = useState<number[]>([]);
  const [displayValue, setDisplayValue] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const currentValueRef = useRef(0);

  useEffect(() => {
    if (latestCount === null) return;

    const endValue = latestCount;
    const startValue = currentValueRef.current;

    // If this is the first value, set immediately
    if (history.length === 0) {
      setDisplayValue(endValue);
      currentValueRef.current = endValue;
      setHistory([endValue]);
      return;
    }

    setHistory(prev => [...prev, endValue]);

    // Animate to the new value
    // Duration slightly longer than fetch interval (1500ms) to keep it moving
    const duration = 2000;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out expo for nicer feeling
      // const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      // Linear is fine for continuous updates, but let's try simple ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (endValue - startValue) * ease;
      setDisplayValue(Math.floor(current));
      currentValueRef.current = current;

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        currentValueRef.current = endValue;
      }
    };

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [latestCount]);

  if (history.length === 0) return null;

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
