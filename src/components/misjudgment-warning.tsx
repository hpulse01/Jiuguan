import { AlertTriangle, EyeOff, Bell, Lightbulb } from "lucide-react";

interface MisjudgmentWarningProps {
  ignoredSignals: string;
  earliestWarning: string;
  adviceToOthers: string;
}

export function MisjudgmentWarning({
  ignoredSignals,
  earliestWarning,
  adviceToOthers,
}: MisjudgmentWarningProps) {
  return (
    <div className="rounded-xl border border-amber-900/40 bg-gradient-to-br from-amber-950/30 via-stone-950 to-red-950/20 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-amber-900/30 bg-amber-950/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-amber-400">
            关键警示
          </h3>
          <span className="text-xs text-amber-600 ml-auto">
            这段弯路的核心教训
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Biggest Misjudgment */}
        {ignoredSignals && (
          <div className="flex gap-3">
            <div className="shrink-0 mt-1">
              <div className="h-8 w-8 rounded-lg bg-red-950/40 flex items-center justify-center">
                <EyeOff className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-red-400 mb-1">
                最大误判 · 忽略的信号
              </div>
              <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">
                {ignoredSignals}
              </p>
            </div>
          </div>
        )}

        {/* Earliest Warning */}
        {earliestWarning && (
          <div className="flex gap-3">
            <div className="shrink-0 mt-1">
              <div className="h-8 w-8 rounded-lg bg-amber-950/40 flex items-center justify-center">
                <Bell className="h-4 w-4 text-amber-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-400 mb-1">
                最早预警信号
              </div>
              <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">
                {earliestWarning}
              </p>
            </div>
          </div>
        )}

        {/* Key Advice */}
        {adviceToOthers && (
          <div className="flex gap-3">
            <div className="shrink-0 mt-1">
              <div className="h-8 w-8 rounded-lg bg-green-950/40 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-green-400 mb-1">
                给后来者的忠告
              </div>
              <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">
                {adviceToOthers.length > 200
                  ? adviceToOthers.slice(0, 200) + "..."
                  : adviceToOthers}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
