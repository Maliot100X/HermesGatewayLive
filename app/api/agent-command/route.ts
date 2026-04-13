import { NextRequest, NextResponse } from "next/server";

// Fireworks AI Configuration
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY || "";
const FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1";
const FIREWORKS_MODEL = "accounts/fireworks/routers/kimi-k2p5-turbo";

// ElevenLabs Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17"; // Roger (FREE)

interface CommandRequest {
  command: string;
  source: string;
  sessionId?: string;
}

interface CommandResponse {
  response: string;
  action?: string;
  executed?: boolean;
  output?: string;
  error?: string;
  voiceUrl?: string;
}

// Command patterns for direct execution
const COMMAND_PATTERNS = {
  list_files: /^(list|show|display|ls|dir)\s+(files?|directory|dir|contents?)/i,
  change_dir: /^(go\s+to|cd|change\s+to|open)\s+(.+)/i,
  git_status: /^(git\s+status|check\s+git|repo\s+status)/i,
  git_commit: /^(git\s+commit|commit\s+changes)/i,
  git_push: /^(git\s+push|push\s+changes)/i,
  build: /^(build|compile|make|npm\s+run\s+build)/i,
  deploy: /^(deploy|push\s+to\s+production|vercel\s+deploy)/i,
  check_status: /^(check\s+status|system\s+status|what's\s+running|status)/i,
  clear: /^(clear|cls|clean\s+screen)/i,
  install: /^(install|npm\s+install|yarn|pnpm\s+install)/i,
  test: /^(test|run\s+tests?|npm\s+test)/i,
};

// Parse and categorize the command
function parseCommand(command: string): { action: string; params: string; execute: boolean } {
  const lowerCmd = command.toLowerCase().trim();
  
  // Check for direct command patterns
  for (const [action, pattern] of Object.entries(COMMAND_PATTERNS)) {
    const match = lowerCmd.match(pattern);
    if (match) {
      return { 
        action, 
        params: match[2] || "",
        execute: true 
      };
    }
  }
  
  // Check for conversational queries (don't execute)
  const conversational = /^(what|how|why|when|who|where|tell\s+me|explain|describe)/i;
  if (conversational.test(lowerCmd)) {
    return { action: "chat", params: command, execute: false };
  }
  
  // Default: try to execute as AI-processed command
  return { action: "ai_process", params: command, execute: true };
}

// Call Fireworks AI for command interpretation
async function callFireworksAI(prompt: string, apiKey: string): Promise<string> {
  const key = apiKey || FIREWORKS_API_KEY;
  if (!key) {
    return "No AI API key configured. Please set FIREWORKS_API_KEY in environment variables.";
  }

  try {
    const response = await fetch(`${FIREWORKS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: FIREWORKS_MODEL,
        messages: [
          {
            role: "system",
            content: `You are J.A.R.V.I.S., an AI assistant for the Hermes Terminal Dashboard. 
            You help control a Linux Ubuntu server (192.155.85.109) through voice commands.
            
            When given a voice command:
            1. Interpret the user's intent
            2. Provide a clear, concise response (max 2 sentences)
            3. If it's a system command, explain what you're doing
            4. Be professional but friendly
            
            Available capabilities:
            - File management (list, create, edit, delete files)
            - Git operations (status, commit, push, pull)
            - System monitoring (CPU, memory, disk, processes)
            - Build/Deploy commands (npm run build, vercel deploy)
            - Terminal command execution
            
            Current server: Ubuntu on 192.155.85.109
            User: King Hermes (Master)`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fireworks API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from AI";
  } catch (error) {
    console.error("Fireworks AI error:", error);
    return `AI Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// Call ElevenLabs for voice synthesis
async function synthesizeVoice(text: string, apiKey: string, voiceId: string): Promise<string | null> {
  const key = apiKey || ELEVENLABS_API_KEY;
  const voice = voiceId || ELEVENLABS_VOICE_ID;
  
  if (!key) {
    console.log("No ElevenLabs API key configured");
    return null;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": key,
      },
      body: JSON.stringify({
        text: text.slice(0, 500), // Limit text length
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    console.error("Voice synthesis error:", error);
    return null;
  }
}

// Execute terminal command
async function executeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const response = await fetch("http://localhost:3000/api/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, timeout: 30000 }),
    });

    if (!response.ok) {
      throw new Error(`Terminal API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: !data.error,
      output: data.output || "",
      error: data.error,
    };
  } catch (error) {
    console.error("Command execution error:", error);
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Failed to execute command",
    };
  }
}

// Process specific command actions
async function processAction(action: string, params: string): Promise<{ success: boolean; output: string; response: string }> {
  let command = "";
  let response = "";

  switch (action) {
    case "list_files":
      command = "ls -la";
      response = "Listing files in current directory";
      break;
    case "change_dir":
      command = `cd ${params} && pwd`;
      response = `Changing to directory: ${params}`;
      break;
    case "git_status":
      command = "git status";
      response = "Checking git repository status";
      break;
    case "git_commit":
      command = "git add -A && git commit -m 'Voice command commit'";
      response = "Committing changes";
      break;
    case "git_push":
      command = "git push";
      response = "Pushing changes to remote";
      break;
    case "build":
      command = "npm run build";
      response = "Building the project";
      break;
    case "deploy":
      command = "vercel --prod --yes";
      response = "Deploying to production";
      break;
    case "check_status":
      command = "ps aux | head -10 && df -h && free -h";
      response = "Checking system status";
      break;
    case "clear":
      command = "clear";
      response = "Terminal cleared";
      break;
    case "install":
      command = "npm install";
      response = "Installing dependencies";
      break;
    case "test":
      command = "npm test";
      response = "Running tests";
      break;
    default:
      // For AI-processed commands, let the AI decide what to do
      return { success: false, output: "", response: "" };
  }

  if (command) {
    const result = await executeCommand(command);
    return {
      success: result.success,
      output: result.output,
      response: result.success ? response : `Error: ${result.error}`,
    };
  }

  return { success: false, output: "", response: "" };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CommandRequest = await request.json();
    const { command, source, sessionId } = body;

    if (!command) {
      return NextResponse.json(
        { error: "No command provided" },
        { status: 400 }
      );
    }

    console.log(`[J.A.R.V.I.S.] ${source}: "${command}"`);

    // Parse the command
    const parsed = parseCommand(command);
    let response: CommandResponse = {
      response: "",
      action: parsed.action,
      executed: false,
    };

    // Check for API keys from request headers (client-side storage)
    const fireworksKey = request.headers.get("x-fireworks-api-key") || "";
    const elevenlabsKey = request.headers.get("x-elevenlabs-api-key") || "";
    const voiceId = request.headers.get("x-elevenlabs-voice-id") || ELEVENLABS_VOICE_ID;

    // Try to execute known actions first
    if (parsed.execute && parsed.action !== "ai_process" && parsed.action !== "chat") {
      const actionResult = await processAction(parsed.action, parsed.params);
      if (actionResult.response) {
        response.response = actionResult.response;
        response.executed = actionResult.success;
        response.output = actionResult.output;
      }
    }

    // For AI-processed or chat commands, call Fireworks AI
    if (parsed.action === "ai_process" || parsed.action === "chat" || !response.response) {
      const aiPrompt = parsed.action === "chat" 
        ? command
        : `User voice command: "${command}". This appears to be a system command. Interpret what they want to do and provide a helpful response.`;
      
      const aiResponse = await callFireworksAI(aiPrompt, fireworksKey);
      response.response = aiResponse;

      // Try to execute if it looks like a terminal command
      if (parsed.action === "ai_process") {
        // Extract potential command from the user's input
        const execResult = await executeCommand(command);
        if (execResult.success) {
          response.executed = true;
          response.output = execResult.output;
        } else {
          // Don't show error for chat commands
          if (parsed.action !== "chat") {
            response.error = execResult.error;
          }
        }
      }
    }

    // Generate voice response if enabled
    if (response.response) {
      const voiceAudio = await synthesizeVoice(response.response, elevenlabsKey, voiceId);
      if (voiceAudio) {
        response.voiceUrl = voiceAudio;
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Agent command error:", error);
    return NextResponse.json(
      {
        response: "An error occurred processing your command. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
