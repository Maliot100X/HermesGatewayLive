import { NextRequest, NextResponse } from "next/server";

// Call Fireworks AI for command interpretation
async function callFireworksAI(prompt: string, apiKey: string): Promise<{ text: string; error?: string }> {
  if (!apiKey) {
    return { text: "", error: "No Fireworks API key provided" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "accounts/fireworks/routers/kimi-k2p5-turbo",
        messages: [
          {
            role: "system",
            content: `You are J.A.R.V.I.S., an AI assistant for the Hermes Terminal Dashboard.
            You help control a Linux Ubuntu server through voice commands.
            
            RULES:
            1. Respond with ONLY the final answer - no reasoning, no thinking, no planning
            2. Maximum 2 sentences
            3. Be professional and efficient
            4. If greeting: greet back and offer help
            5. If command: confirm what you're doing
            
            Example good response: "Hello. How may I assist you with the server today?"
            Example bad response: "The user wants me to... [thinking process]... Hello."
            
            ONLY output the final response. NOTHING ELSE.`
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return { text: "", error: `Fireworks API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const message = data.choices && data.choices[0] && data.choices[0].message;
    let text = (message && message.content) || "No response";
    
    // Clean up the response - Kimi model sometimes outputs reasoning
    // Extract just the final response line
    const lines = text.split('\n');
    // Find the last non-empty line that's not a header
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line && !line.startsWith('Example') && !line.startsWith('Rules') && 
          !line.startsWith('1.') && !line.startsWith('2.') && !line.startsWith('3.') &&
          !line.startsWith('4.') && !line.startsWith('5.') && !line.startsWith('-') &&
          !line.startsWith('The user') && !line.startsWith('I need') &&
          !line.startsWith('Constraints') && !line.startsWith('Possible') && !line.startsWith('Output:')) {
        text = line;
        break;
      }
    }
    
    return { text };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { text: "", error: "Request timeout - Fireworks API took too long" };
    }
    return { text: "", error: `Fetch error: ${error instanceof Error ? error.message : "Unknown"}` };
  }
}

// Call ElevenLabs for voice synthesis
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
        text: text.slice(0, 500),
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("ElevenLabs error:", response.status);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    return `data:audio/mpeg;base64,${base64Audio}`;
  } catch (error) {
    console.error("Voice synthesis error:", error);
    return null;
  }
}

// Execute terminal command via local data bridge
async function executeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    // Try to use the data bridge on the Ubuntu server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("http://192.155.85.109:3002/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, timeout: 10000 }),
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data = await response.json();
      return {
        success: !data.error,
        output: data.output || "",
        error: data.error,
      };
    }

    // Fallback: return simulated execution info
    return {
      success: true,
      output: `Command "${command}" would execute on Ubuntu server 192.155.85.109`,
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Execution failed",
    };
  }
}

// Command patterns for direct execution
const COMMAND_PATTERNS: Record<string, RegExp> = {
  list_files: /^(list|show|ls|dir)(\s+files?)?/i,
  git_status: /^(git\s+status|check\s+git)/i,
  git_commit: /^(git\s+commit|commit)/i,
  git_push: /^(git\s+push|push)/i,
  build: /^(build|npm\s+run\s+build)/i,
  deploy: /^(deploy|vercel\s+deploy)/i,
  check_status: /^(check\s+status|status)/i,
  clear: /^(clear|cls)/i,
  install: /^(install|npm\s+install)/i,
  test: /^(test|npm\s+test)/i,
};

function parseCommand(command: string): { action: string; execute: boolean } {
  const lowerCmd = command.toLowerCase().trim();
  
  for (const [action, pattern] of Object.entries(COMMAND_PATTERNS)) {
    if (pattern.test(lowerCmd)) {
      return { action, execute: true };
    }
  }
  
  // Conversational queries
  if (/^(what|how|why|when|who|where|tell|explain|describe)/i.test(lowerCmd)) {
    return { action: "chat", execute: false };
  }
  
  return { action: "ai_process", execute: true };
}

// Get context-aware response based on action
function getCommandResponse(action: string, command: string): { response: string; shouldExecute: boolean } {
  switch (action) {
    case "list_files":
      return { response: "Executing: list files in current directory", shouldExecute: true };
    case "git_status":
      return { response: "Checking git repository status", shouldExecute: true };
    case "git_commit":
      return { response: "Committing changes to git", shouldExecute: true };
    case "git_push":
      return { response: "Pushing changes to remote repository", shouldExecute: true };
    case "build":
      return { response: "Building the project with npm run build", shouldExecute: true };
    case "deploy":
      return { response: "Deploying to production via Vercel", shouldExecute: true };
    case "check_status":
      return { response: "Checking system status on Ubuntu server", shouldExecute: true };
    case "clear":
      return { response: "Clearing terminal", shouldExecute: true };
    case "install":
      return { response: "Installing dependencies", shouldExecute: true };
    case "test":
      return { response: "Running tests", shouldExecute: true };
    case "chat":
      return { response: "", shouldExecute: false };
    default:
      return { response: `Processing command: ${command}`, shouldExecute: true };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { command, source } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "No command provided" }, { status: 400 });
    }

    console.log(`[J.A.R.V.I.S.] ${source || 'voice'}: "${command}"`);

    // Get API keys from headers (client-side) or env
    const fireworksKey = request.headers.get("x-fireworks-api-key") || process.env.FIREWORKS_API_KEY || "";
    const elevenlabsKey = request.headers.get("x-elevenlabs-api-key") || process.env.ELEVENLABS_API_KEY || "";
    const voiceId = request.headers.get("x-elevenlabs-voice-id") || process.env.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17";

    // Parse the command
    const { action, execute } = parseCommand(command);
    const { response: baseResponse, shouldExecute } = getCommandResponse(action, command);

    let finalResponse = baseResponse;
    let executionResult = { success: false, output: "", error: "" };
    let aiError = "";

    // Call AI for conversational queries or to enhance response
    if (action === "chat" || action === "ai_process" || !baseResponse) {
      const aiResult = await callFireworksAI(
        action === "chat" ? command : `Voice command: "${command}". Respond helpfully.`,
        fireworksKey
      );
      
      if (aiResult.error) {
        aiError = aiResult.error;
        finalResponse = `J.A.R.V.I.S. online. ${aiResult.error}`;
      } else {
        finalResponse = aiResult.text;
      }
    }

    // Execute if needed
    if (shouldExecute && execute) {
      executionResult = await executeCommand(command);
      if (executionResult.output && !finalResponse.includes(executionResult.output)) {
        finalResponse += `\n\nOutput: ${executionResult.output.slice(0, 200)}`;
      }
    }

    // Generate voice
    let voiceUrl: string | undefined;
    if (elevenlabsKey) {
      voiceUrl = await synthesizeVoice(finalResponse.slice(0, 300), elevenlabsKey, voiceId) || undefined;
    }

    return NextResponse.json({
      response: finalResponse,
      action,
      executed: executionResult.success,
      output: executionResult.output,
      error: aiError || executionResult.error || undefined,
      voiceUrl,
      debug: {
        hasFireworksKey: !!fireworksKey,
        hasElevenLabsKey: !!elevenlabsKey,
        voiceId,
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
