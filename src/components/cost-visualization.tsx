import { Timer, DollarSign, Heart, Lightbulb } from "lucide-react";

interface CostVisualizationProps {
  costTime?: string | null;
  costMoney?: string | null;
  costRelationship?: string | null;
  costOpportunity?: string | null;
}

const costCards = [
  {
    key: "time" as const,
    label: "时间成本",
    sublabel: "浪费了多少时间",
    icon: Timer,
    color: "text-blue-400",
    borderColor: "border-blue-900/30",
    bgColor: "bg-blue-950/15",
    iconBg: "bg-blue-950/40",
  },
  {
    key: "money" as const,
    label: "金钱成本",
    sublabel: "损失了多少钱",
    icon: DollarSign,
    color: "text-orange-400",
    borderColor: "border-orange-900/30",
    bgColor: "bg-orange-950/15",
    iconBg: "bg-orange-950/40",
  },
  {
    key: "relationship" as const,
    label: "关系成本",
    sublabel: "伤害了哪些关系",
    icon: Heart,
    color: "text-red-400",
    borderColor: "border-red-900/30",
    bgColor: "bg-red-950/15",
    iconBg: "bg-red-950/40",
  },
  {
    key: "opportunity" as const,
    label: "机会成本",
    sublabel: "错过了什么机会",
    icon: Lightbulb,
    color: "text-amber-400",
    borderColor: "border-amber-900/30",
    bgColor: "bg-amber-950/15",
    iconBg: "bg-amber-950/40",
  },
];

export function CostVisualization({
  costTime,
  costMoney,
  costRelationship,
  costOpportunity,
}: CostVisualizationProps) {
  const costMap: Record<string, string | null | undefined> = {
    time: costTime,
    money: costMoney,
    relationship: costRelationship,
    opportunity: costOpportunity,
  };

  const activeCosts = costCards.filter((c) => costMap[c.key]?.trim());

  if (activeCosts.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-stone-800/40 bg-stone-900/20 text-center">
        <p className="text-sm text-stone-500 italic">
          这杯酒的代价，作者选择了沉默
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {activeCosts.map((card) => {
        const Icon = card.icon;
        const value = costMap[card.key];
        return (
          <div
            key={card.key}
            className={`p-4 rounded-lg border ${card.borderColor} ${card.bgColor} transition-colors hover:brightness-110`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`${card.iconBg} rounded-lg p-2 shrink-0`}
              >
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${card.color} mb-0.5`}>
                  {card.label}
                </div>
                <p className="text-sm text-stone-200 leading-relaxed">
                  {value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
