import { Search, MapPin, ShieldCheck, FileText, ArrowRight, Building2, Globe, AlertTriangle, Heart } from "lucide-react";

interface EmptyStateProps {
  onExampleClick: (query: string) => void;
  onDirectSearch?: (region?: string, capability?: string) => void;
}

const steps = [
  { title: "Ask a question", description: "Type any question about healthcare access in plain English", icon: Search },
  { title: "Get verified answers", description: "The system checks every claim against real evidence from facility data", icon: ShieldCheck },
  { title: "Spot the gaps", description: "See which regions lack critical care — and where help is needed most", icon: MapPin },
];

const features = [
  { icon: Building2, title: "Facility Intelligence", description: "Understand what each health facility can actually deliver, backed by data — not just what they claim.", color: "primary" as const },
  { icon: AlertTriangle, title: "Anomaly Detection", description: "Automatically flag unreliable claims, like a clinic listing surgery without proper staff or equipment.", color: "warning" as const },
  { icon: Globe, title: "Medical Desert Mapping", description: "Identify entire regions where critical capabilities are missing so you can prioritize interventions.", color: "desert" as const },
  { icon: FileText, title: "Full Transparency", description: "Every result is traceable. See the exact source text, row IDs, and reasoning behind each finding.", color: "evidence" as const },
];

const exampleQueries = [
  { label: "All hospitals in Ashanti", description: "Browse every facility in the Ashanti region", region: "Ashanti", capability: "All" },
  { label: "Facilities with surgery", description: "Find hospitals that offer surgical services", region: "All Regions", capability: "surgery" },
  { label: "View all hospitals", description: "Load every healthcare facility across Ghana", region: "All Regions", capability: "All" },
];

const colorMap = {
  primary: { bg: "bg-primary/10", border: "border-primary/20", icon: "text-primary" },
  warning: { bg: "bg-warning/10", border: "border-warning/20", icon: "text-warning" },
  desert: { bg: "bg-desert/10", border: "border-desert/20", icon: "text-desert" },
  evidence: { bg: "bg-evidence/10", border: "border-evidence/20", icon: "text-evidence" },
};

const DiagonalDivider = ({ direction = "right", fromColor, toColor }: { direction?: "right" | "left"; fromColor: string; toColor: string }) => (
  <div className="relative h-20 -my-px" style={{ zIndex: 2 }}>
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
      <polygon
        points={direction === "right" ? "0,0 1440,40 1440,80 0,80" : "0,40 1440,0 1440,80 0,80"}
        fill={toColor}
      />
      <line
        x1={direction === "right" ? "0" : "0"}
        y1={direction === "right" ? "0" : "40"}
        x2={direction === "right" ? "1440" : "1440"}
        y2={direction === "right" ? "40" : "0"}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
    </svg>
  </div>
);

const EmptyState = ({ onExampleClick, onDirectSearch }: EmptyStateProps) => {
  return (
    <div className="animate-fade-in -mx-4 sm:-mx-6">

      {/* ── SECTION 1: How it works ── */}
      <section className="px-4 sm:px-6 pt-14 pb-20" style={{ background: "linear-gradient(180deg, hsl(225 25% 97%) 0%, hsl(230 22% 93%) 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-[11px] font-bold text-primary/60 uppercase tracking-[0.2em] text-center mb-2">
            How it works
          </h3>
          <p className="text-center text-muted-foreground text-sm mb-10 max-w-lg mx-auto">
            Three simple steps to uncover healthcare insights
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <div
                key={i}
                className="glass-card-elevated rounded-2xl p-6 text-center animate-fade-in-up relative group hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                  {i + 1}
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/8 border border-primary/12 mt-3 mb-4">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1.5 font-sans">{step.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden sm:block absolute -right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/25 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <DiagonalDivider direction="right" fromColor="hsl(230,22%,93%)" toColor="hsl(232,22%,90%)" />

      {/* ── SECTION 2: Try asking ── */}
      <section className="px-4 sm:px-6 py-16" style={{ background: "linear-gradient(180deg, hsl(232 22% 90%) 0%, hsl(228 20% 94%) 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-[11px] font-bold text-accent/70 uppercase tracking-[0.2em] text-center mb-2">
            Try asking
          </h3>
          <p className="text-center text-muted-foreground text-sm mb-10 max-w-lg mx-auto">
            Click any example below to fill the search and run your first analysis
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {exampleQueries.map((example, i) => (
              <button
                key={i}
                onClick={() => onDirectSearch?.(example.region, example.capability)}
                className="glass-card-elevated rounded-2xl p-5 text-left group hover:border-primary/30 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-xs font-bold gradient-text mb-2 block uppercase tracking-wider">{example.label}</span>
                <span className="text-sm text-foreground/80 leading-relaxed block mb-3">{example.description}</span>
                <span className="flex items-center gap-1.5 text-xs text-primary/50 group-hover:text-primary transition-colors duration-200 font-medium">
                  Click to try
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <DiagonalDivider direction="left" fromColor="hsl(228,20%,94%)" toColor="hsl(225,25%,97%)" />

      {/* ── SECTION 3: What you can discover ── */}
      <section className="px-4 sm:px-6 py-16" style={{ background: "linear-gradient(180deg, hsl(225 25% 97%) 0%, hsl(230 20% 94%) 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-[11px] font-bold text-primary/60 uppercase tracking-[0.2em] text-center mb-2">
            What you can discover
          </h3>
          <p className="text-center text-muted-foreground text-sm mb-10 max-w-lg mx-auto">
            Powerful capabilities designed for healthcare planners
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, i) => {
              const colors = colorMap[feature.color];
              return (
                <div
                  key={i}
                  className="glass-card-elevated rounded-2xl p-6 animate-fade-in-up hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex-shrink-0`}>
                      <feature.icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1 font-sans">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <DiagonalDivider direction="right" fromColor="hsl(230,20%,94%)" toColor="hsl(230,65%,18%)" />

      {/* ── SECTION 4: Stats bar (dark) ── */}
      <section className="px-4 sm:px-6 py-16 gradient-hero relative overflow-hidden">
        {/* Subtle dot overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Heart className="w-4 h-4 text-primary-foreground/60" />
            <span className="text-[11px] font-bold text-primary-foreground/50 uppercase tracking-[0.2em]">
              Data at a glance
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "247", label: "Facilities indexed" },
              { value: "5", label: "Regions covered" },
              { value: "12", label: "Capabilities tracked" },
              { value: "100%", label: "Evidence-backed" },
            ].map((stat, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="text-3xl font-bold text-primary-foreground font-serif">{stat.value}</div>
                <div className="text-[11px] text-primary-foreground/50 mt-1 font-medium tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmptyState;
