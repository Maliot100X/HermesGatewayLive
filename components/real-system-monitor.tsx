"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity,
  Wifi,
  WifiOff,
  Server,
  Clock
} from "lucide-react";

interface RealStats {
  cpu: string;
  memory: {
    total: number;
    used: number;
    percent: number;
    free: number;
  };
  disk: {
    percent: string;
    used: string;
    total: string;
  };
  uptime: string;
  loadAvg: {
    one: string;
    five: string;
    fifteen: string;
  };
  timestamp: number;
}

export function RealSystemMonitor() {
  const [stats, setStats] = useState<RealStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const response = await fetch('/api/real-stats', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setIsConnected(true);
          setLastUpdate(new Date());
          setError(null);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (e) {
        console.error("Failed to fetch real stats:", e);
        setIsConnected(false);
        setError("Disconnected from real server");
      }
    };

    // Initial fetch
    fetchRealStats();
    
    // Update every 3 seconds
    const interval = setInterval(fetchRealStats, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (mb: number) => {
    if (mb > 1024) {
      return (mb / 1024).toFixed(1) + ' GB';
    }
    return mb + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-slate-200">REAL Ubuntu Server</span>
          <Badge 
            variant="outline" 
            className={`text-[10px] ${isConnected ? "text-emerald-400 border-emerald-500/20" : "text-red-400 border-red-500/20"}`}
          >
            {isConnected ? <><Wifi className="w-3 h-3 mr-1" /> REAL DATA</> : <><WifiOff className="w-3 h-3 mr-1" /> OFFLINE</>}
          </Badge>
        </div>
        {lastUpdate && (
          <span className="text-[10px] text-slate-500">
            {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20 p-3">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-slate-500 mt-1">
            Make sure data bridge is running on 192.155.85.109:3002
          </p>
        </Card>
      )}

      {stats && (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* CPU */}
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">CPU Usage</span>
              </div>
              <div className="text-3xl font-bold text-emerald-400">{stats.cpu}%</div>
              <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${stats.cpu}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Load: {stats.loadAvg?.one || '0'} / {stats.loadAvg?.five || '0'} / {stats.loadAvg?.fifteen || '0'}
              </div>
            </Card>

            {/* Memory */}
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-slate-400">Memory</span>
              </div>
              <div className="text-3xl font-bold text-cyan-400">{stats.memory.percent}%</div>
              <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${stats.memory.percent}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
              </div>
            </Card>

            {/* Disk */}
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Disk</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">{stats.disk.percent}</div>
              <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: stats.disk.percent }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {stats.disk.used} / {stats.disk.total}
              </div>
            </Card>

            {/* Uptime */}
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-slate-400">Uptime</span>
              </div>
              <div className="text-lg font-bold text-amber-400">{stats.uptime || 'Unknown'}</div>
              <div className="mt-2 text-xs text-slate-500">
                Server has been running continuously
              </div>
            </Card>
          </div>

          {/* Status Info */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Server Details
            </h3>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>Server IP:</span>
                <span className="text-slate-300 font-mono">192.155.85.109</span>
              </div>
              <div className="flex justify-between">
                <span>OS:</span>
                <span className="text-slate-300">Ubuntu 24.04 LTS</span>
              </div>
              <div className="flex justify-between">
                <span>Data Source:</span>
                <span className="text-emerald-400">LIVE - 192.155.85.109</span>
              </div>
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span className="text-slate-300">{lastUpdate?.toLocaleTimeString() || 'Never'}</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {!stats && !error && (
        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <Server className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-500">Connecting to real server...</p>
          <p className="text-xs text-slate-600 mt-2">192.155.85.109:3002</p>
        </Card>
      )}
    </div>
  );
}
