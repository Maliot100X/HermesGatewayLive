import { NextResponse } from "next/server";

const DATA_BRIDGE_URL = "http://192.155.85.109:3002";

export async function GET() {
  try {
    const response = await fetch(`${DATA_BRIDGE_URL}/real-stats`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error(`Data bridge returned ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Real stats error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch real stats",
        cpu: "0",
        memory: { percent: 0, used: 0, total: 0, free: 0 },
        disk: { percent: "0%", used: "0G", total: "0G" },
        uptime: "unknown",
        loadAvg: { one: "0", five: "0", fifteen: "0" }
      },
      { status: 500 }
    );
  }
}
