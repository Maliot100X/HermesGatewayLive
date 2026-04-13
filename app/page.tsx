"use client";

import { useState } from "react";
import { Scene3D } from "@/components/scene3d";
import { Terminal } from "@/components/terminal";
import { Chat } from "@/components/chat";
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
  Sparkles
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("terminal");
  const [systemStats] = useState({
    cpu: "12%",
    memory: "2.4GB / 8GB",
    uptime: "3d 12h 45m",
    connections: 1,
  });

  const handleTerminalCommand = (command: string) => {
    console.log("Terminal command:", command);
    // In production, this would send to WebSocket
  };

  const handleChatMessage = (message: string) => {
    console.log("Chat message:", message);
    // In production, this would send to AI API
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
            <Card className="bg-slate-900/50 border-slate-800 p-3 flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">CPU</p>
                <p className="text-sm font-semibold text-emerald-400">{systemStats.cpu}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Memory</p>
                <p className="text-sm font-semibold text-cyan-400">{systemStats.memory}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Uptime</p>
                <p className="text-sm font-semibold text-blue-400">{systemStats.uptime}</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Users</p>
                <p className="text-sm font-semibold text-amber-400">{systemStats.connections}</p>
              </div>
            </Card>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Terminal & Chat */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-slate-800/50 p-1 mb-4">
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
              </TabsList>

              <TabsContent value="terminal" className="mt-0">
                <Terminal 
                  onCommand={handleTerminalCommand} 
                  className="h-[600px]" 
                />
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <Chat 
                  onSendMessage={handleChatMessage}
                  className="h-[600px]" 
                />
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-emerald-500/50 text-xs"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Deploy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50 text-xs"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-purple-500/50 text-xs"
                >
                  <Mic className="w-3 h-3 mr-1" />
                  Voice
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800 hover:border-amber-500/50 text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Config
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Env Panel & Info */}
          <div className="space-y-6">
            <EnvPanel />

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-slate-900/50 border-slate-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <TerminalIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Terminal Access</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Full Ubuntu terminal access via browser. Execute commands in real-time.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">AI Assistant</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Powered by Fireworks AI with Kimi K2.5 Turbo. Ask anything!
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Voice Control</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Speak commands naturally. ElevenLabs integration for voice synthesis.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Vercel Ready</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      One-click deploy to Vercel. Configure tokens in Environment tab.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-600 pt-4">
              <p>🔥 Live Terminal Dashboard v1.0 • Powered by Next.js + React Three Fiber</p>
              <p className="mt-1">Fireworks AI • Kimi K2.5 Turbo • Ubuntu Server</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
