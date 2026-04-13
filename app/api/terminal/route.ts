import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Safe commands that can be executed
const SAFE_COMMANDS = [
  "ls", "pwd", "whoami", "date", "uptime", "uname", "echo",
  "cat", "head", "tail", "grep", "ps", "df", "du", "free",
  "top", "htop", "netstat", "ss", "ifconfig", "ip",
  "ping", "curl", "wget", "npm", "node", "python", "python3"
];

function isSafeCommand(command: string): boolean {
  const cmd = command.trim().split(" ")[0].toLowerCase();
  return SAFE_COMMANDS.includes(cmd) || 
         command.startsWith("cd ") ||
         command.startsWith("mkdir ") ||
         command.startsWith("touch ");
}

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();

    if (!command) {
      return NextResponse.json({ error: "Command required" }, { status: 400 });
    }

    // Security check
    if (!isSafeCommand(command)) {
      return NextResponse.json({ 
        error: "Command not allowed for security reasons",
        output: "",
        command: command
      }, { status: 403 });
    }

    // Execute command with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000,
      maxBuffer: 1024 * 1024, // 1MB
    });

    return NextResponse.json({
      command: command,
      output: stdout || stderr || "Command executed (no output)",
      error: stderr ? true : false,
    });

  } catch (error: any) {
    // Handle timeout or other errors
    if (error.killed) {
      return NextResponse.json({
        command: error.cmd || "unknown",
        output: "",
        error: true,
        errorMessage: "Command timed out (10s limit)",
      });
    }

    return NextResponse.json({
      command: error.cmd || "unknown",
      output: error.stdout || "",
      error: true,
      errorMessage: error.message || "Command failed",
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Terminal API ready",
    safe_commands: SAFE_COMMANDS,
    note: "Commands are executed on server with 10s timeout",
  });
}
