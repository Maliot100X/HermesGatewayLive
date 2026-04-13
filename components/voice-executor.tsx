"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface CommandResult {
  id: string;
  command: string;
  status: "running" | "success" | "error";
  output?: string;
}

export function VoiceExecutor() {
  const [commands, setCommands] = useState<CommandResult[]>([]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Voice Commands</span>
        </div>
      </div>

      <div className="p-4">
        {commands.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <p className="text-sm">Voice commands appear here</p>
            <p className="text-xs mt-1">Try: "Check status" or "Run ls -la"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commands.map((cmd) => (
              <div 
                key={cmd.id} 
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-700"
              >
                <div className="flex items-center gap-2">
                  {cmd.status === "running" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                  {cmd.status === "success" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {cmd.status === "error" && <XCircle className="w-4 h-4 text-red-400" />}
                  <span className="text-sm text-slate-300">{cmd.command}</span>
                </div>
                {cmd.output && (
                  <pre className="mt-2 text-xs text-slate-400 bg-slate-900 p-2 rounded">
                    {cmd.output}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">Supported commands:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-400 border-slate-600">
              "Check status"
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-400 border-slate-600">
              "Run ls -la"
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-400 border-slate-600">
              "Deploy"
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-400 border-slate-600">
              "Ask AI..."
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Export function for voice-tab to use
export async function executeVoiceCommand(input: string): Promise<{ success: boolean; output: string }> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: input }],
        max_tokens: 150
      })
    });
    
    const data = await response.json();
    return { 
      success: true, 
      output: data.choices?.[0]?.message?.content || "No response"
    };
  } catch (e) {
    return { success: false, output: "Error processing command" };
  }
}
