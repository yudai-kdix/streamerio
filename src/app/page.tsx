"use client";

// 検索パラメータ依存＆クッキー読み取りのため、事前プリレンダーは行わない
export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { fetchViewerIdentity, updateViewerName, type GameOverResponse } from "@/lib/api";
import { getCookie, setCookie } from "@/lib/cookies";
import ButtonGrid from "@/components/ButtonGrid";
import { useRouter, useSearchParams } from "next/navigation";
import { useBufferedButtonEvents } from "@/lib/useBufferedButtonEvents";

// 検索パラメータに依存する実処理を分離（Suspense でラップ）
function ViewerContent() {
  const params = useSearchParams();
  const paramStreamerId = params.get("streamer_id");

  const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "", []);
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const router = useRouter();

  const trimmedInput = nameInput.trim();
  const currentName = viewerName?.trim() ?? "";
  const isNameDirty = trimmedInput !== currentName;
  const effectiveName = viewerId ? (currentName || viewerId) : null;

  const ensureViewer = useCallback(() => {
    if (!backendUrl) return;
    fetchViewerIdentity(backendUrl).then((identity) => {
      if (!identity) return;
      setViewerId(identity.viewerId);
      setCookie("viewer_id", identity.viewerId);
      const normalized = identity.name?.trim() ?? "";
      setViewerName(normalized || null);
      setNameInput(normalized);
    });
  }, [backendUrl]);

  // 初回ロード時に Cookie とクエリを突き合わせ、必要なら viewer_id を取得
  useEffect(() => {
    const cookieStreamer = getCookie("streamer_id");

    // クエリに streamer_id がある場合は最優先で採用
    if (paramStreamerId) {
      setStreamerId(paramStreamerId);
      setCookie("streamer_id", paramStreamerId);
      ensureViewer();
      return;
    }

    // クエリに無い場合、Cookie を使用
    if (cookieStreamer) {
      setStreamerId(cookieStreamer);
    }
    ensureViewer();
  }, [paramStreamerId, backendUrl, ensureViewer]);

  const handleGameOver = useCallback(
    (payload: GameOverResponse) => {
      if (!streamerId || !viewerId) return;
      setGameOver(true);
      if (typeof window !== "undefined" && payload.viewer_summary) {
        const key = `result:${streamerId}:${viewerId}`;
        sessionStorage.setItem(key, JSON.stringify(payload.viewer_summary));
      }
      router.push(`/result/${encodeURIComponent(streamerId)}?viewer_id=${encodeURIComponent(viewerId)}`);
    },
    [router, streamerId, viewerId]
  );

  const queueButtonEvent = useBufferedButtonEvents({
    backendUrl,
    roomId: streamerId,
    viewerId,
    gameOver,
    onGameOver: handleGameOver,
  });

  const handleClick = queueButtonEvent;

  const handleNameSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!backendUrl || !viewerId) return;
      setSavingName(true);
      const res = await updateViewerName({ baseUrl: backendUrl, viewerId, name: trimmedInput });
      setSavingName(false);
      if (!res) return;
      const normalized = res.name?.trim() ?? "";
      setViewerName(normalized || null);
      setNameInput(normalized);
    },
    [backendUrl, viewerId, trimmedInput]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 text-white bg-black/60 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <span className="font-bold text-lg">Streamerio - Viewer</span>
          <span className="text-xs text-white/60">
            現在の表示名: {effectiveName ?? "取得中..."}
          </span>
        </div>
        <form className="flex items-center gap-2" onSubmit={handleNameSubmit}>
          <label className="text-sm text-white/80" htmlFor="viewer-name">
            表示名
          </label>
          <input
            id="viewer-name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="rounded-md border border-white/30 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="名無し"
            maxLength={24}
            disabled={savingName}
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60"
            disabled={savingName || !isNameDirty}
          >
            保存
          </button>
        </form>
      </header>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <ButtonGrid onClick={handleClick} />
          {gameOver ? (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xl font-semibold">
              ゲームが終了しました。リザルトを表示しています...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// 視聴者向けページ（外側で Suspense を付与）
export default function Page() {
  return (
    <Suspense fallback={<div className="text-white/80 px-4 py-3">読み込み中...</div>}>
      <ViewerContent />
    </Suspense>
  );
}
