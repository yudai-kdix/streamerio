import { useEffect, useRef, useState } from "react";

interface ViewerCountDisplayProps {
  latestCount: number | null;
}

export default function ViewerCountDisplay({ latestCount }: ViewerCountDisplayProps) {
  const [history, setHistory] = useState<number[]>([]);
  const [displayValue, setDisplayValue] = useState(0);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (latestCount !== null) {
      setHistory((prev) => {
        const newHistory = [...prev, latestCount];
        // Keep enough history to go back 2 steps
        // We need at least 3 items to do "2 ago -> 1 ago" when we have the latest
        // [n-2, n-1, n]
        if (newHistory.length > 3) {
          return newHistory.slice(newHistory.length - 3);
        }
        return newHistory;
      });
    }
  }, [latestCount]);

  const currentValueRef = useRef(0);

  useEffect(() => {
    // Need at least 3 items to follow "2 times ago -> 1 time ago" logic strictly
    // If we have [A, B, C], we animate A -> B.
    
    let endValue = 0;

    if (history.length >= 3) {
      endValue = history[history.length - 2];
    } else if (history.length === 2) {
      endValue = history[1];
    } else if (history.length === 1) {
      setDisplayValue(history[0]);
      currentValueRef.current = history[0];
      return;
    } else {
      return;
    }

    // Start from the current animated value to avoid jumps
    const startValue = currentValueRef.current;
    
    // Make duration longer than fetch interval (1500ms) to avoid "stops"
    // The animation will be interrupted by the next update before it finishes,
    // creating a continuous motion.
    const duration = 3000; 
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Linear interpolation
      const current = startValue + (endValue - startValue) * progress;
      setDisplayValue(Math.floor(current));
      currentValueRef.current = current;

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we land exactly on endValue
        setDisplayValue(endValue);
        currentValueRef.current = endValue;
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [history]);

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
