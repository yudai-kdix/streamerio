// バックエンド API 呼び出し（日本語コメント）

export type ButtonName = "enemy1" | "enemy2" | "enemy3" | "skill1" | "skill2" | "skill3";

export async function fetchViewerId(baseUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/get_viewer_id`, { method: "GET", credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null) as { viewer_id?: string } | null;
    return data?.viewer_id ?? null;
  } catch {
    return null;
  }
}

export async function sendButtonEvent(params: {
  baseUrl: string;
  roomId: string; // 通常は streamer_id を使用
  streamerId: string;
  viewerId: string;
  buttonName: ButtonName;
}) {
  const { baseUrl, roomId, streamerId, viewerId, buttonName } = params;
  const url = `${baseUrl}/api/rooms/${encodeURIComponent(roomId)}/events`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      button_name: buttonName,
      streamer_id: streamerId,
      viewer_id: viewerId,
    }),
  });
}

