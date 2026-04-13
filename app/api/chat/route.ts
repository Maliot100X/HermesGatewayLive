import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "accounts/fireworks/routers/kimi-k2p5-turbo", temperature = 0.7, max_tokens = 2000, apiKey } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    // Use provided API key from client (localStorage) or fall back to env var
    const FIREWORKS_API_KEY = apiKey || process.env.FIREWORKS_API_KEY;
    
    if (!FIREWORKS_API_KEY) {
      return NextResponse.json({ error: "Fireworks API key not configured. Please add your API key in Settings > Environment Variables > AI" }, { status: 500 });
    }

    // Call Fireworks AI
    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIREWORKS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Fireworks API error: ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Chat API ready",
    model: "accounts/fireworks/routers/kimi-k2p5-turbo",
    provider: "Fireworks AI"
  });
}
