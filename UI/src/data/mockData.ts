export interface Facility {
  id: string;
  name: string;
  region: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  capabilities: string[];
  specialties: string[];
  procedures: string[];
  equipment: string[];
  anomalies: string[];
  citations: Citation[];
}

export interface Citation {
  rowId: string;
  sourceColumn: string;
  snippet: string;
}

export interface Desert {
  region: string;
  service: string;
  nearestFacilityName?: string;
  nearestFacilityDistance?: string;
  facilityCount: number;
  facilitiesWithService: number;
  explanation: string;
  severity: "critical" | "moderate" | "low";
}

export interface EvidenceItem {
  facilityName: string;
  snippet: string;
  reasoning: string;
  anomalyRule?: string;
}

export interface AnalysisResponse {
  answer: string;
  facilities: Facility[];
  citations: Citation[];
  deserts: Desert[];
  evidence: EvidenceItem[];
}

export const REGIONS = [
  "All Regions",
  "Northern Region",
  "Central Region",
  "Southern Region",
  "Eastern Region",
  "Western Region",
];

export const CAPABILITIES = [
  "Emergency",
  "Obstetrics",
  "Pediatrics",
  "Surgery",
  "Imaging",
];

export const mockResponse: AnalysisResponse = {
  answer:
    "Based on analysis of 247 facilities across 5 regions, 3 regions lack verified emergency obstetric care. The Northern and Eastern regions have the most significant gaps, with no facilities providing evidence-backed emergency services. The Southern Region has partial coverage with 2 verified facilities.",
  facilities: [
    {
      id: "f1",
      name: "St. Mary's Regional Hospital",
      region: "Central Region",
      district: "Kumasi Metro",
      city: "Kumasi",
      lat: 6.6885,
      lng: -1.6244,
      capabilities: ["Emergency", "Obstetrics", "Surgery", "Imaging"],
      specialties: ["General Surgery", "Maternal Health", "Radiology"],
      procedures: ["C-Section", "Blood Transfusion", "X-Ray", "Ultrasound"],
      equipment: ["Ultrasound Machine", "X-Ray Unit", "Ventilator", "Defibrillator"],
      anomalies: [],
      citations: [
        { rowId: "R-1042", sourceColumn: "services_offered", snippet: "Emergency obstetric care including cesarean section available 24/7" },
        { rowId: "R-1043", sourceColumn: "equipment_list", snippet: "Ultrasound, X-Ray, ventilator support available" },
      ],
    },
    {
      id: "f2",
      name: "Hope Community Clinic",
      region: "Northern Region",
      district: "Tamale Metro",
      city: "Tamale",
      lat: 9.4008,
      lng: -0.8393,
      capabilities: ["Emergency", "Pediatrics"],
      specialties: ["Pediatrics"],
      procedures: ["Basic Emergency Care", "Immunization"],
      equipment: ["Basic Diagnostic Kit"],
      anomalies: [
        "Claims emergency capability but no supporting procedures for trauma or surgical intervention found",
      ],
      citations: [
        { rowId: "R-2071", sourceColumn: "facility_type", snippet: "Community health center with emergency services" },
        { rowId: "R-2072", sourceColumn: "services_offered", snippet: "Pediatric immunization and basic care" },
      ],
    },
    {
      id: "f3",
      name: "Eastern District Hospital",
      region: "Eastern Region",
      district: "Koforidua Municipal",
      city: "Koforidua",
      lat: 6.0940,
      lng: -0.2572,
      capabilities: ["Surgery", "Imaging"],
      specialties: ["Orthopedics"],
      procedures: ["Fracture Management", "X-Ray"],
      equipment: ["X-Ray Unit", "Surgical Kit"],
      anomalies: [
        "Claims surgery but no anesthesia equipment or personnel documented",
      ],
      citations: [
        { rowId: "R-3015", sourceColumn: "services_offered", snippet: "Surgical services for fractures and orthopedic conditions" },
        { rowId: "R-3016", sourceColumn: "staff_list", snippet: "2 general practitioners, 4 nurses" },
      ],
    },
    {
      id: "f4",
      name: "Grace Maternity Center",
      region: "Southern Region",
      district: "Cape Coast Metro",
      city: "Cape Coast",
      lat: 5.1036,
      lng: -1.2466,
      capabilities: ["Obstetrics"],
      specialties: ["Maternal Health", "Neonatal Care"],
      procedures: ["Normal Delivery", "Prenatal Screening", "Neonatal Resuscitation"],
      equipment: ["Fetal Monitor", "Delivery Kit", "Infant Warmer"],
      anomalies: [],
      citations: [
        { rowId: "R-4088", sourceColumn: "services_offered", snippet: "Full maternity services including prenatal, delivery, and postnatal care" },
        { rowId: "R-4089", sourceColumn: "equipment_list", snippet: "Fetal heart monitor, infant warmer, delivery kits" },
      ],
    },
  ],
  citations: [
    { rowId: "R-1042", sourceColumn: "services_offered", snippet: "Emergency obstetric care including cesarean section available 24/7" },
    { rowId: "R-2071", sourceColumn: "facility_type", snippet: "Community health center with emergency services" },
    { rowId: "R-3015", sourceColumn: "services_offered", snippet: "Surgical services for fractures and orthopedic conditions" },
    { rowId: "R-4088", sourceColumn: "services_offered", snippet: "Full maternity services including prenatal, delivery, and postnatal care" },
  ],
  deserts: [
    {
      region: "Northern Region",
      service: "Emergency Care",
      facilityCount: 34,
      facilitiesWithService: 0,
      explanation: "Northern Region has 34 healthcare facilities but none offer Emergency Care. 12 facilities in other regions provide this service.",
      severity: "critical",
    },
    {
      region: "Northern Region",
      service: "Obstetrics / Maternity",
      facilityCount: 34,
      facilitiesWithService: 0,
      explanation: "Northern Region has 34 healthcare facilities but none offer Obstetrics / Maternity. 8 facilities in other regions provide this service.",
      severity: "critical",
    },
    {
      region: "Eastern Region",
      service: "Emergency Care",
      facilityCount: 41,
      facilitiesWithService: 0,
      explanation: "Eastern Region has 41 healthcare facilities but none offer Emergency Care. 12 facilities in other regions provide this service.",
      severity: "critical",
    },
  ],
  evidence: [
    {
      facilityName: "Hope Community Clinic",
      snippet: "Community health center with emergency services",
      reasoning: "Facility self-reports emergency capability in facility_type field, but the services_offered column only lists immunization and basic pediatric care. No trauma, surgical, or obstetric procedures are documented.",
      anomalyRule: "CAPABILITY_MISMATCH: Claimed capability lacks supporting procedures",
    },
    {
      facilityName: "Eastern District Hospital",
      snippet: "Surgical services for fractures and orthopedic conditions",
      reasoning: "Facility lists surgery as a capability and describes orthopedic procedures, but staff_list shows no surgeons or anesthetists, and equipment_list has no anesthesia machines.",
      anomalyRule: "RESOURCE_GAP: Claimed service lacks required personnel or equipment",
    },
    {
      facilityName: "St. Mary's Regional Hospital",
      snippet: "Emergency obstetric care including cesarean section available 24/7",
      reasoning: "Facility claim is well-supported. services_offered confirms 24/7 emergency obstetric care, equipment_list includes relevant devices, and staff records show qualified personnel.",
    },
  ],
  
};
