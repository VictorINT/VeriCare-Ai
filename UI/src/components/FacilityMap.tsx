import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResponse } from "@/data/mockData";
import ghanaGeoJSON from "@/data/ghana-regions.json";
import "leaflet/dist/leaflet.css";

interface FacilityMapProps {
  data: AnalysisResponse;
}

// ── Fit map bounds to GeoJSON ──
const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30], maxZoom: 8 });
    }
  }, [positions, map]);
  return null;
};

// ── Normalize region names for matching ──
function normalizeRegion(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*region\s*/g, "")
    .replace(/[^a-z ]/g, "")
    .trim();
}

// ── Color interpolation: score 0→red, 0.5→yellow, 1→green ──
function coverageColor(score: number): string {
  const clamped = Math.max(0, Math.min(1, score));
  // Red (0,72%,50%) → Yellow (45,92%,55%) → Green (130,55%,45%)
  if (clamped <= 0.5) {
    const t = clamped / 0.5;
    const h = 0 + t * 45;
    const s = 72 + t * 20;
    const l = 50 + t * 5;
    return `hsl(${h}, ${s}%, ${l}%)`;
  } else {
    const t = (clamped - 0.5) / 0.5;
    const h = 45 + t * 85;
    const s = 92 - t * 37;
    const l = 55 - t * 10;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
}

const FacilityMap = ({ data }: FacilityMapProps) => {
  // ── Collect all services globally ──
  const allServices = useMemo(() => {
    const set = new Set<string>();
    data.facilities.forEach((f) => {
      f.capabilities.forEach((c) => set.add(c));
      f.specialties.forEach((s) => set.add(s));
    });
    return set;
  }, [data.facilities]);

  // ── Group facilities by normalized region ──
  const regionFacilities = useMemo(() => {
    const map = new Map<string, typeof data.facilities>();
    data.facilities.forEach((f) => {
      const key = normalizeRegion(f.region);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    });
    return map;
  }, [data.facilities]);

  // ── Compute coverage score per region, then normalize to 0-1 relative scale ──
  const regionScores = useMemo(() => {
    const rawScores = new Map<string, number>();
    const totalServices = allServices.size;
    if (totalServices === 0) return rawScores;

    // Score regions that have facilities
    regionFacilities.forEach((facs, regionKey) => {
      const regionServices = new Set<string>();
      facs.forEach((f) => {
        f.capabilities.forEach((c) => regionServices.add(c));
        f.specialties.forEach((s) => regionServices.add(s));
      });
      rawScores.set(regionKey, regionServices.size / totalServices);
    });

    // Also include GeoJSON regions with no facilities as score 0
    const geoFeatures = (ghanaGeoJSON as any)?.features || [];
    for (const feature of geoFeatures) {
      const key = normalizeRegion(feature?.properties?.shapeName || "");
      if (!key) continue;
      // Check if any rawScore key matches
      const hasMatch = [...rawScores.keys()].some(
        (rKey) => key.includes(rKey) || rKey.includes(key)
      );
      if (!hasMatch) rawScores.set(key, 0);
    }

    // Normalize: best region = 1, worst = 0
    const values = [...rawScores.values()];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const normalized = new Map<string, number>();
    rawScores.forEach((score, key) => {
      normalized.set(key, (score - min) / range);
    });
    return normalized;
  }, [regionFacilities, allServices]);

  // ── Match GeoJSON shapeName to facility region key ──
  const getScore = (shapeName: string): number => {
    const key = normalizeRegion(shapeName);
    if (regionScores.has(key)) return regionScores.get(key)!;
    for (const [rKey, score] of regionScores) {
      if (key.includes(rKey) || rKey.includes(key)) return score;
    }
    // Unmatched region — use lowest score (fully red)
    const values = [...regionScores.values()];
    return values.length > 0 ? Math.min(...values) : 0;
  };

  // ── Positions for fitting bounds ──
  const positions = useMemo(
    () => data.facilities.map((f) => [f.lat, f.lng] as [number, number]),
    [data.facilities]
  );

  const center: [number, number] = [7.9, -1.0]; // Ghana center

  // ── GeoJSON style function ──
  const regionStyle = (feature: any) => {
    const name = feature?.properties?.shapeName || "";
    const score = getScore(name);
    return {
      fillColor: coverageColor(score),
      fillOpacity: 0.55,
      color: "hsl(var(--foreground) / 0.25)",
      weight: 1.5,
    };
  };

  // ── Popup for each region polygon ──
  const onEachFeature = (feature: any, layer: any) => {
    const name = feature?.properties?.shapeName || "Unknown";
    const score = getScore(name);
    const key = normalizeRegion(name);
    const facs = regionFacilities.get(key) ||
      [...regionFacilities].find(([k]) => key.includes(k) || k.includes(key))?.[1] || [];
    const regionServices = new Set<string>();
    facs.forEach((f: any) => {
      f.capabilities.forEach((c: string) => regionServices.add(c));
      f.specialties.forEach((s: string) => regionServices.add(s));
    });
    const missing = [...allServices].filter((s) => !regionServices.has(s));

    layer.bindPopup(`
      <div style="min-width:180px">
        <strong style="font-size:13px">${name}</strong>
        <div style="margin:4px 0;font-size:11px;color:#666">
          ${facs.length} facilities · ${regionServices.size}/${allServices.size} services covered
        </div>
        <div style="height:6px;border-radius:3px;background:#eee;margin:6px 0">
          <div style="height:100%;width:${Math.round(score * 100)}%;border-radius:3px;background:${coverageColor(score)}"></div>
        </div>
        ${missing.length > 0
          ? `<div style="font-size:10px;color:#c00;margin-top:4px">Missing: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` +${missing.length - 5} more` : ""}</div>`
          : `<div style="font-size:10px;color:#2a7;margin-top:4px">All services covered ✓</div>`
        }
      </div>
    `);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        Regions are shaded by service coverage —{" "}
        <span className="font-medium" style={{ color: coverageColor(1) }}>green</span> means
        most services are available,{" "}
        <span className="font-medium" style={{ color: coverageColor(0) }}>red</span> indicates
        many service gaps. Click a region for details.
      </p>

      <div className="rounded-xl border overflow-hidden card-elevated" style={{ height: 480 }}>
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Choropleth regions */}
          <GeoJSON
            data={ghanaGeoJSON as any}
            style={regionStyle}
            onEachFeature={onEachFeature}
          />

          <FitBounds positions={positions} />

          {/* Hospital markers — simple neutral dots */}
          {data.facilities.map((facility) => (
            <CircleMarker
              key={facility.id}
              center={[facility.lat, facility.lng]}
              radius={4}
              pathOptions={{
                color: "hsl(220, 20%, 30%)",
                fillColor: "hsl(220, 20%, 95%)",
                fillOpacity: 0.9,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <strong className="text-sm">{facility.name}</strong>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {facility.city}, {facility.region}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {facility.capabilities.slice(0, 6).map((c) => (
                      <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Gradient legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Coverage:</span>
        <div className="flex items-center gap-1.5">
          <span style={{ color: coverageColor(0) }}>● Few services</span>
          <div
            className="h-2.5 rounded-full"
            style={{
              width: 120,
              background: `linear-gradient(to right, ${coverageColor(0)}, ${coverageColor(0.5)}, ${coverageColor(1)})`,
            }}
          />
          <span style={{ color: coverageColor(1) }}>● Most services</span>
        </div>
        <span className="ml-4">○ Hospital</span>
      </div>
    </div>
  );
};

export default FacilityMap;
