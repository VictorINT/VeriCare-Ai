import { supabase } from "./supabase";
import { lookupGhanaCoords } from "./ghanaCoordinates";
import type { AnalysisResponse, Facility, Desert, EvidenceItem, Citation } from "@/data/mockData";

interface HospitalRow {
  id: string;
  name: string;
  source_url: string | null;
  organization_info: Record<string, any> | null;
  location_info: Record<string, any> | null;
  contact_info: Record<string, any> | null;
  social_media_links: Record<string, any> | null;
  medical_details: Record<string, any> | null;
  description: string | null;
  mission_statement: string | null;
  organization_description: string | null;
  stats: Record<string, any> | null;
  reliability: string | null;
  reliability_reasons: any[] | null;
  client_capability: string | null;
  capability_reasons: any[] | null;
  created_at: string;
}

function parseJsonField(val: any): Record<string, any> {
  if (val === null || val === undefined) return {};
  if (typeof val === "object" && !Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "string") return JSON.parse(parsed); // double-encoded
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch { /* ignore */ }
  }
  return {};
}

function safeArr(val: any): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* not JSON, split by comma */ }
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function mapHospitalToFacility(h: HospitalRow): Facility {
  const loc = parseJsonField(h.location_info);
  const med = parseJsonField(h.medical_details);
  const org = parseJsonField(h.organization_info);

  let lat = Number(loc.latitude ?? loc.lat ?? 0);
  let lng = Number(loc.longitude ?? loc.lng ?? loc.lon ?? 0);

  // Fallback: lookup coordinates by city/region for Ghana facilities
  if (lat === 0 && lng === 0) {
    const city = String(loc.city ?? loc.town ?? "");
    const region = String(loc.state_or_region ?? loc.region ?? loc.state ?? "");
    const country = String(loc.country ?? loc.country_code ?? "");
    const coords = lookupGhanaCoords(city, region, country);
    if (coords) {
      // Add small random offset to prevent markers stacking
      lat = coords[0] + (Math.random() - 0.5) * 0.02;
      lng = coords[1] + (Math.random() - 0.5) * 0.02;
    }
  }

  const capabilities = safeArr(med.capabilities ?? med.services ?? med.specialties ?? []);
  const specialties = safeArr(med.specialties ?? med.departments ?? []);
  const procedures = safeArr(med.procedures ?? med.treatments ?? []);
  const equipment = safeArr(med.equipment ?? med.facilities ?? []);

  // Build anomalies from reliability info
  const anomalies: string[] = [];
  if (h.reliability && h.reliability.toLowerCase() !== "high" && h.reliability.toLowerCase() !== "verified") {
    const reasons = safeArr(h.reliability_reasons ?? []);
    if (reasons.length > 0) {
      reasons.forEach((r) => anomalies.push(r));
    } else {
      anomalies.push(`Reliability: ${h.reliability}`);
    }
  }

  // Build citations from source data
  const citations: Citation[] = [];
  if (h.description) {
    citations.push({ rowId: h.id.slice(0, 8), sourceColumn: "description", snippet: h.description.slice(0, 200) });
  }
  if (h.mission_statement) {
    citations.push({ rowId: h.id.slice(0, 8), sourceColumn: "mission_statement", snippet: h.mission_statement.slice(0, 200) });
  }
  if (h.source_url) {
    citations.push({ rowId: h.id.slice(0, 8), sourceColumn: "source_url", snippet: h.source_url });
  }

  return {
    id: h.id,
    name: h.name || "Unknown Facility",
    region: String(loc.state_or_region ?? loc.region ?? loc.state ?? loc.province ?? loc.country ?? "Unknown"),
    district: String(loc.district ?? loc.county ?? loc.city ?? ""),
    city: String(loc.city ?? loc.town ?? loc.address ?? ""),
    lat,
    lng,
    capabilities,
    specialties,
    procedures,
    equipment,
    anomalies,
    citations,
  };
}



// Human-readable labels for specialty keys
const SPECIALTY_LABELS: Record<string, string> = {
  internalMedicine: "General Medicine",
  emergencyMedicine: "Emergency Care",
  dentistry: "Dental Care",
  infectiousDiseases: "Infectious Disease Care",
  maternalFetalMedicineOrPerinatology: "Maternity / Perinatal Care",
  publicHealth: "Public Health",
  hospiceAndPalliativeInternalMedicine: "Palliative Care",
  globalHealthAndInternationalHealth: "Global Health",
  socialAndBehavioralSciences: "Behavioral Health",
  pediatrics: "Pediatrics",
  surgery: "Surgery",
  obstetrics: "Obstetrics / Maternity",
  imaging: "Imaging / Radiology",
};

function labelService(s: string): string {
  return SPECIALTY_LABELS[s] || s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function buildDeserts(facilities: Facility[]): Desert[] {
  // Group facilities by region
  const regionMap = new Map<string, Facility[]>();
  facilities.forEach((f) => {
    const key = f.region && f.region !== "Unknown" ? f.region : "Ghana";
    const list = regionMap.get(key) || [];
    list.push(f);
    regionMap.set(key, list);
  });

  // Pre-compute global service counts in a single pass
  const serviceCounts = new Map<string, number>();
  facilities.forEach((f) => {
    f.capabilities.forEach((c) => serviceCounts.set(c, (serviceCounts.get(c) || 0) + 1));
    f.specialties.forEach((s) => serviceCounts.set(s, (serviceCounts.get(s) || 0) + 1));
  });

  const allServices = [...serviceCounts.keys()];
  const deserts: Desert[] = [];

  regionMap.forEach((facs, region) => {
    const regionServices = new Set<string>();
    facs.forEach((f) => {
      f.capabilities.forEach((c) => regionServices.add(c));
      f.specialties.forEach((s) => regionServices.add(s));
    });

    for (const service of allServices) {
      if (regionServices.has(service)) continue;
      const globalCount = serviceCounts.get(service) || 0;
      if (globalCount < 2) continue;

      const severity: Desert["severity"] =
        globalCount >= 10 ? "critical" : globalCount >= 4 ? "moderate" : "low";

      deserts.push({
        region,
        service: labelService(service),
        facilityCount: facs.length,
        facilitiesWithService: 0,
        explanation: `${region} has ${facs.length} healthcare facilities but none offer ${labelService(service)}. ${globalCount} facilities in other regions provide this service.`,
        severity,
      });
    }
  });

  return deserts.sort((a, b) => {
    const sev = { critical: 0, moderate: 1, low: 2 };
    return sev[a.severity] - sev[b.severity] || a.region.localeCompare(b.region);
  });
}

function buildEvidence(facilities: Facility[]): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  facilities.forEach((f) => {
    if (f.anomalies.length > 0) {
      items.push({
        facilityName: f.name,
        snippet: f.citations[0]?.snippet || "No source data available",
        reasoning: f.anomalies[0],
        anomalyRule: "RELIABILITY_FLAG: Facility reliability flagged by data analysis",
      });
    } else if (f.citations.length > 0) {
      items.push({
        facilityName: f.name,
        snippet: f.citations[0]?.snippet || "",
        reasoning: "Facility data appears consistent and well-supported by available evidence.",
      });
    }
  });
  return items.slice(0, 20);
}

function buildResponse(
  facilities: Facility[],
  region?: string,
  capability?: string
): AnalysisResponse {
  // Client-side filters
  if (region && region !== "All Regions") {
    facilities = facilities.filter((f) =>
      f.region.toLowerCase().includes(region.toLowerCase())
    );
  }
  if (capability && capability !== "All") {
    facilities = facilities.filter((f) =>
      f.capabilities.some((c) => c.toLowerCase().includes(capability.toLowerCase()))
    );
  }

  const deserts = buildDeserts(facilities);
  const evidence = buildEvidence(facilities);
  const allCitations = facilities.flatMap((f) => f.citations);

  const verifiedCount = facilities.filter((f) => f.anomalies.length === 0).length;
  const anomalyCount = facilities.length - verifiedCount;

  const desertRegions = new Set(deserts.map((d) => d.region));
  const answer = facilities.length > 0
    ? `Found ${facilities.length} facilities. ${verifiedCount} are verified with consistent data. ${anomalyCount > 0 ? `${anomalyCount} have reliability flags. ` : ""}${deserts.length > 0 ? `${deserts.length} service gap(s) identified across ${desertRegions.size} region(s).` : "All regions appear to have adequate service coverage."}`
    : "No facilities matched your query. Try broadening your search terms.";

  return {
    answer,
    facilities,
    citations: allCitations.slice(0, 50),
    deserts,
    evidence,
  };
}

const FIRST_BATCH = 200;

export async function fetchHospitals(
  query?: string,
  region?: string,
  capability?: string,
  onPartial?: (data: AnalysisResponse) => void
): Promise<AnalysisResponse> {
  const buildQuery = () => {
    let q = supabase.from("hospitals").select("*");
    if (query && query.trim()) {
      q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }
    return q;
  };

  // Fast first batch
  const { data: firstData, error: firstError } = await buildQuery().range(0, FIRST_BATCH - 1);
  if (firstError) throw new Error(`Failed to fetch hospitals: ${firstError.message}`);

  const firstRows = (firstData || []) as HospitalRow[];
  let allFacilities = firstRows.map(mapHospitalToFacility);

  // Emit partial results immediately
  const partial = buildResponse([...allFacilities], region, capability);
  if (onPartial) onPartial(partial);

  // If first batch was full, load the rest in the background
  if (firstRows.length >= FIRST_BATCH) {
    const PAGE_SIZE = 1000;
    let from = FIRST_BATCH;
    while (true) {
      const { data, error: pageError } = await buildQuery().range(from, from + PAGE_SIZE - 1);
      if (pageError) break;
      if (!data || data.length === 0) break;
      const mapped = (data as HospitalRow[]).map(mapHospitalToFacility);
      allFacilities = allFacilities.concat(mapped);
      if (onPartial) onPartial(buildResponse([...allFacilities], region, capability));
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }

  return buildResponse(allFacilities, region, capability);
}
