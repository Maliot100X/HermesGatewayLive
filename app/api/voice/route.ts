import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id = "CwhRBWXzGAHq8TQ4Fs17", model_id = "eleven_turbo_v2_5", apiKey } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    // Use provided API key from client (localStorage) or fall back to env var
    const ELEVENLABS_API_KEY = apiKey || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ 
        error: "ElevenLabs API key not configured. Please add your API key in Settings > Environment Variables > Voice" 
      }, { status: 500 });
    }

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: text,
        model_id: model_id,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: `ElevenLabs API error: ${JSON.stringify(error)}` }, { status: response.status });
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Return as base64
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    
    return NextResponse.json({
      audio: base64Audio,
      format: "mp3",
      voice_id: voice_id,
    });

  } catch (error) {
    console.error("Voice API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// List available voices
export async function GET(req: NextRequest) {
  try {
    // Get API key from query param or env
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("apiKey") || process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: "ElevenLabs API key not configured",
        voices: [
          { voice_id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", category: "premade" }
        ]
      }, { status: 200 });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch voices" }, { status: response.status });
    }

    const data = await response.json();
    
    // Filter to free premade voices
    const freeVoices = data.voices?.filter((v: any) => v.category === "premade") || [];
    
    return NextResponse.json({
      voices: freeVoices.map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
      })),
      default_voice: "CwhRBWXzGAHq8TQ4Fs17", // Roger - Free
    });

  } catch (error) {
    console.error("Voice list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
