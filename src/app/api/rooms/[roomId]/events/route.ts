import { NextResponse } from "next/server";

// Keep track of count in memory (resets on server restart)
let mockViewerCount = 1000;

export async function POST() {
  // Simulate increasing viewer count
  mockViewerCount = Math.floor(Math.random() * 50) + 10;

  return NextResponse.json({
    event_results: [
      {
        event_type: "enemy1", // Dummy
        current_count: 0,
        required_count: 100,
        effect_triggered: false,
        viewer_count: mockViewerCount,
        next_threshold: 1000,
      },
    ],
    game_over: false,
  });
}
