"use client";

/**
 * Vibration API を使用した弱いバイブレーションを実行する
 * @param duration - バイブレーション時間（ミリ秒）、デフォルト: 50ms
 */
export function useVibration() {
  const vibrate = (duration: number = 50) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  return { vibrate };
}
