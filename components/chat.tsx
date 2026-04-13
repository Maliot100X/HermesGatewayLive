"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, Bot, User, Sparkles, Cpu } from "lucide-react";

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
}

export function Chat({ className = "", onSendMessage }: ChatProps) {
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    onSendMessage?.(input);

    // Call REAL Fireworks AI API
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are King Hermes, a powerful AI assistant. Respond with fire emojis and short powerful responses." },
            { role: "user", content: input }
          ],
          temperature: 0.7,
          max_tokens: 1000,
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
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${error instanceof Error ? error.message : "Failed to get AI response"}\n\nPlease check that FIREWORKS_API_KEY is configured.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
            <p className="text-xs text-slate-400">Fireworks AI • Kimi K2.5 Turbo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400">Live Terminal</span>
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
                  <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 border-slate-700 hover:bg-slate-800 hover:border-emerald-500/50"
            title="Voice input"
          >
            <Mic className="w-4 h-4 text-slate-400" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message or command..."
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
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
