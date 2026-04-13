import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      web: "ok",
      chat: process.env.FIREWORKS_API_KEY ? "configured" : "missing_key",
      voice: process.env.ELEVENLABS_API_KEY ? "configured" : "missing_key",
    },
    env: {
      fireworks_configured: !!process.env.FIREWORKS_API_KEY,
      elevenlabs_configured: !!process.env.ELEVENLABS_API_KEY,
      github_configured: !!process.env.GITHUB_TOKEN,
    }
  });
}
