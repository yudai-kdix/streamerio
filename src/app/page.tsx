"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchViewerId, sendButtonEvent, type ButtonName } from "@/lib/api";
import { getCookie, setCookie } from "@/lib/cookies";
import ButtonGrid from "@/components/ButtonGrid";
import { useSearchParams } from "next/navigation";

// 視聴者向けページ
export default function Page() {
  const params = useSearchParams();
  const paramStreamerId = params.get("streamer_id");

  const backendUrl = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "", []);
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);

  // 初回ロード時に Cookie とクエリを突き合わせ、必要なら viewer_id を取得
  useEffect(() => {
    const cookieStreamer = getCookie("streamer_id");
    const cookieViewer = getCookie("viewer_id");

    // クエリに streamer_id がある場合は最優先で採用
    if (paramStreamerId) {
      setStreamerId(paramStreamerId);
      setCookie("streamer_id", paramStreamerId);
      if (!cookieViewer || cookieStreamer !== paramStreamerId) {
        // 異なる配信者に切り替わった場合や viewer_id 未保存の場合は再取得
        if (backendUrl) {
          fetchViewerId(backendUrl).then((vid) => {
            if (vid) {
              setViewerId(vid);
              setCookie("viewer_id", vid);
            }
          });
        }
      } else {
        setViewerId(cookieViewer);
      }
      return;
    }

    // クエリに無い場合、Cookie を使用
    if (cookieStreamer) {
      setStreamerId(cookieStreamer);
    }
    if (cookieViewer) {
      setViewerId(cookieViewer);
    } else if (backendUrl) {
      fetchViewerId(backendUrl).then((vid) => {
        if (vid) {
          setViewerId(vid);
          setCookie("viewer_id", vid);
        }
      });
    }
  }, [paramStreamerId, backendUrl]);

  const handleClick = useCallback(
    async (name: ButtonName) => {
      if (!backendUrl || !streamerId || !viewerId) return;
      await sendButtonEvent({
        baseUrl: backendUrl,
        roomId: streamerId, // 仕様想定: rooms/{id} は streamer_id
        streamerId,
        viewerId,
        buttonName: name,
      });
    },
    [backendUrl, streamerId, viewerId]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 font-bold text-lg text-white bg-black/60">視聴者操作パネル</header>
      <ButtonGrid onClick={handleClick} />
    </div>
  );
}
