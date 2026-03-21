"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Clock, Target, Crosshair, Zap, EyeOff, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadingLayerToggleProps {
  background: string;
  originalGoal: string;
  decisionPoint: string;
  actionsTaken: string;
  ignoredSignals: string;
  earliestWarning: string;
  outcome: string;
}

const sections = [
  { key: "background", label: "背景", icon: Clock },
  { key: "originalGoal", label: "当时的目标", icon: Target },
  { key: "decisionPoint", label: "关键决策点", icon: Crosshair },
  { key: "actionsTaken", label: "做了什么", icon: Zap },
  { key: "ignoredSignals", label: "忽略了什么信号", icon: EyeOff },
  { key: "earliestWarning", label: "最早的预警", icon: Bell },
  { key: "outcome", label: "最终结果", icon: CheckCircle2 },
] as const;

export function ReadingLayerToggle(props: ReadingLayerToggleProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setExpanded(!expanded)}
        className="w-full border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-900/40 mb-4"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        {expanded ? "收起完整叙述" : "展开完整叙述 · 听完这个故事"}
        {expanded ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>

      {expanded && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          {sections.map(({ key, label, icon: Icon }) => {
            const content = props[key];
            if (!content || !content.trim()) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-stone-100">
                    {label}
                  </h3>
                </div>
                <div className="p-5 rounded-lg border border-stone-800/60 bg-stone-900/40">
                  <p className="text-stone-200 leading-relaxed whitespace-pre-wrap">
                    {content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
