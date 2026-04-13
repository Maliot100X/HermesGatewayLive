import { NextResponse } from "next/server";

const DATA_BRIDGE_URL = "http://192.155.85.109:3002";

export async function GET() {
  try {
    const response = await fetch(`${DATA_BRIDGE_URL}/real-files`, {
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
    console.error("Real files error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
