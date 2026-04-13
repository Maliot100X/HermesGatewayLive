"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Volume2, VolumeX, Terminal, Cpu, Activity, Wifi, Play, RotateCcw, Brain, Command, Globe, Zap, MessageSquare } from "lucide-react";

// Voice visualizer component
function VoiceVisualizer({ isListening }: { isListening: boolean }) {
  const [bars, setBars] = useState([0.3, 0.5, 0.4, 0.6, 0.3, 0.5, 0.4]);
  
  useEffect(() => {
    if (!isListening) {
      setBars([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]);
      return;
    }
    
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 0.8 + 0.2));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isListening]);
  
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-100 ${
            isListening ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-slate-600"
          }`}
          style={{ height: `${height * 100}%` }}
        />
      ))}
    </div>
  );
}

interface EnvVars {
  FIREWORKS_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
}

interface Memory {
  id: string;
  content: string;
  timestamp: Date;
}

export function JarvisTab() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Ready");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [conversation, setConversation] = useState<{role: "user" | "ai", text: string; voiceUrl?: string; tools?: string[]}[]>([]);
  const [systemStats, setSystemStats] = useState({
    cpu: "0%",
    memory: "0GB",
    uptime: "unknown"
  });
  const [envVars, setEnvVars] = useState<EnvVars>({});
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const [location, setLocation] = useState<string>("Detecting...");
  const [intent, setIntent] = useState<string>("");

  // Load environment variables from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hermes_env_vars');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEnvVars(parsed);
      } catch (e) {
        console.error("Failed to parse env vars:", e);
      }
    }
  }, []);

  // Load memories from localStorage
  useEffect(() => {
    const savedMemories = localStorage.getItem('jarvis_memories');
    if (savedMemories) {
      try {
        const parsed = JSON.parse(savedMemories);
        setMemories(parsed.map((m: any) => ({...m, timestamp: new Date(m.timestamp)})));
      } catch (e) {
        console.error("Failed to parse memories:", e);
      }
    }
  }, []);

  // Get location
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        },
        () => {
          setLocation("Unknown");
        }
      );
    }
  }, []);

  // Fetch system stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/real-stats');
        if (response.ok) {
          const data = await response.json();
          setSystemStats({
            cpu: `${data.cpu}%`,
            memory: `${(data.memory?.used / 1024).toFixed(1)}GB`,
            uptime: data.uptime || 'unknown'
          });
        }
      } catch (e) {
        console.error("Stats fetch error:", e);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save memories
  const saveMemory = useCallback((content: string) => {
    const newMemory: Memory = {
      id: Date.now().toString(),
      content,
      timestamp: new Date()
    };
    const updated = [...memories, newMemory];
    setMemories(updated);
    localStorage.setItem('jarvis_memories', JSON.stringify(updated));
  }, [memories]);

  // Play voice audio
  const playVoice = useCallback((voiceUrl: string) => {
    if (!voiceEnabled || !voiceUrl) return;
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(voiceUrl);
      audioRef.current = audio;
      audio.play().catch(err => {
        console.error("Audio play error:", err);
        browserTTS(voiceUrl.includes("data:") ? "Voice response received" : voiceUrl);
      });
    } catch (e) {
      console.error("Voice playback error:", e);
    }
  }, [voiceEnabled]);

  // Browser fallback TTS
  const browserTTS = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = synth.getVoices();
    const voice = voices.find(v => v.name.includes("Google US English")) ||
                   voices.find(v => v.lang === "en-US") ||
                   voices[0];
    if (voice) utterance.voice = voice;

    synth.speak(utterance);
  }, [voiceEnabled]);

  // Detect intent from transcript (like real JARVIS)
  const detectIntent = (text: string): { type: string; confidence: number } => {
    const lower = text.toLowerCase();
    
    if (/jarvis.*(what.*think|what.*opinion)/i.test(lower)) return { type: "opinion", confidence: 0.9 };
    if (/jarvis.*(weather|temperature)/i.test(lower)) return { type: "weather", confidence: 0.9 };
    if (/jarvis.*(search|find|look up)/i.test(lower)) return { type: "search", confidence: 0.9 };
    if (/jarvis.*(time|clock|hour)/i.test(lower)) return { type: "time", confidence: 0.9 };
    if (/jarvis.*(open|launch|start)/i.test(lower)) return { type: "launch", confidence: 0.9 };
    if (/jarvis.*(status|health|how.*system)/i.test(lower)) return { type: "system", confidence: 0.9 };
    if (/jarvis.*(list|show.*files|directory)/i.test(lower)) return { type: "files", confidence: 0.9 };
    if (/jarvis.*(git|commit|push|pull)/i.test(lower)) return { type: "git", confidence: 0.9 };
    if (/jarvis.*(build|deploy|compile)/i.test(lower)) return { type: "build", confidence: 0.9 };
    if (/jarvis/i.test(lower)) return { type: "directed", confidence: 0.8 };
    
    return { type: "undirected", confidence: 0.3 };
  };

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("[JARVIS] Speech recognition not supported");
      setStatus("❌ No Speech API - Use text input");
      return null;
    }

    console.log("[JARVIS] Initializing speech recognition...");
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("[JARVIS] Speech recognition STARTED");
      setIsListening(true);
      setStatus("🔴 Listening... SPEAK NOW");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        
        if (isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
        setStatus("🔴 Hearing: " + interimTranscript.slice(0, 30) + "...");
      }

      if (finalTranscript.trim()) {
        console.log("[JARVIS] Processing:", finalTranscript);
        setTranscript(finalTranscript);
        
        // Detect intent
        const detected = detectIntent(finalTranscript);
        setIntent(`${detected.type} (${Math.round(detected.confidence * 100)}%)`);
        
        setIsProcessing(true);
        setStatus("⚡ Processing command...");
        
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
        
        processCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[JARVIS] Speech error:", event.error);
      
      if (event.error === "not-allowed") {
        setStatus("❌ Microphone DENIED");
        setIsListening(false);
      } else if (event.error === "no-speech") {
        setStatus("🔴 Listening... (waiting)");
      } else if (event.error === "network") {
        setStatus("⚠️ Network error - Retrying...");
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        }, 1000);
      } else {
        setStatus(`⚠️ ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isListening && !isProcessing) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
            setStatus("Ready");
          }
        }, 300);
      }
    };

    return recognition;
  }, [isListening, isProcessing]);

  // Process voice/text command (REAL JARVIS LOGIC)
  const processCommand = async (command: string) => {
    try {
      setStatus("⚡ Thinking...");
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      const fireworksKey = envVars.FIREWORKS_API_KEY || "";
      const elevenlabsKey = envVars.ELEVENLABS_API_KEY || "";
      const voiceId = envVars.ELEVENLABS_VOICE_ID || "CwhRBWXzGAHq8TQ4Fs17";
      
      if (fireworksKey) headers['x-fireworks-api-key'] = fireworksKey;
      if (elevenlabsKey) headers['x-elevenlabs-api-key'] = elevenlabsKey;
      if (voiceId) headers['x-elevenlabs-voice-id'] = voiceId;
      
      // Add context about the conversation
      const context = conversation.slice(-3).map(m => `${m.role}: ${m.text}`).join('\n');
      const systemStats = `CPU: ${systemStats.cpu}, Memory: ${systemStats.memory}, Location: ${location}`;
      
      const response = await fetch('/api/agent-command', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          command, 
          source: 'voice',
          context,
          systemStats,
          location
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      const aiResponse = data.response || "Command executed";
      
      // Save to conversation
      setConversation(prev => [...prev, { 
        role: "ai", 
        text: aiResponse,
        voiceUrl: data.voiceUrl,
        tools: data.toolsUsed
      }]);
      
      // Save to memory
      saveMemory(`Q: ${command} | A: ${aiResponse}`);
      
      setStatus(data.executed ? "✅ Done" : "💬 Responded");
      
      // Voice output
      if (voiceEnabled) {
        if (data.voiceUrl) {
          playVoice(data.voiceUrl);
        } else {
          browserTTS(aiResponse);
        }
      }
    } catch (e) {
      console.error("[JARVIS] Error:", e);
      const errorMsg = e instanceof Error ? e.message : "Failed";
      setConversation(prev => [...prev, { role: "ai", text: `❌ Error: ${errorMsg}` }]);
      setStatus("❌ Failed");
      if (voiceEnabled) browserTTS("Sorry, I encountered an error.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle text submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    const command = textInput.trim();
    const detected = detectIntent(command);
    setIntent(`${detected.type} (${Math.round(detected.confidence * 100)}%)`);
    
    setConversation(prev => [...prev, { role: "user", text: command }]);
    setTextInput("");
    setIsProcessing(true);
    setStatus("⚡ Processing...");
    processCommand(command);
  };

  // Toggle listening
  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setStatus("Ready");
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const recognition = initSpeechRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          recognition.start();
        } else {
          setStatus("Browser TTS mode");
        }
      } catch (e) {
        alert("Microphone access required");
      }
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setConversation([]);
    setTranscript("");
    setIntent("");
    setStatus("Ready");
  };

  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-slate-200">J.A.R.V.I.S.</span>
          <Badge 
            variant="outline" 
            className={`text-[10px] ${isListening ? "text-cyan-400 border-cyan-500/20 animate-pulse" : "text-slate-400 border-slate-700"}`}
          >
            {isListening ? <><Wifi className="w-3 h-3 mr-1" /> LISTENING</> : <><MicOff className="w-3 h-3 mr-1" /> IDLE</>}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{status}</span>
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            size="icon"
            variant="ghost"
            className={`w-8 h-8 ${voiceEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Control Panel */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="flex flex-col items-center gap-4">
          <VoiceVisualizer isListening={isListening} />
          
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative w-32 h-32 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50 ${
              isListening 
                ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.6)] animate-pulse" 
                : "bg-gradient-to-br from-purple-500 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]"
            }`}
          >
            {isListening ? (
              <Mic className="w-16 h-16 text-white mx-auto" />
            ) : (
              <MicOff className="w-16 h-16 text-white mx-auto" />
            )}
            
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping" />
                <span className="absolute -inset-4 rounded-full border-2 border-cyan-300/30 animate-pulse" />
              </>
            )}
          </button>
          
          <p className={`text-lg font-medium ${isListening ? 'text-cyan-400' : isProcessing ? 'text-amber-400' : 'text-slate-400'}`}>
            {isListening ? "🔴 Listening... Say 'Jarvis' + command" : isProcessing ? "⚡ Processing..." : "Tap mic to activate"}
          </p>
          
          {transcript && (
            <div className="bg-slate-800/50 rounded-lg px-4 py-2 max-w-md text-center">
              <p className="text-slate-200">"{transcript}"</p>
              {intent && <p className="text-xs text-cyan-400 mt-1">Detected: {intent}</p>}
            </div>
          )}
        </div>
      </Card>

      {/* Text Input */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">⌨️ Or type a command</h3>
        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g., 'Jarvis, what's the system status?'"
            className="flex-1 bg-slate-800 border-slate-700 text-slate-200"
            disabled={isProcessing}
          />
          <Button 
            type="submit" 
            disabled={!textInput.trim() || isProcessing}
            className="bg-cyan-600 hover:bg-cyan-500"
          >
            {isProcessing ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>
        </form>
      </Card>

      {/* API Status */}
      <Card className="bg-slate-900/50 border-slate-800 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Services:</span>
          <div className="flex gap-2">
            <Badge variant="outline" className={`text-[10px] ${envVars.FIREWORKS_API_KEY ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"}`}>
              <Brain className="w-3 h-3 mr-1" />
              {envVars.FIREWORKS_API_KEY ? "AI Ready" : "AI Offline"}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${envVars.ELEVENLABS_API_KEY ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30"}`}>
              <Volume2 className="w-3 h-3 mr-1" />
              {envVars.ELEVENLABS_API_KEY ? "Voice Ready" : "Browser TTS"}
            </Badge>
          </div>
        </div>
        {!envVars.FIREWORKS_API_KEY && (
          <p className="text-[10px] text-amber-500 mt-2">
            ⚠️ Set FIREWORKS_API_KEY in Environment panel
          </p>
        )}
      </Card>

      {/* Quick Commands */}
      <Card className="bg-slate-900/50 border-slate-800 p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3">⚡ Quick Commands</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { cmd: "Jarvis, check system status", label: "System Status" },
            { cmd: "Jarvis, list files", label: "List Files" },
            { cmd: "Jarvis, what's the time", label: "Time" },
            { cmd: "Jarvis, open dashboard", label: "Open Dashboard" },
            { cmd: "Jarvis, run build", label: "Build" },
            { cmd: "Jarvis, git status", label: "Git Status" }
          ].map(({ cmd, label }) => (
            <Button
              key={cmd}
              onClick={() => {
                setConversation(prev => [...prev, { role: "user", text: label }]);
                setIsProcessing(true);
                processCommand(cmd);
              }}
              disabled={isProcessing}
              variant="outline"
              size="sm"
              className="border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50 text-xs disabled:opacity-50"
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-slate-900/50 border-slate-800 p-3 text-center">
          <Cpu className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500">CPU</p>
          <p className="text-lg font-bold text-emerald-400">{systemStats.cpu}</p>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 p-3 text-center">
          <Activity className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500">Memory</p>
          <p className="text-lg font-bold text-cyan-400">{systemStats.memory}</p>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800 p-3 text-center">
          <Globe className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500">Location</p>
          <p className="text-sm font-bold text-amber-400 truncate">{location}</p>
        </Card>
      </div>

      {/* Conversation */}
      <Card className="bg-slate-900/50 border-slate-800 p-4 flex-1 min-h-[200px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversation
          </h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowMemories(!showMemories)}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-cyan-400"
            >
              <Brain className="w-4 h-4" />
            </Button>
            {conversation.length > 0 && (
              <Button
                onClick={clearConversation}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-red-400"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {showMemories ? (
            // Show memories
            memories.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No memories yet</p>
            ) : (
              memories.slice(-5).map((m, idx) => (
                <div key={m.id} className="flex items-start gap-2 p-2 rounded bg-slate-800/30">
                  <Brain className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-300">{m.content}</p>
                    <p className="text-[10px] text-slate-500">{m.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )
          ) : conversation.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No conversation yet</p>
              <p className="text-xs text-slate-600 mt-1">Say "Jarvis" + your command</p>
            </div>
          ) : (
            conversation.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-2 p-2 rounded ${
                  msg.role === "user" ? "bg-slate-800/50" : "bg-cyan-500/10"
                }`}
              >
                <span className={`text-xs font-bold shrink-0 ${msg.role === "user" ? "text-slate-400" : "text-cyan-400"}`}>
                  {msg.role === "user" ? "YOU" : "JARVIS"}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{msg.text}</p>
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {msg.tools.map(tool => (
                        <Badge key={tool} variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                          <Zap className="w-3 h-3 mr-1" />
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "ai" && msg.voiceUrl && (
                  <Button
                    onClick={() => playVoice(msg.voiceUrl!)}
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-cyan-400 hover:text-cyan-300 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
