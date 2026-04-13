"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, Bot, User, Sparkles, Cpu, Volume2, VolumeX } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatProps {
  className?: string;
  onSendMessage?: (message: string) => void;
  voiceEnabled?: boolean;
}

export function Chat({ className = "", onSendMessage, voiceEnabled = true }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "🔥 Welcome to Live Terminal Dashboard!\n\nI'm your AI assistant connected to:\n• Ubuntu Terminal (Real-time access)\n• Fireworks AI (Kimi K2.5 Turbo)\n• Voice Control (Click mic to speak)\n\nType a command or ask me anything!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // SPEAK function - Text to Speech
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !voiceOutputEnabled) return;
    
    const synth = window.speechSynthesis;
    if (!synth) {
      console.error("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    // Clean text for speech (remove emojis, markdown)
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_`#]/g, '')
      .substring(0, 500); // Limit length

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Get voices and select a good one
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) ||
                          voices.find(v => v.name.includes("Samantha")) ||
                          voices.find(v => v.name.includes("Daniel")) ||
                          voices.find(v => v.lang === "en-US" && v.name.includes("Male")) ||
                          voices.find(v => v.lang === "en-US");
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synth.speak(utterance);
  }, [voiceOutputEnabled]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
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
        setInput(finalTranscript);
        // Auto send after voice input
        setTimeout(() => {
          sendMessage(finalTranscript);
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, []);

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        alert("Speech recognition not supported in this browser. Use Chrome for best results.");
      }
    }
  };

  // Main send message function
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    onSendMessage?.(messageText);

    // Call REAL Fireworks AI API
    try {
      // Get API key from localStorage (saved in Environment Variables panel)
      const savedVars = localStorage.getItem('hermes_env_vars');
      const envVars = savedVars ? JSON.parse(savedVars) : {};
      const apiKey = envVars.FIREWORKS_API_KEY || "";
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are King Hermes, a powerful AI assistant. Respond with fire emojis and short powerful responses. Maximum 2-3 sentences." },
            { role: "user", content: messageText }
          ],
          temperature: 0.7,
          max_tokens: 300,
          apiKey: apiKey, // Send the API key from localStorage
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "No response from AI";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      // 🔊 SPEAK THE RESPONSE!
      speak(aiContent);
      
    } catch (error) {
      const errorText = `❌ Error: ${error instanceof Error ? error.message : "Failed to get AI response"}`;
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      speak("Sorry, I encountered an error connecting to the AI.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={`bg-slate-900/50 border-slate-800 overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 status-online" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">King Hermes AI</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                <Sparkles className="w-3 h-3 mr-1" />
                ONLINE
              </Badge>
            </div>
            <p className="text-xs text-slate-400">Fireworks AI • Kimi K2.5 Turbo • Voice Enabled</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice Output Toggle */}
          <Button
            onClick={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
            size="icon"
            variant="ghost"
            className={`w-8 h-8 ${voiceOutputEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
            title={voiceOutputEnabled ? "Voice ON" : "Voice OFF"}
          >
            {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Cpu className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className={`w-8 h-8 shrink-0 ${
                message.role === "user"
                  ? "bg-slate-700"
                  : "bg-gradient-to-br from-emerald-500 to-cyan-500"
              }`}>
                <AvatarFallback className={
                  message.role === "user" ? "bg-slate-700 text-slate-300" : "text-white"
                }>
                  {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === "user"
                    ? "bg-cyan-600 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-[10px] mt-1 ${
                  message.role === "user" ? "text-cyan-200" : "text-slate-500"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500">
                <AvatarFallback className="text-white"><Bot className="w-4 h-4" /></AvatarFallback>
              </Avatar>
              <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-700">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex gap-2">
          {/* 🎤 MIC BUTTON */}
          <Button
            onClick={toggleListening}
            variant="outline"
            size="icon"
            className={`shrink-0 border-slate-700 ${
              isListening 
                ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                : "hover:bg-slate-800 hover:border-emerald-500/50"
            }`}
            title={isListening ? "Listening... Click to stop" : "Click to speak"}
          >
            {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4 text-slate-400" />}
          </Button>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening... Speak now!" : "Type or speak a message..."}
            className="flex-1 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="shrink-0 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          {isListening 
            ? "🎤 Listening... Speak now!" 
            : "Press Enter to send • Click mic to speak • AI will respond with voice"}
        </p>
      </div>
    </Card>
  );
}
