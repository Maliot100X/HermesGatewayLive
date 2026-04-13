"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Terminal, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  Users,
  Clock,
  FileCode,
  GitBranch,
  Zap,
  Server,
  Wifi
} from "lucide-react";

interface SystemData {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  disk: { used: string; total: string; percent: string };
  load: string;
  connections: number;
  timestamp: string;
}

interface ProcessData {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
  rss: string;
}

interface ActivityData {
  processes: ProcessData[];
  files: { name: string; size: string; modified: string; isDirectory: boolean }[];
}

export function LiveActivity() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to real-time stream
    const connect = () => {
      const es = new EventSource("/api/ws?type=all");
      eventSourceRef.current = es;
      
      es.onopen = () => {
        setIsConnected(true);
        console.log("Connected to real-time stream");
      };
      
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.system) {
            setSystemData(data.system);
          }
          if (data.processes) {
            setActivityData(prev => ({
              ...prev,
              processes: data.processes.processes
            }));
          }
          if (data.files) {
            setActivityData(prev => ({
              ...prev,
              files: data.files.files
            }));
          }
          
          setLastUpdate(new Date());
        } catch (e) {
          console.error("Failed to parse stream data", e);
        }
      };
      
      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Auto reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };
    
    connect();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Real-time Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Real-Time Ubuntu Server</span>
          <Badge 
            variant="outline" 
            className={`text-[10px] ${
              isConnected 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse" 
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {isConnected ? "● LIVE STREAM" : "○ RECONNECTING..."}
          </Badge>
        </div>
        <span className="text-[10px] text-slate-500">
          {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {/* System Stats Grid */}
      {systemData && (
        <div className="grid grid-cols-2 gap-3">
          {/* CPU */}
          <Card className="bg-slate-800/50 border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">CPU Load</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{systemData.cpu}%</div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  systemData.cpu > 80 ? "bg-red-500" : 
                  systemData.cpu > 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${systemData.cpu}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Load: {systemData.load}</p>
          </Card>

          {/* Memory */}
          <Card className="bg-slate-800/50 border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <MemoryStick className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Memory</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {systemData.memory.percent}%
            </div>
            <p className="text-[10px] text-slate-500">
              {Math.round(systemData.memory.used / 1024)}MB / {Math.round(systemData.memory.total / 1024)}MB
            </p>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  systemData.memory.percent > 80 ? "bg-red-500" : "bg-cyan-500"
                }`}
                style={{ width: `${systemData.memory.percent}%` }}
              />
            </div>
          </Card>

          {/* Disk */}
          <Card className="bg-slate-800/50 border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Disk</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{systemData.disk.percent}</div>
            <p className="text-[10px] text-slate-500">
              {systemData.disk.used} / {systemData.disk.total}
            </p>
          </Card>

          {/* Connections */}
          <Card className="bg-slate-800/50 border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Connections</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{systemData.connections}</div>
            <p className="text-[10px] text-slate-500">Active network connections</p>
          </Card>
        </div>
      )}

      {/* Running Processes */}
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-slate-300">Running Processes</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
            {activityData?.processes?.length || 0} active
          </Badge>
        </div>
        
        <ScrollArea className="h-[200px]">
          <div className="p-2">
            {/* Header */}
            <div className="grid grid-cols-5 gap-2 px-2 py-1 text-[10px] text-slate-500 uppercase">
              <span>PID</span>
              <span className="col-span-2">Name</span>
              <span>CPU%</span>
              <span>MEM%</span>
            </div>
            
            {/* Process list */}
            {activityData?.processes?.map((proc, idx) => (
              <div 
                key={`${proc.pid}-${idx}`}
                className="grid grid-cols-5 gap-2 px-2 py-1.5 text-[11px] border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-slate-500 font-mono">{proc.pid}</span>
                <span className="col-span-2 text-slate-300 truncate">{proc.name}</span>
                <span className={`${proc.cpu > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {proc.cpu.toFixed(1)}%
                </span>
                <span className="text-slate-400">{proc.mem.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Workspace Files */}
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">Workspace Files</span>
          </div>
        </div>
        
        <ScrollArea className="h-[150px]">
          <div className="p-2 space-y-1">
            {activityData?.files?.map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between px-3 py-1.5 bg-slate-700/30 rounded text-[11px] hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {file.isDirectory ? (
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                  <span className="text-slate-300">{file.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{file.size}</span>
                  <span className="text-slate-600 text-[10px]">{file.modified}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Agent Activity */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-300">King Hermes Agent Activity</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Monitoring server in real-time</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Voice command executor ready</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Fireworks AI connected</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>System: Ubuntu 24.04 LTS</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
