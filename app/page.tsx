"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Scene3D } from "@/components/scene3d";
import { Terminal } from "@/components/terminal";
import { Chat } from "@/components/chat";
import { EnvPanel } from "@/components/env-panel";
import { SystemMonitor } from "@/components/system-monitor";
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
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Server
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("terminal");
  const [systemStats, setSystemStats] = useState({
    cpu: "12%",
    memory: "2.4GB / 8GB",
    uptime: "3d 12h 45m",
    connections: 1,
  });
  
  // Voice control state
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const chatRef = useRef<{ sendMessage: (msg: string) => void } | null>(null);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("Listening...");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        // Auto send to chat
        handleVoiceMessage(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      // Auto restart on error
      if (event.error !== "no-speech") {
        setTimeout(() => {
          if (voiceEnabled) recognition.start();
        }, 1000);
      }
    };

    recognition.onend = () => {
      // Auto restart if still enabled
      if (voiceEnabled) {
        setTimeout(() => {
          recognition.start();
        }, 500);
      } else {
        setIsListening(false);
        setTranscript("");
      }
    };

    return recognition;
  }, [voiceEnabled]);

  // Toggle continuous listening
  const toggleListening = () => {
    if (isListening) {
      setVoiceEnabled(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setTranscript("");
    } else {
      setVoiceEnabled(true);
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        alert("Speech recognition not supported. Use Chrome for best results.");
      }
    }
  };

  // Handle voice message
  const handleVoiceMessage = (message: string) => {
    console.log("Voice message:", message);
    // Switch to chat tab
    setActiveTab("chat");
    
    // Send to chat component
    setTimeout(() => {
      const chatInput = document.querySelector('input[placeholder*="Type or speak"]') as HTMLInputElement;
      if (chatInput) {
        chatInput.value = message;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Find and click send button
        setTimeout(() => {
          const sendButton = document.querySelector('button[class*="from-emerald-600"]') as HTMLButtonElement;
          if (sendButton && !sendButton.disabled) {
            sendButton.click();
          }
        }, 100);
      }
    }, 300);
  };

  // Update system stats periodically
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
        // Use fallback stats
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTerminalCommand = (command: string) => {
    console.log("Terminal command:", command);
  };

  const handleChatMessage = (message: string) => {
    console.log("Chat message:", message);
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
                  {isListening && (
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs animate-pulse">
                      <Mic className="w-3 h-3 mr-1" />
                      LISTENING
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Voice Control & System Stats */}
            <div className="flex items-center gap-4">
              {/* 🎤 CONTINUOUS VOICE ASSISTANT */}
              <div className="flex flex-col items-center gap-2">
                {transcript && isListening && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-1 max-w-[200px] truncate bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse"
                  >
                    🎤 {transcript}
                  </Badge>
                )}
                
                <div className="flex items-center gap-2">
                  {/* Main Mic Button */}
                  <Button
                    onClick={toggleListening}
                    size="icon"
                    className={`relative w-14 h-14 rounded-full ${
                      isListening 
                        ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50" 
                        : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/30"
                    }`}
                    title={isListening ? "Click to stop listening" : "Click for continuous voice mode"}
                  >
                    {isListening ? (
                      <MicOff className="w-6 h-6 text-white" />
                    ) : (
                      <Mic className="w-6 h-6 text-white" />
                    )}
                    
                    {isListening && (
                      <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
                    )}
                  </Button>

                  {/* Speaker Toggle */}
                  <Button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    size="icon"
                    variant="outline"
                    className={`w-10 h-10 rounded-full border-slate-700 ${
                      voiceEnabled 
                        ? "bg-slate-800 text-emerald-400 hover:bg-slate-700" 
                        : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                    }`}
                    title={voiceEnabled ? "Voice output ON" : "Voice output OFF"}
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                </div>
                
                <p className="text-[10px] text-slate-500">
                  {isListening ? "Continuous voice mode ON" : "Click mic for voice mode"}
                </p>
              </div>
              
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
          </div>
        </header>

        {/* Main Grid - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Terminal & Chat */}
          <div className="lg:col-span-2 space-y-6">
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
                  className="h-[500px]" 
                />
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <Chat 
                  onSendMessage={handleChatMessage}
                  className="h-[500px]" 
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
                  onClick={toggleListening}
                >
                  <Mic className="w-3 h-3 mr-1" />
                  {isListening ? "Stop Voice" : "Voice"}
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

          {/* Right Column - System Monitor */}
          <div className="space-y-6">
            <SystemMonitor />
            
            {/* Env Panel */}
            <EnvPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
