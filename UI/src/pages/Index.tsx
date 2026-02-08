import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, MapPin, FileSearch, Map, Loader2, Heart, Activity, Building2 } from "lucide-react";
import { toast } from "sonner";
import QueryInput from "@/components/QueryInput";
import ResultsTab from "@/components/ResultsTab";
import DesertsTab from "@/components/DesertsTab";
import EvidenceTab from "@/components/EvidenceTab";
import FacilityMap from "@/components/FacilityMap";
import EmptyState from "@/components/EmptyState";
import { fetchHospitals } from "@/lib/hospitalService";
import type { AnalysisResponse } from "@/data/mockData";

const Index = () => {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [externalQuery, setExternalQuery] = useState("");

  const handleSubmit = async (query: string, region: string, capability: string) => {
    setIsLoading(true);
    setData(null);
    try {
      const result = await fetchHospitals(query, region, capability, (partial) => {
        setData(partial);
        setIsLoading(false);
      });
      setData(result);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAll = async () => {
    setIsLoading(true);
    setData(null);
    try {
      const result = await fetchHospitals(undefined, undefined, undefined, (partial) => {
        setData(partial);
        setIsLoading(false);
      });
      setData(result);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero header with diagonal bottom ── */}
      <section className="gradient-hero relative overflow-hidden pb-24">
        {/* Dot overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none" style={{
          background: "radial-gradient(ellipse, hsl(260 55% 58% / 0.15) 0%, transparent 70%)",
        }} />

        <div className="container mx-auto px-4 sm:px-6 pt-10 pb-2 relative z-10">
          {/* Brand mark */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="relative">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                <Activity className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-xs font-medium text-primary-foreground/40 uppercase tracking-[0.15em]">Virtue Foundation</span>
          </div>

          {/* Title */}
          <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-primary-foreground leading-tight mb-4">
              Healthcare Capability
              <span className="block text-primary-foreground/70">Intelligence</span>
            </h1>
            <p className="text-primary-foreground/50 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              Ask questions in plain English. Verify facility claims against real evidence.
              Identify where care is missing — fast.
            </p>
          </div>

          {/* Search input */}
          <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <QueryInput onSubmit={handleSubmit} isLoading={isLoading} externalQuery={externalQuery} />
            <button
              onClick={handleViewAll}
              disabled={isLoading}
              className="mt-4 mx-auto flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 font-medium disabled:opacity-50"
            >
              <Building2 className="w-4 h-4" />
              View all hospitals
            </button>
          </div>
        </div>

        {/* Diagonal bottom edge */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ zIndex: 2 }}>
          <polygon points="0,30 1440,60 1440,60 0,60" fill="hsl(225, 25%, 97%)" />
          <line x1="0" y1="30" x2="1440" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </svg>
      </section>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-glow-pulse">
            <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Analyzing healthcare data</p>
            <p className="text-xs text-muted-foreground mt-1">Scanning facilities across regions…</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {data && !isLoading && (
        <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl animate-fade-in">
          <Tabs defaultValue="results">
            <TabsList className="w-full justify-start bg-card glass-card p-1 rounded-xl mb-6 sm:mb-8 gap-0.5 sm:gap-1 overflow-x-auto">
              <TabsTrigger value="results" className="gap-1 sm:gap-1.5 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Results
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1 sm:gap-1.5 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200">
                <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Map
              </TabsTrigger>
              <TabsTrigger value="deserts" className="gap-1 sm:gap-1.5 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Deserts
              </TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1 sm:gap-1.5 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200">
                <FileSearch className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Evidence
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results"><ResultsTab data={data} /></TabsContent>
            <TabsContent value="map"><FacilityMap data={data} /></TabsContent>
            <TabsContent value="deserts"><DesertsTab data={data} /></TabsContent>
            <TabsContent value="evidence"><EvidenceTab data={data} /></TabsContent>
          </Tabs>
        </div>
      )}

      {/* ── Empty state sections ── */}
      {!data && !isLoading && (
        <EmptyState onExampleClick={(q) => setExternalQuery(q)} />
      )}

      {/* ── Footer ── */}
      {(data || isLoading) && (
        <footer className="relative mt-16">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Bridging Medical Deserts — <span className="font-medium">Virtue Foundation</span> · Hackathon 2025
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Index;
