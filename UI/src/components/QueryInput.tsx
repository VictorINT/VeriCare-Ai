import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REGIONS, CAPABILITIES } from "@/data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QueryInputProps {
  onSubmit: (query: string, region: string, capability: string) => void;
  isLoading: boolean;
  externalQuery?: string;
}

const QueryInput = ({ onSubmit, isLoading, externalQuery }: QueryInputProps) => {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [capability, setCapability] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (externalQuery) setQuery(externalQuery);
  }, [externalQuery]);

  const handleSubmit = () => {
    if (!query.trim()) return;
    onSubmit(query, region, capability);
  };

  return (
    <div className={`glass-card-elevated rounded-2xl p-6 sm:p-8 animate-fade-in transition-shadow duration-500 ${isFocused ? "glow-ring-lg" : ""}`}>
      <div className="flex flex-col gap-5">
        {/* Input */}
        <div className="relative group">
          <div className={`absolute -inset-px rounded-xl bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 opacity-0 transition-opacity duration-300 blur-sm ${isFocused ? "opacity-100" : "group-hover:opacity-50"}`} />
          <div className="relative flex items-center">
            <Search className={`absolute left-4 w-5 h-5 transition-colors duration-200 ${isFocused ? "text-primary" : "text-muted-foreground"}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask a question about healthcare access…"
              className="w-full pl-12 pr-4 py-4 text-base rounded-xl border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200"
            />
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? "Hide filters" : "Show filters"}
          </button>

          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="px-6 py-2.5 rounded-xl gradient-primary border-0 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Analyzing…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Run Analysis
              </span>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-4 flex-wrap animate-fade-in pt-2 border-t border-border/50">
            <div className="flex flex-col gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="text-xs font-medium text-muted-foreground cursor-help">
                    Region
                  </label>
                </TooltipTrigger>
                <TooltipContent>Filter by geographic region</TooltipContent>
              </Tooltip>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-[180px] bg-background/80 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover rounded-lg">
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="text-xs font-medium text-muted-foreground cursor-help">
                    Capability
                  </label>
                </TooltipTrigger>
                <TooltipContent>A medical service a facility can provide</TooltipContent>
              </Tooltip>
              <Select value={capability} onValueChange={setCapability}>
                <SelectTrigger className="w-[180px] bg-background/80 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover rounded-lg">
                  <SelectItem value="All">All Capabilities</SelectItem>
                  {CAPABILITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Example queries */}
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          "Hospitals without emergency care",
          "Facilities with maternity services",
          "Clinics in Northern region",
        ].map((example) => (
          <button
            key={example}
            onClick={() => setQuery(example)}
            className="text-xs px-3.5 py-2 rounded-full border border-border/60 bg-background/60 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QueryInput;
