"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Key,
  Server,
  Bot,
  Mic
} from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
  description: string;
  category: "ai" | "deployment" | "voice" | "messaging";
  required: boolean;
  placeholder: string;
}

const ENV_VARS: EnvVar[] = [
  {
    key: "FIREWORKS_API_KEY",
    value: "",
    description: "Fireworks AI API key for Kimi K2.5 Turbo",
    category: "ai",
    required: true,
    placeholder: "fw_xxxxxxxxxxxxxxxx",
  },
  {
    key: "OPENAI_API_KEY",
    value: "",
    description: "OpenAI API key (optional backup)",
    category: "ai",
    required: false,
    placeholder: "sk-xxx...xxxx",
  },
  {
    key: "ANTHROPIC_API_KEY",
    value: "",
    description: "Anthropic API key for Claude (optional)",
    category: "ai",
    required: false,
    placeholder: "sk-ant...xxxx",
  },
  {
    key: "VERCEL_TOKEN",
    value: "",
    description: "Vercel API token for deployments",
    category: "deployment",
    required: true,
    placeholder: "vercel_token_xxxxxxxx",
  },
  {
    key: "VERCEL_PROJECT_ID",
    value: "",
    description: "Vercel Project ID",
    category: "deployment",
    required: false,
    placeholder: "prj_xxxxxxxxxxxxxxxx",
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    value: "",
    description: "Telegram Bot Token for bot integration",
    category: "messaging",
    required: false,
    placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
  },
  {
    key: "TELEGRAM_CHAT_ID",
    value: "",
    description: "Telegram Chat ID for notifications",
    category: "messaging",
    required: false,
    placeholder: "123456789",
  },
  {
    key: "ELEVENLABS_API_KEY",
    value: "",
    description: "ElevenLabs API key for voice synthesis",
    category: "voice",
    required: false,
    placeholder: "sk_ba07b27a77486eba2a679af8cfcd879eda45d6703b9b0961",
  },
  {
    key: "ELEVENLABS_VOICE_ID",
    value: "",
    description: "ElevenLabs Voice ID (Roger voice)",
    category: "voice",
    required: false,
    placeholder: "CwhRBWXzGAHq8TQ4Fs17",
  },
];

const categories = [
  { id: "ai", label: "AI", icon: Bot },
  { id: "deployment", label: "Deploy", icon: Server },
  { id: "messaging", label: "Chat", icon: Key },
  { id: "voice", label: "Voice", icon: Mic },
];

export function EnvPanel() {
  const [envVars, setEnvVars] = useState<EnvVar[]>(ENV_VARS);
  const [activeCategory, setActiveCategory] = useState("ai");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load saved values from localStorage on mount
  useEffect(() => {
    const savedVars = localStorage.getItem('hermes_env_vars');
    if (savedVars) {
      try {
        const parsed = JSON.parse(savedVars);
        setEnvVars(prev => prev.map(v => ({
          ...v,
          value: parsed[v.key] || v.value
        })));
      } catch (e) {
        console.error("Failed to load saved env vars:", e);
      }
    }
  }, []);

  const updateValue = (key: string, value: string) => {
    setEnvVars((prev) =>
      prev.map((v) => (v.key === key ? { ...v, value } : v))
    );
    setSaved(false);
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      // Save to localStorage for persistence
      const varsToSave: Record<string, string> = {};
      envVars.forEach(v => {
        if (v.value) varsToSave[v.key] = v.value;
      });
      localStorage.setItem('hermes_env_vars', JSON.stringify(varsToSave));
      
      // Also try to save to backend
      const response = await fetch('/api/save-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envVars.filter(v => v.value)),
      });
      
      if (response.ok) {
        setSaved(true);
        setMessage("Settings saved successfully!");
      } else {
        // Backend might not exist, but localStorage worked
        setSaved(true);
        setMessage("Saved locally! API keys will be used for this session.");
      }
    } catch (e) {
      console.error("Save error:", e);
      // Still mark as saved if localStorage worked
      setSaved(true);
      setMessage("Saved locally!");
    } finally {
      setSaving(false);
      setTimeout(() => {
        setSaved(false);
        setMessage("");
      }, 5000);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ai":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "deployment":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "voice":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "messaging":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const filteredVars = envVars.filter((v) => v.category === activeCategory);

  return (
    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-slate-200">Environment Variables</span>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`text-sm ${
            saved
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
          } text-white`}
          size="sm"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Save All
            </>
          )}
        </Button>
      </div>

      {/* Custom Category Tabs */}
      <div className="grid grid-cols-4 bg-slate-800/50 p-1 m-4 mb-0 rounded-lg">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-all
                ${isActive 
                  ? "bg-slate-700 text-white" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }
              `}
            >
              <Icon className="w-3 h-3" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <div className="space-y-4">
          {filteredVars.map((envVar) => (
            <div key={envVar.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  {envVar.key}
                  {envVar.required && (
                    <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                      Required
                    </Badge>
                  )}
                </label>
                <Badge variant="outline" className={`text-[10px] ${getCategoryColor(envVar.category)}`}>
                  {envVar.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{envVar.description}</p>
              <div className="relative">
                <Input
                  type={showSecrets[envVar.key] ? "text" : "password"}
                  value={envVar.value}
                  onChange={(e) => updateValue(envVar.key, e.target.value)}
                  placeholder={envVar.placeholder}
                  className="pr-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600 focus-visible:ring-emerald-500 font-mono text-sm"
                />
                <button
                  onClick={() =>
                    setShowSecrets((prev) => ({
                      ...prev,
                      [envVar.key]: !prev[envVar.key],
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSecrets[envVar.key] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes("error") || message.includes("failed")
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            API keys are stored securely in your browser and used for API calls. 
            Click "Save All" to persist settings.
          </p>
        </div>
      </div>
    </Card>
  );
}
