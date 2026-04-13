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

  const handleCommand = async (command: string, term: any) => {
    setActiveProcess(command);

    // Built-in commands
    const lowerCmd = command.toLowerCase();
    if (lowerCmd === "help" || lowerCmd === "?") {
      term.writeln("\r\n\x1b[33mAvailable Commands:\x1b[0m");
      term.writeln("  \x1b[32mls, pwd, whoami, date\x1b[0m  - System info");
      term.writeln("  \x1b[32mstatus\x1b[0m                 - Check services");
      term.writeln("  \x1b[32mclear\x1b[0m                  - Clear terminal");
      term.writeln("  \x1b[32mhelp\x1b[0m                   - Show this help");
      term.writeln("\r\n\x1b[36m[API Connected]\x1b[0m Real commands execute via /api/terminal\r\n");
      setActiveProcess(null);
      return;
    }

    if (lowerCmd === "clear") {
      term.clear();
      setActiveProcess(null);
      return;
    }

    // Call REAL terminal API
    try {
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (data.error && data.errorMessage) {
        term.writeln(`\r\n\x1b[31mError: ${data.errorMessage}\x1b[0m\r\n`);
      } else {
        const output = data.output || "Command executed (no output)";
        term.writeln(`\r\n${output}\r\n`);
      }
    } catch (error) {
      term.writeln(`\r\n\x1b[31mFailed to execute: ${error instanceof Error ? error.message : "Unknown error"}\x1b[0m\r\n`);
    }

    setActiveProcess(null);
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
