
import {
  sendButtonEvents,
  type ButtonName,
  type GameOverResponse,
  type RoomStat,
} from "@/lib/api";
import { useCallback, useEffect, useRef } from "react";

/** ボタンイベントの種類 */
const BUTTON_NAMES: ButtonName[] = [
  "enemy1",
  "enemy2",
  "enemy3",
  "skill1",
  "skill2",
  "skill3",
];

/** イベント送信間隔（ミリ秒） */
const FLUSH_INTERVAL_MS = 1500;
/** ハートビート送信間隔（ミリ秒） */
const HEARTBEAT_INTERVAL_MS = 1500;

function createEmptyPushCounts(): Record<ButtonName, number> {
  // 全ボタンの押下カウントを初期化（ゼロ）
  return {
    enemy1: 0,
    enemy2: 0,
    enemy3: 0,
    skill1: 0,
    skill2: 0,
    skill3: 0,
  };
}

type BufferedEventsOptions = {
  // バックエンドのベースURL
  backendUrl: string | null | undefined;
  // ゲームルームID
  roomId: string | null | undefined;
  // 視聴者ID
  viewerId: string | null | undefined;
  // 視聴者名
  viewerName:string| null | undefined;
  // ゲーム終了状態
  gameOver: boolean;
  // ゲーム終了時のコールバック
  onGameOver: (payload: GameOverResponse) => void;
  // 視聴者数更新時のコールバック
  onViewerCountUpdate?: (count: number) => void;
  // 統計情報更新時のコールバック
  onStatsUpdate?: (stats: RoomStat[]) => void;
};

export function useBufferedButtonEvents({
  backendUrl,
  roomId,
  viewerId,
  viewerName,
  gameOver,
  onGameOver,
  onViewerCountUpdate,
  onStatsUpdate,
}: BufferedEventsOptions): (name: ButtonName) => void {
  // ボタン押下のペンディングカウント
  const pendingCountsRef = useRef<Record<ButtonName, number>>(
    createEmptyPushCounts()
  );
  // 最後にイベントを送信した時刻
  const lastFlushAtRef = useRef<number>(Date.now());
  // イベント送信中フラグ（重複送信を防ぐ）
  const flushInFlightRef = useRef(false);

  useEffect(() => {
    // roomIdまたはviewerIdが変更されたときペンディングカウントをリセット
    pendingCountsRef.current = createEmptyPushCounts();
  }, [roomId, viewerId]);

  const queueButtonEvent = useCallback(
    (name: ButtonName) => {
      // 必要な情報が揃っていないか、ゲーム終了時は処理しない
      if (!roomId || !viewerId || gameOver) return;
      // ボタン押下をカウント
      pendingCountsRef.current[name] += 1;
    },
    [roomId, viewerId, gameOver]
  );

  useEffect(() => {
    // 必要な情報が揃っていない場合は処理を終了
    if (!roomId || !viewerId || gameOver) {
      return;
    }

    let cancelled = false;

    // ペンディング中のイベントを取得し、リセット
    const consumePendingEvents = () => {
      const consumed: Partial<Record<ButtonName, number>> = {};
      const events: { button_name: ButtonName; push_count: number }[] = [];
      for (const name of BUTTON_NAMES) {
        const count = pendingCountsRef.current[name];
        if (count > 0) {
          events.push({ button_name: name, push_count: count });
          consumed[name] = count;
          // カウントをリセット
          pendingCountsRef.current[name] = 0;
        }
      }
      return { events, consumed };
    };

    // 送信失敗時にペンディングカウントを復元
    const restoreCounts = (consumed: Partial<Record<ButtonName, number>>) => {
      for (const [name, count] of Object.entries(consumed)) {
        if (!count) continue;
        pendingCountsRef.current[name as ButtonName] += count;
      }
    };

    const attemptFlush = async (forceHeartbeat: boolean) => {
      // 既に送信中の場合はスキップ
      if (flushInFlightRef.current) return;
      flushInFlightRef.current = true;

      const { events, consumed } = consumePendingEvents();
      // ハートビートでない場合、イベントがなければ送信しない
      if (!forceHeartbeat && events.length === 0) {
        flushInFlightRef.current = false;
        return;
      }

      try {
        // バックエンドにイベントを送信
        const response = await sendButtonEvents({
          baseUrl: backendUrl ?? "",
          roomId,
          viewerId,
          viewerName,
          pushEvents: events,
        });

        if (!response) {
          throw new Error("Failed to send events");
        }

        // 視聴者数の更新
        if (onViewerCountUpdate && response.event_results && response.event_results.length > 0) {
          // どのイベント結果にも同じ視聴者数が入っているはずなので先頭を使用
          const count = response.event_results[0].viewer_count;
          onViewerCountUpdate(count);
        }

        // 統計情報の更新
        if (onStatsUpdate && (response as any).stats) {
          onStatsUpdate((response as any).stats);
        }

        // 最後の送信時刻を更新
        lastFlushAtRef.current = Date.now();

        // ゲーム終了レスポンスの処理
        if ("game_over" in response && response.game_over) {
          onGameOver(response);
        }
      } catch (error) {
        // 送信失敗時はペンディングカウントを復元
        restoreCounts(consumed);
        if (process.env.NODE_ENV !== "production") {
          console.warn("イベント送信に失敗しました", error);
        }
      } finally {
        flushInFlightRef.current = false;
      }
    };

    lastFlushAtRef.current = Date.now();

    // 定期的にイベント送信をチェック
    const interval = window.setInterval(() => {
      if (cancelled) return;
      const hasPending = BUTTON_NAMES.some(
        (name) => pendingCountsRef.current[name] > 0
      );
      const now = Date.now();
      // ハートビート間隔が経過したかチェック
      const shouldHeartbeat =
        now - lastFlushAtRef.current >= HEARTBEAT_INTERVAL_MS;

      // ペンディングイベントがあれば送信、なければハートビート送信
      if (hasPending) {
        void attemptFlush(false);
      } else if (shouldHeartbeat) {
        void attemptFlush(true);
      }
    }, FLUSH_INTERVAL_MS);

    // クリーンアップ：インターバルをクリア
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [backendUrl, roomId, viewerId, viewerName, gameOver, onGameOver, onViewerCountUpdate, onStatsUpdate]);

  // ボタン押下をキューに追加する関数を返す
  return queueButtonEvent;
}

