"use client";

// 検索パラメータ依存＆クッキー読み取りのため、事前プリレンダーは行わない
export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  fetchViewerIdentity,
  updateViewerName,
  type ButtonName,
  type GameOverResponse,
} from "@/lib/api";
import { getCookie, setCookie } from "@/lib/cookies";
import ButtonGrid from "@/components/ButtonGrid";
import OnboardingModal, { type OnboardingStep } from "@/components/OnboardingModal";
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
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [guideStep, setGuideStep] = useState(0);
  const router = useRouter();

  const trimmedInput = nameInput.trim();
  const currentName = viewerName?.trim() ?? "";
  const isNameDirty = trimmedInput !== currentName;
  const isNameValid = trimmedInput.length > 0;
  const hasRegisteredName = currentName.length > 0;
  const effectiveName = viewerId ? (currentName || viewerId) : null;

  useEffect(() => {
    if (viewerName === null) return;
    const hasName = viewerName.trim().length > 0;
    if (!hasName) {
      setGuideStep(0);
      setIsGuideOpen(true);
    }
  }, [viewerName]);

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
    viewerName,
    gameOver,
    onGameOver: handleGameOver,
  });

  const saveName = useCallback(async () => {
    if (!backendUrl || !viewerId) return false;
    if (!trimmedInput) return false;
    setSavingName(true);
    try {
      const res = await updateViewerName({ baseUrl: backendUrl, viewerId, name: trimmedInput });
      if (!res) return false;
      const normalized = res.name?.trim() ?? "";
      setViewerName(normalized || null);
      setNameInput(normalized);
      return true;
    } finally {
      setSavingName(false);
    }
  }, [backendUrl, trimmedInput, viewerId]);

  const handleNameSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const saved = await saveName();
      if (saved) {
        setIsGuideOpen(false);
      }
    },
    [saveName]
  );

  const handleClick = useCallback(
    (buttonName: ButtonName) => {
      if (!hasRegisteredName || isGuideOpen) return;
      queueButtonEvent(buttonName);
    },
    [hasRegisteredName, isGuideOpen, queueButtonEvent]
  );

  const handleGuideOpen = useCallback(() => {
    setGuideStep(0);
    setIsGuideOpen(true);
  }, []);

  const handleGuideFinalStep = useCallback(async () => {
    if (hasRegisteredName) {
      setIsGuideOpen(false);
      return true;
    }
    const saved = await saveName();
    if (!saved) return false;
    setIsGuideOpen(false);
    return true;
  }, [hasRegisteredName, saveName]);

  const guideSteps = useMemo<OnboardingStep[]>(
    () => [
      {
        id: "intro",
        title: "Streamerio へようこそ",
        description: "なんか書く。操作説明は後からでもヘッダーの ? アイコンから再表示できます。",
        media: (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-sm px-6 text-center">
            Gifとか置くイメージ
          </div>
        ),
      },
      {
        id: "buttons",
        title: "スキル / エネミーを押す",
        description: "画面中央の 6 つのボタンをタップすると、配信者側にイベントが送信されます。",
        media: (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 flex items-center justify-center text-center text-white/70 text-sm px-4">
            実際のプレイ GIF とか？。
          </div>
        ),
      },
      {
        id: "name",
        title: "表示名を入力",
        description: "リザルトにも表示される大事な名前です。保存してからゲームに参加しましょう。",
        content: (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleGuideFinalStep();
            }}
          >
            <label className="text-sm text-white/80" htmlFor="guide-viewer-name">
              表示名
            </label>
            <input
              id="guide-viewer-name"
              type="text"
              maxLength={24}
              className="w-full rounded-lg border border-white/30 bg-black/50 px-3 py-2 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="例: ばでぃばでぃ"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={savingName}
            />
            <p className="text-xs text-white/60">保存後はいつでもヘッダーから変更できます。</p>
          </form>
        ),
        nextLabel: hasRegisteredName ? "閉じる" : savingName ? "保存中..." : "保存して開始",
        nextDisabled: !hasRegisteredName && (!isNameValid || savingName),
        onNext: handleGuideFinalStep,
      },
    ],
    [handleGuideFinalStep, hasRegisteredName, isNameValid, nameInput, savingName, setNameInput]
  );

  const lastGuideStepIndex = Math.max(guideSteps.length - 1, 0);

  const handleGuideNextStep = useCallback(() => {
    setGuideStep((prev) => Math.min(prev + 1, lastGuideStepIndex));
  }, [lastGuideStepIndex]);

  const handleGuidePrevStep = useCallback(() => {
    setGuideStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleGuideClose = useCallback(() => {
    if (!hasRegisteredName) return;
    setIsGuideOpen(false);
  }, [hasRegisteredName]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 text-white bg-black/60 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <span className="font-bold text-lg">Streamerio - Viewer</span>
          <span className="text-xs text-white/60">
            現在の表示名: {effectiveName ?? "取得中..."}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form className="flex flex-wrap items-center gap-2" onSubmit={handleNameSubmit}>
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
              disabled={savingName || !isNameDirty || !isNameValid || !viewerId}
            >
              保存
            </button>
          </form>
          <button
            type="button"
            onClick={handleGuideOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-lg text-white/80 hover:bg-white/10"
            aria-label="操作説明モーダルを開く"
            title="操作説明"
          >
            ?
          </button>
        </div>
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

      <OnboardingModal
        open={isGuideOpen}
        steps={guideSteps}
        currentStep={guideStep}
        onPrev={handleGuidePrevStep}
        onNextDefault={handleGuideNextStep}
        onClose={handleGuideClose}
        allowClose={hasRegisteredName}
      />
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
