"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity,
  Terminal,
  FileText,
  Clock,
  Server
} from "lucide-react";

interface SystemStats {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  uptime: string;
  processes: { pid: number; name: string; cpu: number; memory: number }[];
  files: { path: string; size: string; modified: string }[];
  connections: number;
}

export function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    memory: { used: 0, total: 0, percent: 0 },
    disk: { used: 0, total: 0, percent: 0 },
    uptime: "0d 0h 0m",
    processes: [],
    files: [],
    connections: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchSystemStats();
    
    // Set up interval for real-time updates (every 3 seconds)
    const interval = setInterval(fetchSystemStats, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch("/api/system");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdate(new Date());
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
      setIsConnected(false);
    }
  };

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-200">Live System Monitor</span>
          <Badge 
            variant="outline" 
            className={`text-[10px] ${
              isConnected 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {isConnected ? "● LIVE" : "○ OFFLINE"}
          </Badge>
        </div>
        <div className="text-[10px] text-slate-500">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {/* CPU */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">CPU</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.cpu}%</div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.cpu}%` }}
              />
            </div>
          </div>

          {/* Memory */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <MemoryStick className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Memory</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {stats.memory.percent}%
            </div>
            <div className="text-[10px] text-slate-500">
              {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
              <div 
                className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.memory.percent}%` }}
              />
            </div>
          </div>

          {/* Disk */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Disk</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {stats.disk.percent}%
            </div>
            <div className="text-[10px] text-slate-500">
              {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.disk.percent}%` }}
              />
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Uptime</span>
            </div>
            <div className="text-lg font-bold text-amber-400">{stats.uptime}</div>
            <div className="text-[10px] text-slate-500">
              {stats.connections} connections
            </div>
          </div>
        </div>

        {/* Live Processes */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-slate-300">Active Processes</span>
            <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
              {stats.processes.length} running
            </Badge>
          </div>
          
          <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-slate-800/50 text-[10px] text-slate-500 uppercase">
              <span>PID</span>
              <span>Name</span>
              <span>CPU</span>
              <span>Mem</span>
            </div>
            {stats.processes.slice(0, 10).map((proc) => (
              <div 
                key={proc.pid} 
                className="grid grid-cols-4 gap-2 px-3 py-1.5 text-[11px] border-t border-slate-700/50 hover:bg-slate-800/50"
              >
                <span className="text-slate-400 font-mono">{proc.pid}</span>
                <span className="text-slate-300 truncate">{proc.name}</span>
                <span className={`${proc.cpu > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {proc.cpu.toFixed(1)}%
                </span>
                <span className="text-slate-400">{formatBytes(proc.memory)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-slate-300">Recent Files</span>
          </div>
          
          <div className="space-y-1">
            {stats.files.slice(0, 5).map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between px-3 py-1.5 bg-slate-800/30 rounded text-[11px] border border-slate-700/50"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-300 truncate max-w-[150px]">{file.path}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{file.size}</span>
                  <span className="text-slate-600 text-[10px]">{file.modified}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
