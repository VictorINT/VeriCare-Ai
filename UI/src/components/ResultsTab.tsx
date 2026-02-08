import { useState } from "react";
import { Lightbulb, TrendingUp, Building2, ChevronDown } from "lucide-react";
import FacilityCard from "./FacilityCard";
import type { AnalysisResponse } from "@/data/mockData";

interface ResultsTabProps {
  data: AnalysisResponse;
}

const INITIAL_SHOW = 20;

const ResultsTab = ({ data }: ResultsTabProps) => {
  const [showCount, setShowCount] = useState(INITIAL_SHOW);
  const anomalyCount = data.facilities.filter(f => f.anomalies.length > 0).length;
  const verifiedCount = data.facilities.filter(f => f.anomalies.length === 0).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Answer summary */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.06]" />
        <div className="relative p-4 sm:p-6 md:p-8 border border-primary/15 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest">
              Summary
            </h3>
          </div>
          <p className="text-foreground/90 leading-relaxed text-sm sm:text-[15px]">{data.answer}</p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-5">
            <div className="stat-pill">
              <Building2 className="w-3.5 h-3.5" />
              {data.facilities.length} facilities
            </div>
            <div className="stat-pill">
              <TrendingUp className="w-3.5 h-3.5" />
              {verifiedCount} verified
            </div>
            {anomalyCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                ⚠ {anomalyCount} with anomalies
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Facilities Found ({data.facilities.length})
        </h3>
        <div className="grid gap-3 sm:gap-4">
          {data.facilities.slice(0, showCount).map((facility, index) => (
            <FacilityCard key={facility.id} facility={facility} index={index} />
          ))}
        </div>
        {showCount < data.facilities.length && (
          <button
            onClick={() => setShowCount((c) => c + 30)}
            className="mt-4 mx-auto flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            Show more ({data.facilities.length - showCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsTab;
