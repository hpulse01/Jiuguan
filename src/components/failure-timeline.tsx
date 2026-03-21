import {
  Clock,
  Target,
  Crosshair,
  Zap,
  EyeOff,
  Bell,
  CheckCircle2,
} from "lucide-react";

interface TimelineStage {
  icon: React.ReactNode;
  label: string;
  content: string;
  color: string;
}

interface FailureTimelineProps {
  background: string;
  originalGoal: string;
  decisionPoint: string;
  actionsTaken: string;
  ignoredSignals: string;
  earliestWarning: string;
  outcome: string;
}

export function FailureTimeline({
  background,
  originalGoal,
  decisionPoint,
  actionsTaken,
  ignoredSignals,
  earliestWarning,
  outcome,
}: FailureTimelineProps) {
  const stages: TimelineStage[] = [
    {
      icon: <Clock className="h-4 w-4" />,
      label: "背景",
      content: background,
      color: "text-stone-400 border-stone-700 bg-stone-900/40",
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: "当时的目标",
      content: originalGoal,
      color: "text-amber-400 border-amber-900/40 bg-amber-950/20",
    },
    {
      icon: <Crosshair className="h-4 w-4" />,
      label: "关键决策点",
      content: decisionPoint,
      color: "text-amber-400 border-amber-900/40 bg-amber-950/20",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: "采取的行动",
      content: actionsTaken,
      color: "text-orange-400 border-orange-900/30 bg-orange-950/15",
    },
    {
      icon: <EyeOff className="h-4 w-4" />,
      label: "忽略的信号",
      content: ignoredSignals,
      color: "text-red-400 border-red-900/30 bg-red-950/15",
    },
    {
      icon: <Bell className="h-4 w-4" />,
      label: "最早的预警",
      content: earliestWarning,
      color: "text-red-400 border-red-900/30 bg-red-950/15",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "最终结果",
      content: outcome,
      color: "text-stone-300 border-stone-700 bg-stone-900/40",
    },
  ].filter((s) => s.content && s.content.trim().length > 0);

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-stone-700 via-amber-900/50 via-red-900/40 to-stone-700" />

      <div className="space-y-0">
        {stages.map((stage, idx) => (
          <div key={idx} className="relative flex gap-4 group">
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border bg-stone-950 border-stone-700 group-hover:border-amber-700 transition-colors shrink-0">
              <span className={stage.color.split(" ")[0]}>{stage.icon}</span>
            </div>

            {/* Content */}
            <div className={`flex-1 pb-6 ${idx === stages.length - 1 ? "pb-0" : ""}`}>
              <div className="text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                {stage.label}
              </div>
              <div
                className={`p-4 rounded-lg border transition-colors ${stage.color}`}
              >
                <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">
                  {stage.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
