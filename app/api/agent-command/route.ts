import { NextRequest, NextResponse } from "next/server";

// Fireworks AI Configuration
const FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1";
const FIREWORKS_MODEL = "accounts/fireworks/routers/kimi-k2p5-turbo";

// Command patterns with actions
const COMMAND_PATTERNS = {
  system_status: /(check\s+system|system\s+status|server\s+status|how.*system)/i,
  list_files: /(list\s+files?|show\s+files?|ls|dir)/i,
  time: /(what.*time|current\s+time|clock)/i,
  date: /(what.*date|today.*date)/i,
  weather: /(weather|temperature|forecast)/i,
  open_dashboard: /(open\s+dashboard|launch\s+dashboard|show\s+dashboard)/i,
  git_status: /(git\s+status|repo\s+status|repository\s+status)/i,
  build: /(run\s+build|build\s+project|npm\s+run\s+build)/i,
  deploy: /(deploy|push\s+to\s+production|vercel\s+deploy)/i,
  clear: /(clear|clean|cls)/i,
  help: /(help|what\s+can\s+you\s+do|capabilities)/i,
  memory: /(show\s+memories|what\s+do\s+you\s+remember|recall)/i,
};

// Get current time
function getCurrentTime(): string {
  return new Date().toLocaleTimeString();
}

// Get current date
function getCurrentDate(): string {
  return new Date().toLocaleDateString();
}

// Call Fireworks AI with full context
async function callFireworksAI(
  prompt: string, 
  apiKey: string, 
  context?: string,
  systemStats?: string,
  location?: string
): Promise<{ text: string; tools?: string[] }> {
  if (!apiKey) {
    return { text: "Error: No Fireworks API key configured" };
  }

  const systemPrompt = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), an AI assistant integrated into the Hermes Terminal Dashboard.

CURRENT CONTEXT:
${systemStats || "System stats unavailable"}
Location: ${location || "Unknown"}
Time: ${getCurrentTime()}
Date: ${getCurrentDate()}

PREVIOUS CONVERSATION:
${context || "No previous context"}

PERSONALITY:
- Professional, efficient, and helpful
- Address the user as "Master" when appropriate
- Be concise (1-3 sentences max)
- Use technical terminology when relevant
- Show personality but stay professional

CAPABILITIES:
- Monitor system status (CPU, memory, uptime)
- List files and directories
- Check git repository status
- Run builds and deployments
- Answer questions about the system
- Remember previous conversations

Respond naturally to the user's command. If you can't perform an action, explain why and offer alternatives.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${FIREWORKS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: FIREWORKS_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      return { text: `Error: ${response.status} - ${error}` };
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "No response";
    
    // Clean up any reasoning text
    const lines = text.split('\n').filter(l => l.trim());
    const cleanLines = lines.filter(l => 
      !l.startsWith('The user') && 
      !l.startsWith('I need') &&
      !l.startsWith('Let me') &&
      !l.startsWith('I should') &&
      !l.includes('Context:') &&
      !l.includes('System:')
    );
    
    text = cleanLines.join('\n').trim() || text;
    
    return { text };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { text: "Request timed out. Please try again." };
    }
    return { text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

// Synthesize voice with ElevenLabs
async function synthesizeVoice(text: string, apiKey: string, voiceId: string): Promise<string | null> {
  if (!apiKey || !voiceId) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 400),
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    return null;
  }
}

// Process specific commands
async function processDirectCommand(command: string): Promise<{ response: string; executed: boolean; tools?: string[] } | null> {
  const lowerCmd = command.toLowerCase();
  
  // Check each pattern
  for (const [action, pattern] of Object.entries(COMMAND_PATTERNS)) {
    if (pattern.test(lowerCmd)) {
      switch (action) {
        case 'system_status':
          return {
            response: "Checking system status on Ubuntu server 192.155.85.109...",
            executed: true,
            tools: ['getSystemStats']
          };
        case 'list_files':
          return {
            response: "Listing files in the current workspace directory...",
            executed: true,
            tools: ['listFiles']
          };
        case 'time':
          return {
            response: `The current time is ${getCurrentTime()}.`,
            executed: true,
            tools: ['getTime']
          };
        case 'date':
          return {
            response: `Today is ${getCurrentDate()}.`,
            executed: true,
            tools: ['getDate']
          };
        case 'weather':
          return {
            response: "I can check weather information for your location. Let me fetch that...",
            executed: true,
            tools: ['getWeather']
          };
        case 'open_dashboard':
          return {
            response: "The dashboard is already open, Master. I'm ready to assist.",
            executed: true,
            tools: ['activateDashboard']
          };
        case 'git_status':
          return {
            response: "Checking git repository status...",
            executed: true,
            tools: ['gitStatus']
          };
        case 'build':
          return {
            response: "Initiating build process...",
            executed: true,
            tools: ['runBuild']
          };
        case 'deploy':
          return {
            response: "Deploying to production via Vercel...",
            executed: true,
            tools: ['deployToVercel']
          };
        case 'clear':
          return {
            response: "Clearing terminal and conversation...",
            executed: true,
            tools: ['clearScreen']
          };
        case 'help':
          return {
            response: "I can help you with: system monitoring, file management, git operations, builds, deployments, and general questions. Just say 'Jarvis' followed by your request.",
            executed: true,
            tools: ['showHelp']
          };
        case 'memory':
          return {
            response: "Showing your conversation memories...",
            executed: true,
            tools: ['showMemories']
          };
      }
    }
  }
  
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { command, source, context, systemStats, location } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "No command provided" }, { status: 400 });
    }

    console.log(`[J.A.R.V.I.S.] ${source || 'voice'}: "${command}"`);

    // Get API keys
    const fireworksKey = request.headers.get("x-fireworks-api-key") || process.env.FIREWORKS_API_KEY || "";
    const elevenlabsKey = request.headers.get("x-elevenlabs-api-key") || process.env.ELEVENLABS_API_KEY || "";
    const voiceId = request.headers.get("x-elevenlabs-voice-id") || process.env.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17";

    // Try to process as direct command first
    const directResult = await processDirectCommand(command);
    
    let finalResponse: string;
    let executed = false;
    let tools: string[] = [];

    if (directResult) {
      // Use direct command response
      finalResponse = directResult.response;
      executed = directResult.executed;
      tools = directResult.tools || [];
    } else {
      // Use AI for interpretation
      const aiResult = await callFireworksAI(command, fireworksKey, context, systemStats, location);
      finalResponse = aiResult.text;
      tools = aiResult.tools || [];
      
      // Check if AI response indicates an action was taken
      executed = finalResponse.toLowerCase().includes("executed") || 
                 finalResponse.toLowerCase().includes("completed") ||
                 finalResponse.toLowerCase().includes("done");
    }

    // Generate voice
    let voiceUrl: string | undefined;
    if (elevenlabsKey) {
      voiceUrl = await synthesizeVoice(finalResponse.slice(0, 350), elevenlabsKey, voiceId) || undefined;
    }

    return NextResponse.json({
      response: finalResponse,
      executed,
      toolsUsed: tools,
      voiceUrl,
      timestamp: new Date().toISOString(),
      debug: {
        hasFireworksKey: !!fireworksKey,
        hasElevenLabsKey: !!elevenlabsKey,
        commandType: directResult ? 'direct' : 'ai',
      }
    });

  } catch (error) {
    console.error("Agent command error:", error);
    return NextResponse.json({
      response: "J.A.R.V.I.S. encountered an error. Please check your API configuration.",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
