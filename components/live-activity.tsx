"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  Wifi
} from "lucide-react";

export function LiveActivity() {
  const [stats, setStats] = useState({
    cpu: 0,
    memory: { used: 0, total: 0, percent: 0 },
    disk: { used: "0G", total: "0G", percent: "0%" },
    connections: 0,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/system");
        if (response.ok) {
          const data = await response.json();
          setStats({
            cpu: data.cpu || 0,
            memory: data.memory || { used: 0, total: 0, percent: 0 },
            disk: data.disk || { used: "0G", total: "0G", percent: "0%" },
            connections: data.connections || 0,
          });
          setIsConnected(true);
        }
      } catch (e) {
        console.error("Failed to fetch stats", e);
        setIsConnected(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-slate-200">Live Ubuntu Server</span>
          </div>
          <Badge 
            variant="outline" 
            className={isConnected ? "text-emerald-400 border-emerald-500/20" : "text-red-400 border-red-500/20"}
          >
            {isConnected ? "● LIVE" : "○ OFFLINE"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">CPU</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.cpu}%</div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.cpu}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MemoryStick className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Memory</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">{stats.memory.percent}%</div>
            <p className="text-[10px] text-slate-500 mt-1">
              {Math.round(stats.memory.used / 1024)}MB / {Math.round(stats.memory.total / 1024)}MB
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Disk</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.disk.percent}</div>
            <p className="text-[10px] text-slate-500 mt-1">
              {stats.disk.used} / {stats.disk.total}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Connections</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.connections}</div>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Agent Status</h3>
        <div className="space-y-2 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Monitoring server in real-time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Voice command executor ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Fireworks AI connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Ubuntu 24.04 LTS Server</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
