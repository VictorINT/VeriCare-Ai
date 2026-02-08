import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, MapPin, FileText, Shield, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Facility } from "@/data/mockData";

interface FacilityCardProps {
  facility: Facility;
  index: number;
}

const capabilityColors: Record<string, string> = {
  Emergency: "bg-desert/10 text-desert border-desert/20",
  Obstetrics: "bg-evidence/10 text-evidence border-evidence/20",
  Pediatrics: "bg-success/10 text-success border-success/20",
  Surgery: "bg-warning/10 text-warning border-warning/20",
  Imaging: "bg-primary/10 text-primary border-primary/20",
};

const FacilityCard = ({ facility, index }: FacilityCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const hasAnomalies = facility.anomalies.length > 0;

  return (
    <div
      className={`group glass-card rounded-2xl p-5 sm:p-6 animate-fade-in-up transition-all duration-300 hover:shadow-lg ${
        hasAnomalies ? "border-warning/30 hover:border-warning/50" : "hover:border-primary/20"
      }`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            {hasAnomalies ? (
              <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0" />
            ) : (
              <Shield className="w-5 h-5 text-success flex-shrink-0" />
            )}
            <h3 className="font-semibold text-foreground text-base font-sans">{facility.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1 ml-[30px]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {facility.city}, {facility.district} — {facility.region}
            </span>
          </div>
        </div>
      </div>

      {/* Capabilities badges */}
      <div className="flex flex-wrap gap-1.5 mt-4 ml-[30px]">
        {facility.capabilities.map((cap) => (
          <Tooltip key={cap}>
            <TooltipTrigger asChild>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border cursor-help transition-transform duration-200 hover:scale-105 ${capabilityColors[cap] || "bg-secondary text-secondary-foreground"}`}>
                {cap}
              </span>
            </TooltipTrigger>
            <TooltipContent>Extracted capability: {cap}</TooltipContent>
          </Tooltip>
        ))}
        {facility.specialties.map((spec) => (
          <Badge key={spec} variant="outline" className="text-xs rounded-full px-2.5 py-1 font-normal">
            {spec}
          </Badge>
        ))}
      </div>

      {/* Anomalies */}
      {hasAnomalies && (
        <div className="mt-4 ml-[30px] space-y-2">
          {facility.anomalies.map((anomaly, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-warning/8 border border-warning/15 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-foreground/90">{anomaly}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-4 ml-[30px]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/80 transition-colors duration-200"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? "Hide details" : "Details"}
        </button>
        <span className="w-px h-4 bg-border" />
        <button
          onClick={() => setCitationsOpen(!citationsOpen)}
          className="flex items-center gap-1.5 text-sm text-evidence font-medium hover:text-evidence/80 transition-colors duration-200"
        >
          <FileText className="w-3.5 h-3.5" />
          {citationsOpen ? "Hide evidence" : `Evidence (${facility.citations.length})`}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 ml-[30px] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <DetailList title="Procedures" items={facility.procedures} />
          <DetailList title="Equipment" items={facility.equipment} />
        </div>
      )}

      {/* Citations */}
      {citationsOpen && (
        <div className="mt-4 ml-[30px] space-y-2 animate-fade-in">
          {facility.citations.map((cit, i) => (
            <div key={i} className="text-sm p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <span className="font-mono bg-evidence/10 text-evidence px-2 py-0.5 rounded-md font-medium">{cit.rowId}</span>
                <span className="text-border">·</span>
                <span className="italic">{cit.sourceColumn}</span>
              </div>
              <p className="text-foreground/85 italic leading-relaxed">"{cit.snippet}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DetailList = ({ title, items }: { title: string; items: string[] }) => (
  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
      {title}
    </h4>
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-foreground/85 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full gradient-primary flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default FacilityCard;
