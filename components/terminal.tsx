"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TerminalIcon } from "lucide-react";

interface TerminalProps {
  onCommand?: (command: string) => void;
  className?: string;
}

// Dynamic import for xterm to avoid SSR issues
const TerminalComponent = ({ onCommand, className = "" }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const xtermRef = useRef<any>(null);

  useEffect(() => {
    if (!terminalRef.current || typeof window === "undefined") return;

    let term: any;
    let fitAddon: any;

    const initTerminal = async () => {
      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");
      const { WebLinksAddon } = await import("xterm-addon-web-links");

      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        theme: {
          background: "#0f172a",
          foreground: "#e2e8f0",
          cursor: "#22c55e",
          selectionBackground: "#334155",
          black: "#0f172a",
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
          magenta: "#a855f7",
          cyan: "#06b6d4",
          white: "#f8fafc",
          brightBlack: "#334155",
          brightRed: "#f87171",
          brightGreen: "#4ade80",
          brightYellow: "#facc15",
          brightBlue: "#60a5fa",
          brightMagenta: "#c084fc",
          brightCyan: "#22d3ee",
          brightWhite: "#ffffff",
        },
        scrollback: 10000,
        rows: 30,
        cols: 100,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(terminalRef.current);
      fitAddon.fit();

      // Welcome message
      term.writeln("\r\n\x1b[32m╔══════════════════════════════════════════════════════════════╗\x1b[0m");
      term.writeln("\x1b[32m║                                                              ║\x1b[0m");
      term.writeln("\x1b[32m║     🔥 LIVE TERMINAL DASHBOARD - AI POWERED 🔥              ║\x1b[0m");
      term.writeln("\x1b[32m║                                                              ║\x1b[0m");
      term.writeln("\x1b[32m║     Type commands to control your Ubuntu server             ║\x1b[0m");
      term.writeln("\x1b[32m║     Ask the AI assistant for help anytime                   ║\x1b[0m");
      term.writeln("\x1b[32m║     Voice control available - click mic icon               ║\x1b[0m");
      term.writeln("\x1b[32m║                                                              ║\x1b[0m");
      term.writeln("\x1b[32m╚══════════════════════════════════════════════════════════════╝\x1b[0m\r\n");

      // Simulated prompt
      let currentLine = "";
      term.write("\x1b[36mubuntu@live-terminal\x1b[0m:\x1b[34m~/workspace\x1b[0m$ ");

      term.onData((data: string) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter key
          if (currentLine.trim()) {
            onCommand?.(currentLine.trim());
            handleCommand(currentLine.trim(), term);
          }
          currentLine = "";
          term.write("\r\n\x1b[36mubuntu@live-terminal\x1b[0m:\x1b[34m~/workspace\x1b[0m$ ");
        } else if (code === 127) {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write("\b \b");
          }
        } else if (code >= 32 && code <= 126) {
          // Printable characters
          currentLine += data;
          term.write(data);
        }
      });

      xtermRef.current = term;
      setIsReady(true);

      const handleResize = () => {
        fitAddon?.fit();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        term.dispose();
      };
    };

    initTerminal();
  }, [onCommand]);

  const handleCommand = (command: string, term: any) => {
    setActiveProcess(command);

    // Simulate command execution
    setTimeout(() => {
      switch (command.toLowerCase()) {
        case "help":
        case "?":
          term.writeln("\r\n\x1b[33mAvailable Commands:\x1b[0m");
          term.writeln("  \x1b[32mls\x1b[0m      - List files");
          term.writeln("  \x1b[32mpwd\x1b[0m     - Print working directory");
          term.writeln("  \x1b[32mwhoami\x1b[0m  - Current user");
          term.writeln("  \x1b[32mdate\x1b[0m    - Current date/time");
          term.writeln("  \x1b[32mstatus\x1b[0m  - System status");
          term.writeln("  \x1b[32mai\x1b[0m      - Ask AI assistant");
          term.writeln("  \x1b[32mclear\x1b[0m   - Clear terminal");
          term.writeln("  \x1b[32mhelp\x1b[0m    - Show this help\r\n");
          break;
        case "ls":
          term.writeln("\r\n\x1b[34mdashboard/\x1b[0m  \x1b[34mcomponents/\x1b[0m  \x1b[34mapi/\x1b[0m  \x1b[32mREADME.md\x1b[0m  \x1b[32m.env\x1b[0m\r\n");
          break;
        case "pwd":
          term.writeln("\r\n/home/ubuntu/workspace\r\n");
          break;
        case "whoami":
          term.writeln("\r\nubuntu\r\n");
          break;
        case "date":
          term.writeln(`\r\n${new Date().toString()}\r\n`);
          break;
        case "status":
          term.writeln("\r\n\x1b[32m✓\x1b[0m Server: Online");
          term.writeln("\x1b[32m✓\x1b[0m AI Assistant: Active");
          term.writeln("\x1b[32m✓\x1b[0m WebSocket: Connected");
          term.writeln("\x1b[32m✓\x1b[0m Voice Control: Ready\r\n");
          break;
        case "clear":
          term.clear();
          break;
        case "ai":
          term.writeln("\r\n\x1b[36m[AI Assistant]\x1b[0m I'm ready! Type your question after 'ai'");
          term.writeln("Example: ai how do I deploy to vercel\r\n");
          break;
        default:
          if (command.startsWith("ai ")) {
            const question = command.slice(3);
            term.writeln(`\r\n\x1b[36m[You]\x1b[0m ${question}`);
            term.writeln("\x1b[36m[AI]\x1b[0m Processing your request... (connect to real API for full functionality)\r\n");
          } else {
            term.writeln(`\r\n\x1b[31mCommand not found: ${command}\x1b[0m`);
            term.writeln("Type 'help' for available commands\r\n");
          }
      }
      setActiveProcess(null);
    }, 500);
  };

  return (
    <Card className={`bg-slate-900/50 border-slate-800 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-200">Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          {activeProcess && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              {activeProcess}
            </Badge>
          )}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 status-online" />
          </div>
        </div>
      </div>
      <div
        ref={terminalRef}
        className="h-[400px] w-full terminal-glow"
        style={{ background: "#0f172a" }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Initializing terminal...
          </div>
        </div>
      )}
    </Card>
  );
};

export const Terminal = dynamic(() => Promise.resolve(TerminalComponent), {
  ssr: false,
});
