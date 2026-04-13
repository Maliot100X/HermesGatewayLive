"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Terminal, 
  FileText, 
  GitBranch, 
  Rocket, 
  CheckCircle, 
  XCircle,
  Loader2,
  Cpu,
  Folder,
  Play
} from "lucide-react";

interface CommandResult {
  id: string;
  command: string;
  type: "terminal" | "file" | "git" | "deploy" | "ai";
  status: "pending" | "running" | "success" | "error";
  output?: string;
  timestamp: Date;
}

export function VoiceExecutor() {
  const [commands, setCommands] = useState<CommandResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Execute voice command
  const executeCommand = useCallback(async (voiceInput: string) => {
    const id = Date.now().toString();
    const command: CommandResult = {
      id,
      command: voiceInput,
      type: "ai",
      status: "pending",
      timestamp: new Date()
    };
    
    setCommands(prev => [command, ...prev]);
    setIsExecuting(true);

    // Parse intent from voice input
    const intent = parseIntent(voiceInput);
    
    try {
      let result: any = null;
      
      switch (intent.type) {
        case "terminal":
          result = await executeTerminalCommand(intent.data);
          break;
        case "file_create":
          result = await createFile(intent.data);
          break;
        case "file_read":
          result = await readFile(intent.data);
          break;
        case "git":
          result = await executeGitCommand(intent.data);
          break;
        case "deploy":
          result = await deployToVercel();
          break;
        case "status":
          result = await getSystemStatus();
          break;
        case "ai":
        default:
          result = await askAI(voiceInput);
          break;
      }
      
      updateCommand(id, {
        status: result.success ? "success" : "error",
        output: result.output,
        type: intent.type === "ai" ? "ai" : intent.type
      });
      
    } catch (error) {
      updateCommand(id, {
        status: "error",
        output: String(error)
      });
    } finally {
      setIsExecuting(false);
    }
  }, []);

  // Parse voice intent
  const parseIntent = (input: string): { type: string; data: string } => {
    const lower = input.toLowerCase();
    
    // Terminal commands
    if (lower.match(/(run|execute|do)\s+(command|ls|pwd|whoami|ps|top|htop|df|du)/)) {
      const match = lower.match(/(?:run|execute|do)\s+(.*)/);
      return { type: "terminal", data: match?.[1] || lower };
    }
    
    // File creation
    if (lower.match(/(create|make|write)\s+(file|a file|new file)/)) {
      const match = lower.match(/(?:create|make|write)\s+(?:a\s+)?(?:file\s+)?(?:called\s+|named\s+)?["']?(\w+\.?\w*)["']?/);
      return { type: "file_create", data: match?.[1] || "new-file.txt" };
    }
    
    // File reading
    if (lower.match(/(read|show|display|cat)\s+(file|the file|me)/)) {
      const match = lower.match(/(?:read|show|display|cat)\s+(?:the\s+)?(?:file\s+)?["']?(\w+\.?\w*)["']?/);
      return { type: "file_read", data: match?.[1] || "" };
    }
    
    // Git commands
    if (lower.match(/(git|commit|push|pull|status|add)/)) {
      return { type: "git", data: lower };
    }
    
    // Deploy
    if (lower.match(/(deploy|publish|push to vercel|ship)/)) {
      return { type: "deploy", data: "vercel" };
    }
    
    // Status check
    if (lower.match(/(status|check|what is|how is|show me)/) && lower.match(/(system|server|cpu|memory|disk|process)/)) {
      return { type: "status", data: "system" };
    }
    
    // Default to AI
    return { type: "ai", data: input };
  };

  // Execute terminal command via API
  const executeTerminalCommand = async (command: string) => {
    const response = await fetch("/api/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command })
    });
    
    const data = await response.json();
    return {
      success: !data.error,
      output: data.output || data.errorMessage || "Command executed"
    };
  };

  // Create file via API
  const createFile = async (filename: string) => {
    const content = `// Created via voice command at ${new Date().toISOString()}`;
    const command = `echo "${content}" > ${filename}`;
    return executeTerminalCommand(command);
  };

  // Read file via API
  const readFile = async (filename: string) => {
    const command = `cat ${filename} 2>/dev/null || echo "File not found"`;
    return executeTerminalCommand(command);
  };

  // Execute git command
  const executeGitCommand = async (command: string) => {
    let gitCmd = command;
    
    if (command.includes("status")) gitCmd = "git status";
    else if (command.includes("commit")) gitCmd = "git add -A && git commit -m 'Voice command commit'";
    else if (command.includes("push")) gitCmd = "git push";
    else if (command.includes("pull")) gitCmd = "git pull";
    else if (command.includes("log")) gitCmd = "git log --oneline -5";
    
    return executeTerminalCommand(gitCmd);
  };

  // Deploy to Vercel
  const deployToVercel = async () => {
    const command = "vercel --prod --yes";
    return executeTerminalCommand(command);
  };

  // Get system status
  const getSystemStatus = async () => {
    const response = await fetch("/api/system");
    const data = await response.json();
    
    const output = `
🖥️ System Status:
CPU: ${data.cpu}%
Memory: ${data.memory.percent}% (${data.memory.used}/${data.memory.total} MB)
Disk: ${data.disk.percent} used
Uptime: ${data.uptime}
Processes: ${data.connections} connections
    `.trim();
    
    return { success: true, output };
  };

  // Ask AI
  const askAI = async (question: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are King Hermes. Answer voice commands briefly with fire emojis." },
          { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No response";
    
    return { success: true, output: answer };
  };

  // Update command status
  const updateCommand = (id: string, updates: Partial<CommandResult>) => {
    setCommands(prev => prev.map(cmd => 
      cmd.id === id ? { ...cmd, ...updates } : cmd
    ));
  };

  // Get icon for command type
  const getIcon = (type: string, status: string) => {
    const className = status === "error" ? "text-red-400" : 
                     status === "success" ? "text-emerald-400" : 
                     status === "running" ? "text-amber-400" : "text-slate-400";
    
    switch (type) {
      case "terminal": return <Terminal className={`w-4 h-4 ${className}`} />;
      case "file_create": 
      case "file_read": return <FileText className={`w-4 h-4 ${className}`} />;
      case "git": return <GitBranch className={`w-4 h-4 ${className}`} />;
      case "deploy": return <Rocket className={`w-4 h-4 ${className}`} />;
      case "status": return <Cpu className={`w-4 h-4 ${className}`} />;
      default: return <Play className={`w-4 h-4 ${className}`} />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "error": return <XCircle className="w-4 h-4 text-red-400" />;
      case "running": return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
      default: return null;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Voice Command Executor</span>
        </div>
        {isExecuting && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Executing...
          </Badge>
        )}
      </div>

      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-3">
          {commands.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Voice commands will appear here</p>
              <p className="text-xs mt-1">Try: "Run ls -la" or "Show me status"</p>
            </div>
          ) : (
            commands.map((cmd) => (
              <div 
                key={cmd.id} 
                className={`p-3 rounded-lg border ${
                  cmd.status === "error" ? "bg-red-500/10 border-red-500/20" :
                  cmd.status === "success" ? "bg-emerald-500/10 border-emerald-500/20" :
                  "bg-slate-800/50 border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(cmd.type, cmd.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-300 font-medium truncate">{cmd.command}</p>
                      {getStatusIcon(cmd.status)}
                    </div>
                    {cmd.output && (
                      <pre className="mt-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {cmd.output}
                      </pre>
                    )}
                    <p className="text-[10px] text-slate-600 mt-1">
                      {cmd.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Quick command examples */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <p className="text-xs text-slate-500 mb-2">Try saying:</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            "Run ls -la"
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            "Check system status"
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            "Deploy to Vercel"
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            "Git status"
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            "Create file test.txt"
          </Badge>
        </div>
      </div>
    </Card>
  );
}

export { executeVoiceCommand };

// Standalone function for external use
export async function executeVoiceCommand(input: string): Promise<{ success: boolean; output: string; type: string }> {
  const lower = input.toLowerCase();
  
  // Terminal
  if (lower.match(/(run|execute)\s+/)) {
    const cmd = lower.replace(/(run|execute)\s+/, "");
    const res = await fetch("/api/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd })
    });
    const data = await res.json();
    return { success: !data.error, output: data.output || data.errorMessage || "Done", type: "terminal" };
  }
  
  // Status
  if (lower.match(/(status|check system)/)) {
    const res = await fetch("/api/system");
    const data = await res.json();
    return { 
      success: true, 
      output: `CPU: ${data.cpu}%, Memory: ${data.memory.percent}%`,
      type: "status"
    };
  }
  
  // Deploy
  if (lower.match(/deploy/)) {
    return { success: true, output: "Starting deployment...", type: "deploy" };
  }
  
  // Default AI
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: input }],
      max_tokens: 150
    })
  });
  const data = await res.json();
  return { 
    success: true, 
    output: data.choices?.[0]?.message?.content || "No response",
    type: "ai"
  };
}
