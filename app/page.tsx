"use client";

import { useState, useEffect } from "react";
import { Scene3D } from "@/components/scene3d";
import { Terminal } from "@/components/terminal";
import { Chat } from "@/components/chat";
import { VoiceTab } from "@/components/voice-tab";
import { RealSystemMonitor } from "@/components/real-system-monitor";
import { RealActivityFeed } from "@/components/real-activity-feed";
import { EnvPanel } from "@/components/env-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TerminalIcon, 
  MessageSquare, 
  Settings, 
  Activity, 
  Globe,
  Zap,
  Cpu,
  Wifi,
  Mic,
  Sparkles,
  Eye
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("terminal");
  const [systemStats, setSystemStats] = useState({
    cpu: "12%",
    memory: "2.4GB / 8GB",
    uptime: "3d 12h 45m",
    connections: 1,
  });

  useEffect(() => {
    const updateStats = async () => {
      try {
        const response = await fetch("/api/system");
        if (response.ok) {
          const data = await response.json();
          setSystemStats({
            cpu: `${data.cpu}%`,
            memory: `${(data.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(data.memory.total / 1024 / 1024 / 1024).toFixed(0)}GB`,
            uptime: data.uptime,
            connections: data.connections,
          });
        }
      } catch (e) {
        // Fallback stats
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* 3D Background */}
      <Scene3D />
      
      {/* Main Content */}
      <div className="relative z-10 p-4 lg:p-6 min-h-screen">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TerminalIcon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 status-online" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Live Terminal Dashboard
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                    <Wifi className="w-3 h-3 mr-1" />
                    LIVE
                  </Badge>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs">
                    <Cpu className="w-3 h-3 mr-1" />
                    Ubuntu Server
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
              </div>
            </div>

            {/* System Stats */}
            <Card className="bg-slate-900/50 border-slate-800 p-3 flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase">CPU</p>
                <p className="text-sm font-semibold text-emerald-400">{systemStats.cpu}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase">Memory</p>
                <p className="text-sm font-semibold text-cyan-400">{systemStats.memory}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase">Uptime</p>
                <p className="text-sm font-semibold text-blue-400">{systemStats.uptime}</p>
              </div>
            </Card>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Main Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-5 bg-slate-800/50 p-1 mb-4">
                <TabsTrigger 
                  value="terminal" 
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400"
                >
                  <TerminalIcon className="w-4 h-4 mr-2" />
                  Terminal
                </TabsTrigger>
                <TabsTrigger 
                  value="chat"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="voice"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-purple-400"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Voice
                </TabsTrigger>
                <TabsTrigger 
                  value="activity"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-amber-400"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Activity
                </TabsTrigger>
                <TabsTrigger 
                  value="system"
                  className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-300"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  System
                </TabsTrigger>
              </TabsList>

              <TabsContent value="terminal" className="mt-0 h-[500px]">
                <Terminal />
              </TabsContent>

              <TabsContent value="chat" className="mt-0 h-[500px]">
                <Chat />
              </TabsContent>

              <TabsContent value="voice" className="mt-0 h-[500px]">
                <VoiceTab />
              </TabsContent>

              <TabsContent value="system" className="mt-0 h-[500px] overflow-auto">
                <RealSystemMonitor />
              </TabsContent>
              
              <TabsContent value="activity" className="mt-0 h-[500px] overflow-auto">
                <RealActivityFeed />
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card className="bg-slate-900/50 border-slate-800 p-4 mt-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <Button 
                  onClick={() => setActiveTab("terminal")}
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-emerald-500/50 text-xs"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Terminal
                </Button>
                <Button 
                  onClick={() => setActiveTab("system")}
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50 text-xs"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Status
                </Button>
                <Button 
                  onClick={() => setActiveTab("voice")}
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-purple-500/50 text-xs"
                >
                  <Mic className="w-3 h-3 mr-1" />
                  Voice
                </Button>
                <Button 
                  onClick={() => setActiveTab("activity")}
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-amber-500/50 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Activity
                </Button>
                <Button 
                  onClick={() => setActiveTab("terminal")}
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-amber-500/50 text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Settings
                </Button>
              </div>
            </Card>
          </div>

          {/* Right - Env Panel */}
          <div>
            <EnvPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
