"use client";

import { useState, useEffect } from "react";
import { Scene3D } from "@/components/scene3d";
import { Terminal } from "@/components/terminal";
import { Chat } from "@/components/chat";
import { VoiceTab } from "@/components/voice-tab";
import { RealSystemMonitor } from "@/components/real-system-monitor";
import { RealActivityFeed } from "@/components/real-activity-feed";
import { JarvisTab } from "@/components/jarvis-tab";
import { EnvPanel } from "@/components/env-panel";
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
  Eye,
  Bot
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
        const response = await fetch("/api/real-stats");
        if (response.ok) {
          const data = await response.json();
          setSystemStats({
            cpu: `${data.cpu}%`,
            memory: `${(data.memory.used / 1024).toFixed(1)}GB / ${(data.memory.total / 1024).toFixed(0)}GB`,
            uptime: data.uptime || 'unknown',
            connections: 1,
          });
        }
      } catch (e) {
        console.error("Failed to fetch real stats:", e);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: "terminal", label: "Terminal", icon: TerminalIcon, color: "emerald" },
    { id: "chat", label: "AI Chat", icon: MessageSquare, color: "cyan" },
    { id: "voice", label: "Voice", icon: Mic, color: "purple" },
    { id: "activity", label: "Activity", icon: Eye, color: "amber" },
    { id: "system", label: "System", icon: Activity, color: "slate" },
    { id: "jarvis", label: "J.A.R.V.I.S.", icon: Bot, color: "cyan" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "terminal":
        return <Terminal />;
      case "chat":
        return <Chat />;
      case "voice":
        return <VoiceTab />;
      case "activity":
        return <RealActivityFeed />;
      case "system":
        return <RealSystemMonitor />;
      case "jarvis":
        return <JarvisTab />;
      default:
        return <Terminal />;
    }
  };

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
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
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
            {/* Custom Tabs - No Dependencies */}
            <div className="w-full">
              {/* Tab Buttons */}
              <div className="w-full grid grid-cols-6 bg-slate-800/50 p-1 mb-4 rounded-lg">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const colorClasses: Record<string, string> = {
                    emerald: "text-emerald-400 bg-emerald-500/20",
                    cyan: "text-cyan-400 bg-cyan-500/20",
                    purple: "text-purple-400 bg-purple-500/20",
                    amber: "text-amber-400 bg-amber-500/20",
                    slate: "text-slate-300 bg-slate-500/20",
                  };
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                        ${isActive 
                          ? `${colorClasses[tab.color]} shadow-sm` 
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="h-[500px] bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
                {renderTabContent()}
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-slate-900/50 border-slate-800 p-4 mt-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-6 gap-2">
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
                  onClick={() => setActiveTab("jarvis")}
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50 text-xs"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  J.A.R.V.I.S.
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
