import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, BookOpen, Zap } from "lucide-react";
import type { AnalysisResponse } from "@/data/mockData";

interface EvidenceTabProps {
  data: AnalysisResponse;
}

const EvidenceTab = ({ data }: EvidenceTabProps) => {
  return (
    <div className="space-y-5 animate-fade-in">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Evidence & Reasoning ({data.evidence.length})
      </h3>

      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Evidence & Reasoning ({data.evidence.length})
      </h3>

      {data.evidence.map((item, index) => (
        <EvidenceCard key={index} item={item} index={index} />
      ))}
    </div>
  );
};

interface EvidenceCardProps {
  item: {
    facilityName: string;
    snippet: string;
    reasoning: string;
    anomalyRule?: string;
  };
  index: number;
}

const EvidenceCard = ({ item, index }: EvidenceCardProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasAnomaly = !!item.anomalyRule;

  return (
    <div
      className="glass-card rounded-2xl p-6 animate-fade-in-up hover:shadow-lg transition-shadow duration-300"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {hasAnomaly ? (
            <div className="w-8 h-8 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
          )}
          <h4 className="font-semibold text-foreground">{item.facilityName}</h4>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors duration-200"
        >
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-5 space-y-4 animate-fade-in">
          {/* Source snippet */}
          <div className="p-4 rounded-xl bg-evidence/5 border border-evidence/15">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-evidence" />
              <span className="text-[11px] font-bold text-evidence uppercase tracking-widest">
                Source Evidence
              </span>
            </div>
            <p className="text-sm text-foreground/85 italic leading-relaxed">"{item.snippet}"</p>
          </div>

          {/* Reasoning */}
          <div className="pl-4 border-l-2 border-primary/20">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Why this was selected
            </span>
            <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{item.reasoning}</p>
          </div>

          {/* Anomaly rule */}
          {item.anomalyRule && (
            <div className="p-4 rounded-xl bg-warning/6 border border-warning/15">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-warning" />
                <span className="text-[11px] font-bold text-warning uppercase tracking-widest">
                  Rule Triggered
                </span>
              </div>
              <p className="text-sm text-foreground/85 font-mono">{item.anomalyRule}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceTab;
