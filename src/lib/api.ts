// バックエンド API 呼び出し（日本語コメント）

export type ButtonName = "enemy1" | "enemy2" | "enemy3" | "skill1" | "skill2" | "skill3";

export type ViewerSummaryPayload = {
  viewer_id: string;
  viewer_name?: string | null;
  counts: Record<ButtonName, number>;
  total: number;
};

export type ViewerIdentity = {
  viewerId: string;
  name: string | null;
};

export type EventResultResponse = {
  event_type: ButtonName;
  current_count: number;
  required_count: number;
  effect_triggered: boolean;
  viewer_count: number;
  next_threshold: number;
};

export type GameOverResponse = {
  game_over: true;
  viewer_summary: ViewerSummaryPayload;
};

export type PushEventPayload = {
  button_name: ButtonName;
  push_count: number;
};

export type SendButtonEventsResponse =
  | { event_results: EventResultResponse[]; game_over?: false }
  | (GameOverResponse & { event_results?: EventResultResponse[] });

export type ResultTopEntry = {
  viewer_id: string;
  viewer_name?: string | null;
  count: number;
};

export type ViewerTotalsEntry = {
  viewer_id: string;
  viewer_name?: string | null;
  count: number;
};

export type RoomResultResponse = {
  game_over: true;
  room_id: string;
  ended_at: string;
  top_by_event: Record<ButtonName, ResultTopEntry>;
  top_overall: ResultTopEntry | null;
  event_totals: Record<ButtonName, number>;
  viewer_totals: ViewerTotalsEntry[];
  viewer_summary?: ViewerSummaryPayload | null;
};

export async function fetchViewerIdentity(baseUrl: string): Promise<ViewerIdentity | null> {
  try {
    const res = await fetch(`${baseUrl}/get_viewer_id`, { method: "GET", credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null) as { viewer_id?: string; name?: string } | null;
    if (!data?.viewer_id) return null;
    return { viewerId: data.viewer_id, name: data.name ?? null };
  } catch {
    return null;
  }
}

export async function sendButtonEvents(params: {
  baseUrl: string;
  roomId: string; // 通常は streamer_id を使用
  viewerId: string;
  pushEvents: PushEventPayload[];
}): Promise<SendButtonEventsResponse | null> {
  const { baseUrl, roomId, viewerId, pushEvents } = params;
  const url = `${baseUrl}/api/rooms/${encodeURIComponent(roomId)}/events`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        viewer_id: viewerId,
        push_events: pushEvents,
      }),
    });
    if (!res.ok) {
      return null;
    }
    return res.json().catch(() => null) as Promise<SendButtonEventsResponse | null>;
  } catch {
    return null;
  }
}

export async function fetchRoomResult(params: {
  baseUrl: string;
  roomId: string;
  viewerId?: string | null;
}): Promise<RoomResultResponse | null> {
  const { baseUrl, roomId, viewerId } = params;
  const search = viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : "";
  try {
    const res = await fetch(`${baseUrl}/api/rooms/${encodeURIComponent(roomId)}/results${search}`);
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export async function updateViewerName(params: {
  baseUrl: string;
  viewerId: string;
  name: string;
}): Promise<{ viewer_id: string; name: string | null } | null> {
  const { baseUrl, viewerId, name } = params;
  try {
    const res = await fetch(`${baseUrl}/api/viewers/set_name`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewer_id: viewerId, name }),
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}
