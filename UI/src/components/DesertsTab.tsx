import { AlertCircle, MapPin, Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResponse, Desert } from "@/data/mockData";
import { useMemo, useState } from "react";

interface DesertsTabProps {
  data: AnalysisResponse;
}

const severityConfig = {
  critical: {
    label: "Critical",
    bg: "bg-desert/8",
    border: "border-desert/20",
    hoverBorder: "hover:border-desert/40",
    text: "text-desert",
    dot: "hsl(4, 72%, 55%)",
  },
  moderate: {
    label: "Moderate",
    bg: "bg-warning/8",
    border: "border-warning/20",
    hoverBorder: "hover:border-warning/40",
    text: "text-warning",
    dot: "hsl(38, 92%, 50%)",
  },
  low: {
    label: "Low",
    bg: "bg-muted/50",
    border: "border-border",
    hoverBorder: "hover:border-muted-foreground/30",
    text: "text-muted-foreground",
    dot: "hsl(var(--muted-foreground))",
  },
};

const DesertsTab = ({ data }: DesertsTabProps) => {
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  // Group deserts by region for the overview
  const regionGroups = useMemo(() => {
    const map = new Map<string, Desert[]>();
    data.deserts.forEach((d) => {
      const list = map.get(d.region) || [];
      list.push(d);
      map.set(d.region, list);
    });
    return map;
  }, [data.deserts]);

  const regions = useMemo(() => [...regionGroups.keys()].sort(), [regionGroups]);

  const filtered = useMemo(() => {
    return data.deserts.filter((d) => {
      if (filterRegion !== "all" && d.region !== filterRegion) return false;
      if (filterSeverity !== "all" && d.severity !== filterSeverity) return false;
      return true;
    });
  }, [data.deserts, filterRegion, filterSeverity]);

  if (data.deserts.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Service Deserts Detected</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          All regions in your query appear to have coverage for the services available across the dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-help">
                Service Deserts Identified
              </h3>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              A service desert is a region where people cannot access a specific healthcare service because no facility in the area provides it.
            </TooltipContent>
          </Tooltip>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-desert/10 text-desert border border-desert/20">
            {data.deserts.length} gaps across {regionGroups.size} regions
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Regional summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {regions.map((region) => {
          const deserts = regionGroups.get(region) || [];
          const critCount = deserts.filter((d) => d.severity === "critical").length;
          const modCount = deserts.filter((d) => d.severity === "moderate").length;
          return (
            <button
              key={region}
              onClick={() => setFilterRegion(filterRegion === region ? "all" : region)}
              className={`rounded-xl p-3 text-left border transition-all duration-200 hover:scale-[1.02] ${
                filterRegion === region
                  ? "ring-2 ring-primary/40 border-primary/30"
                  : critCount > 0
                  ? "bg-desert/5 border-desert/15"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="text-sm font-medium text-foreground truncate">{region}</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[11px] text-muted-foreground">{deserts.length} gaps</span>
                {critCount > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
                    {critCount} critical
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Desert cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Search className="w-5 h-5 mx-auto mb-2 opacity-50" />
          No deserts match the current filters.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.slice(0, 50).map((desert, index) => {
            const config = severityConfig[desert.severity];
            return (
              <div
                key={`${desert.region}-${desert.service}`}
                className={`glass-card rounded-xl p-4 sm:p-5 ${config.border} ${config.hoverBorder} transition-colors duration-300`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${config.bg} border ${config.border} shrink-0`}>
                      <AlertCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.text}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground text-xs sm:text-sm truncate">
                        {desert.service} desert
                      </h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-[11px] sm:text-xs text-muted-foreground truncate">{desert.region}</span>
                        <span className="w-1 h-1 rounded-full bg-border shrink-0 hidden sm:block" />
                        <span className="text-[11px] sm:text-xs text-muted-foreground hidden sm:inline">{desert.facilityCount} facilities</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] sm:text-[10px] ${config.text} ${config.border} ${config.bg} shrink-0`}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                      style={{ background: config.dot }}
                    />
                    {config.label}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {desert.explanation}
                </p>
              </div>
            );
          })}
          {filtered.length > 50 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              Showing 50 of {filtered.length} service gaps. Use filters to narrow down.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DesertsTab;
