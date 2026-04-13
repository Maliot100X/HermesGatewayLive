"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Terminal, 
  FileText, 
  GitBranch, 
  Cpu,
  Activity,
  Wifi,
  WifiOff,
  Clock
} from "lucide-react";

interface Command {
  id: string;
  type: 'command';
  command: string;
  timestamp: number;
}

interface Process {
  id: string;
  pid: string;
  user: string;
  cpu: string;
  mem: string;
  cmd: string;
}

interface File {
  id: string;
  name: string;
  path: string;
  size: string;
  mtime: string;
}

export function RealActivityFeed() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchRealActivity = async () => {
      try {
        // Fetch commands
        const cmdResponse = await fetch('/api/real-commands');
        if (cmdResponse.ok) {
          const cmdData = await cmdResponse.json();
          setCommands(cmdData.slice(-20).reverse()); // Last 20, newest first
        }

        // Fetch processes
        const procResponse = await fetch('/api/real-processes');
        if (procResponse.ok) {
          const procData = await procResponse.json();
          setProcesses(procData.slice(0, 10));
        }

        // Fetch files
        const fileResponse = await fetch('/api/real-files');
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          setFiles(fileData.slice(0, 10));
        }

        setIsConnected(true);
        setLastUpdate(new Date());
      } catch (e) {
        console.error("Failed to fetch real activity:", e);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchRealActivity();
    
    // Update every 5 seconds
    const interval = setInterval(fetchRealActivity, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-slate-200">REAL Activity Feed</span>
          <Badge 
            variant="outline" 
            className={`text-[10px] ${isConnected ? "text-emerald-400 border-emerald-500/20" : "text-red-400 border-red-500/20"}`}
          >
            {isConnected ? <><Wifi className="w-3 h-3 mr-1" /> LIVE</> : <><WifiOff className="w-3 h-3 mr-1" /> OFFLINE</>}
          </Badge>
        </div>
        {lastUpdate && (
          <span className="text-[10px] text-slate-500">
            {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Commands Section */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">Recent Commands</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            {commands.length} entries
          </Badge>
        </div>
        <ScrollArea className="h-[180px]">
          <div className="p-2 space-y-1">
            {commands.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                <p className="text-xs">No commands yet</p>
              </div>
            ) : (
              commands.map((cmd) => (
                <div 
                  key={cmd.id}
                  className="flex items-center gap-2 p-2 bg-slate-800/50 rounded text-xs"
                >
                  <Terminal className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <code className="flex-1 text-slate-300 font-mono truncate">{cmd.command}</code>
                  <span className="text-slate-500 flex-shrink-0">{formatTime(cmd.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Processes Section */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-300">Top Processes</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            {processes.length} running
          </Badge>
        </div>
        <ScrollArea className="h-[150px]">
          <div className="p-2">
            <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 uppercase mb-2">
              <span className="col-span-2">PID</span>
              <span className="col-span-1">CPU</span>
              <span className="col-span-6">Command</span>
              <span className="col-span-3 text-right">User</span>
            </div>
            {processes.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                <p className="text-xs">No process data</p>
              </div>
            ) : (
              processes.map((proc) => (
                <div 
                  key={proc.id}
                  className="grid grid-cols-12 gap-2 py-1.5 border-t border-slate-800 text-xs"
                >
                  <span className="col-span-2 text-slate-500 font-mono">{proc.pid}</span>
                  <span className={`col-span-1 ${parseFloat(proc.cpu) > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {proc.cpu}%
                  </span>
                  <span className="col-span-6 text-slate-300 truncate" title={proc.cmd}>
                    {proc.cmd}
                  </span>
                  <span className="col-span-3 text-right text-slate-500">{proc.user}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Files Section */}
      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">Recent Files</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            {files.length} modified
          </Badge>
        </div>
        <ScrollArea className="h-[120px]">
          <div className="p-2 space-y-1">
            {files.length === 0 ? (
              <div className="text-center py-4 text-slate-500">
                <p className="text-xs">No recent files</p>
              </div>
            ) : (
              files.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-300 truncate max-w-[150px]" title={file.path}>
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{file.size}</span>
                    <Clock className="w-3 h-3 text-slate-600" />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Data Source Info */}
      <div className="text-center text-[10px] text-slate-500 pt-2">
        Data from: 192.155.85.109:3002
      </div>
    </div>
  );
}
