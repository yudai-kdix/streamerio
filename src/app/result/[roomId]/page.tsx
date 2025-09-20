"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { fetchRoomResult, type ButtonName, type RoomResultResponse } from "@/lib/api";

const buttonLabels: Record<ButtonName, string> = {
  skill1: "スキルボタン1",
  skill2: "スキルボタン2",
  skill3: "スキルボタン3",
  enemy1: "エネミーボタン1",
  enemy2: "エネミーボタン2",
  enemy3: "エネミーボタン3",
};

export default function ResultPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const viewerId = searchParams.get("viewer_id");
  const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "", []);

  const [result, setResult] = useState<RoomResultResponse | null>(null);
  const [viewerSummary, setViewerSummary] = useState<RoomResultResponse["viewer_summary"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveName = (id: string, name?: string | null) => {
    const trimmed = name?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : id;
  };

  useEffect(() => {
    if (!backendUrl || !roomId) return;

    const storageKey = viewerId ? `result:${roomId}:${viewerId}` : null;
    if (typeof window !== "undefined" && storageKey) {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        try {
          setViewerSummary(JSON.parse(cached));
        } catch {
          // 破損していても無視
        }
      }
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRoomResult({ baseUrl: backendUrl, roomId, viewerId })
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setError("結果を取得できませんでした。");
          setLoading(false);
          return;
        }
        setResult(res);
        setLoading(false);
        if (res.viewer_summary) {
          setViewerSummary(res.viewer_summary);
          if (typeof window !== "undefined" && storageKey) {
            sessionStorage.setItem(storageKey, JSON.stringify(res.viewer_summary));
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("結果を取得できませんでした。");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [backendUrl, roomId, viewerId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-4 py-4 border-b border-white/10">
        <h1 className="text-2xl font-semibold">ゲーム結果</h1>
        <p className="text-sm text-white/70">ルームID: {roomId}</p>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="text-white/80">読み込み中...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : result ? (
          <>
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">概要</h2>
              <p className="text-white/70">
                終了時刻: {new Date(result.ended_at).toLocaleString("ja-JP")}
              </p>
              {result.top_overall ? (
                <p>
                  最多参加: <span className="font-semibold">{resolveName(result.top_overall.viewer_id, result.top_overall.viewer_name)}</span> ({result.top_overall.count}
                  回)
                </p>
              ) : (
                <p>視聴者の参加履歴はありません。</p>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">ボタン別トップ視聴者</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(result.top_by_event).map(([key, info]) => (
                  <div key={key} className="rounded-lg border border-white/10 px-4 py-3 bg-white/5">
                    <div className="text-sm text-white/60">{buttonLabels[key as ButtonName]}</div>
                    {info.viewer_id ? (
                      <div className="text-lg font-semibold">
                        {resolveName(info.viewer_id, info.viewer_name)}
                        <span className="text-sm font-normal text-white/70">（{info.count}回）</span>
                        <span className="block text-xs font-normal text-white/50">ID: {info.viewer_id}</span>
                      </div>
                    ) : (
                      <div className="text-white/70">該当なし</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">視聴者ランキング</h2>
              {result.viewer_totals.length === 0 ? (
                <div className="text-white/70">視聴者イベントは記録されていません。</div>
              ) : (
                <ul className="divide-y divide-white/10 rounded-lg border border-white/10 bg-white/5">
                  {result.viewer_totals.map((viewer, index) => (
                    <li key={viewer.viewer_id + index} className="flex justify-between px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {index + 1}. {resolveName(viewer.viewer_id, viewer.viewer_name)}
                        </span>
                        <span className="text-xs font-normal text-white/50">ID: {viewer.viewer_id}</span>
                      </div>
                      <span>{viewer.count} 回</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">あなたの記録</h2>
              {viewerSummary && viewerId ? (
                <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 space-y-2">
                  <div className="flex flex-col gap-1">
                    <span>
                      表示名: <span className="font-semibold">{resolveName(viewerSummary.viewer_id, viewerSummary.viewer_name)}</span>
                    </span>
                    <span className="text-sm text-white/70">viewer_id: {viewerSummary.viewer_id}</span>
                  </div>
                  <p>合計 {viewerSummary.total} 回</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(viewerSummary.counts).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span>{buttonLabels[key as ButtonName]}</span>
                        <span>{value}回</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewerId ? (
                <div className="text-white/70">視聴者別の記録はまだ取得できませんでした。</div>
              ) : (
                <div className="text-white/70">視聴者ID が指定されていません。</div>
              )}
            </section>
          </>
        ) : null}

        <div className="pt-4">
          <Link
            href={viewerId ? `/?streamer_id=${encodeURIComponent(roomId)}&viewer_id=${encodeURIComponent(viewerId)}` : "/"}
            className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            参加ページへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
