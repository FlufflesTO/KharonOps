export interface ServiceProfile {
  slug: string;
  group: "Fire Systems" | "Security Systems" | "Maintenance & Repairs" | "Documentation & Compliance";
  navLabel: string;
  title: string;
  summary: string;
  audience: string;
  standards: string[];
  environments: string[];
  scope: string[];
  deliverables: string[];
  questions: string[];
  ctaLabel: string;
}

export interface IndustryProfile {
  slug: string;
  title: string;
  summary: string;
  commonNeeds: string[];
  relatedServices: string[];
}

export interface CaseStudy {
  slug: string;
  title: string;
  siteType: string;
  challenge: string;
  scope: string[];
  result: string;
  documents: string[];
}

export const companyProfile = {
  legalName: "Kharon Fire and Security Solutions",
  established: "2016",
  registration: "2016/313076/07",
  address: "Unit 58, M5 Freeway Park, Cnr Uppercamp and Berkley Rd, Ndabeni, Maitland, 7405",
  phone: "061 545 8830",
  email: "admin@kharon.co.za",
  officeHours: "08:00 to 17:00 (Mon to Fri)",
  serviceFootprint: ["Cape Town", "Botswana", "Malawi"]
} as const;

export const trustSignals = [
  "Since 2016",
  "Cape Town, Botswana, Malawi",
  "Fire, suppression, access control, CCTV",
  "Inspection-ready reporting"
];

export const standards = ["SANS 10139", "SANS 14520", "SANS 10400", "SANS 322", "SANS 24714", "SANS 10142-1"];

export const partnerLogos = ["Apollo", "Ziton", "Impro", "Hikvision", "Dahua", "Paxton"];

export const services: ServiceProfile[] = [
  {
    slug: "fire-detection-alarm",
    group: "Fire Systems",
    navLabel: "Fire Detection and Alarm",
    title: "Fire Detection and Alarm Systems",
    summary: "Fire alarm systems that help people leave quickly, protect buildings, and keep service records clear.",
    audience: "Commercial buildings, schools, healthcare sites, and industrial facilities.",
    standards: ["SANS 10139", "SANS 10400"],
    environments: ["Commercial buildings", "Industrial facilities", "Healthcare", "Education campuses"],
    scope: [
      "System design and device scheduling",
      "New installation and expansion work",
      "Panel programming and cause-and-effect logic",
      "Routine inspection, testing, and fault finding",
      "Corrective works and post-service verification"
    ],
    deliverables: [
      "Service report with findings and actions",
      "Updated asset and test history",
      "As-built markups where changes were made",
      "Clear next-step recommendations"
    ],
    questions: [
      "Does the site need a new system or a repair to the current one?",
      "Are there known alarm faults, false activations, or missing records?",
      "Do you need maintenance, inspection, or full replacement scope?"
    ],
    ctaLabel: "Book fire system assessment"
  },
  {
    slug: "gaseous-suppression",
    group: "Fire Systems",
    navLabel: "Gaseous Suppression",
    title: "Gaseous Suppression Systems",
    summary: "Non-water suppression for server rooms, archives, and technical spaces where downtime matters.",
    audience: "Data rooms, archives, control rooms, and other special-risk areas.",
    standards: ["SANS 14520", "SANS 10400"],
    environments: ["Server rooms", "Data centers", "Archive rooms", "Control rooms"],
    scope: [
      "Suppression design review and calculations",
      "Cylinder, manifold, and nozzle installation",
      "Pre-discharge logic verification",
      "Room integrity and leakage checks",
      "Recharge planning and annual service"
    ],
    deliverables: [
      "Integrity test result pack",
      "Commissioning certificates",
      "Pre-discharge verification report",
      "Maintenance action register"
    ],
    questions: [
      "Is the room sealed well enough for the system to perform as intended?",
      "Does the control sequence still match the installed equipment?",
      "Do you need an upgrade, test, or annual maintenance visit?"
    ],
    ctaLabel: "Request suppression survey"
  },
  {
    slug: "access-control",
    group: "Security Systems",
    navLabel: "Access Control",
    title: "Access Control Systems",
    summary: "Access control for staff, visitors, and secure areas with simple day-to-day operation.",
    audience: "Offices, campuses, estates, industrial sites, and multi-tenant buildings.",
    standards: ["SANS 24714", "SANS 10142-1"],
    environments: ["Corporate sites", "Industrial zones", "Residential estates", "Education campuses"],
    scope: [
      "Controller and reader architecture",
      "Card, biometric, and visitor access workflows",
      "Turnstile and boom integration",
      "Fire alarm fail-safe linkage",
      "User setup, training, and reporting"
    ],
    deliverables: [
      "Access matrix configuration record",
      "Event log and exception summary",
      "Emergency egress integration checklist",
      "Handover and operator training notes"
    ],
    questions: [
      "Do staff, visitors, and restricted areas need different access rules?",
      "Should the system link to fire safety or other building controls?",
      "Do you need a new install or a cleaner, better-managed setup?"
    ],
    ctaLabel: "Plan access control"
  },
  {
    slug: "cctv-surveillance",
    group: "Security Systems",
    navLabel: "CCTV and Surveillance",
    title: "CCTV and Surveillance Systems",
    summary: "CCTV systems that make incidents easier to review and give you clearer site visibility.",
    audience: "Retail, commercial, industrial, and multi-site environments.",
    standards: ["SANS 10142-1", "Site security policy alignment"],
    environments: ["Retail and commercial", "Industrial yards", "Perimeter zones", "Multi-site portfolios"],
    scope: [
      "Coverage design and camera placement",
      "Camera and network installation",
      "Recorder setup and retention policy",
      "Remote health checks and fault response",
      "Incident export and evidence handling"
    ],
    deliverables: [
      "Camera placement and coverage diagram",
      "Retention and export guidance",
      "Health-check service report",
      "Incident retrieval notes"
    ],
    questions: [
      "Do you need clearer coverage, better recording, or a replacement system?",
      "Are there blind spots, poor image quality, or storage concerns?",
      "Will the system be used for incidents, operations, or both?"
    ],
    ctaLabel: "Design CCTV scope"
  },
  {
    slug: "integrated-security",
    group: "Security Systems",
    navLabel: "Integrated Security Systems",
    title: "Integrated Security Systems",
    summary: "Joined-up fire, access, and video systems for sites that want one coherent setup.",
    audience: "Multi-site operations, mixed-use facilities, and higher-risk infrastructure.",
    standards: ["SANS 10139", "SANS 24714", "SANS 10142-1"],
    environments: ["Multi-site operations", "Mixed-use facilities", "High-risk infrastructure"],
    scope: [
      "System architecture and integration planning",
      "Cross-platform alarm workflows",
      "Operator workflow design",
      "Lifecycle maintenance planning",
      "Documentation and service governance"
    ],
    deliverables: [
      "Integrated design baseline",
      "Commissioning and integration test pack",
      "Operational runbook",
      "Governance reporting structure"
    ],
    questions: [
      "Do multiple systems need to talk to each other more clearly?",
      "Is the issue design, maintenance, or operator workflow?",
      "Do you want one accountable delivery path for the whole site?"
    ],
    ctaLabel: "Scope integrated solution"
  },
  {
    slug: "planned-maintenance",
    group: "Maintenance & Repairs",
    navLabel: "Planned Maintenance",
    title: "Planned Preventative Maintenance",
    summary: "Scheduled maintenance that keeps systems reliable, understood, and ready for inspection.",
    audience: "Commercial portfolios, industrial plants, healthcare, and hospitality sites.",
    standards: ["SANS 10139", "SANS 14520", "Client compliance policies"],
    environments: ["Commercial portfolios", "Industrial plants", "Hospitality", "Healthcare"],
    scope: [
      "Asset register alignment and scheduling",
      "Routine inspections and testing",
      "Defect detection and severity grading",
      "Rectification planning and verification",
      "Clear maintenance history"
    ],
    deliverables: [
      "Planned maintenance report",
      "Fault and risk register",
      "Rectification quotation support",
      "Management summary for stakeholders"
    ],
    questions: [
      "Do you need a one-off visit or an ongoing maintenance plan?",
      "Are service dates, reports, and asset records getting harder to track?",
      "Do you need a maintenance partner who can also fix the faults found?"
    ],
    ctaLabel: "Start maintenance plan"
  },
  {
    slug: "callouts-break-fix",
    group: "Maintenance & Repairs",
    navLabel: "Emergency Repairs",
    title: "Emergency Repairs and Callouts",
    summary: "Fast response for faults and outages with clear diagnosis, restoration, and closeout.",
    audience: "Live operational sites, 24/7 facilities, and critical rooms.",
    standards: ["Site emergency protocols", "Applicable SANS controls"],
    environments: ["Live operational facilities", "24/7 sites", "Critical rooms"],
    scope: [
      "Emergency triage and dispatch",
      "On-site fault diagnosis",
      "Temporary and permanent restoration",
      "Post-incident root-cause summary",
      "Follow-up maintenance recommendations"
    ],
    deliverables: [
      "Callout report and incident timeline",
      "Parts and labour summary",
      "Root-cause and recurrence notes",
      "Recommended next-step actions"
    ],
    questions: [
      "Is this an active fault or a recurring issue that needs root-cause work?",
      "Does the site need a temporary fix, a permanent repair, or both?",
      "How quickly does the system need to be back in service?"
    ],
    ctaLabel: "Request urgent callout"
  },
  {
    slug: "compliance-reporting",
    group: "Documentation & Compliance",
    navLabel: "Compliance Documents",
    title: "Documentation and Compliance Support",
    summary: "Clear service records, certificates, and maintenance documentation ready when you need them.",
    audience: "Audits, insurance reviews, handover packs, and leadership reporting.",
    standards: ["SANS 10139", "SANS 10400", "Client governance requirements"],
    environments: ["Audit cycles", "Insurance reviews", "Regulatory inspections"],
    scope: [
      "Service certificate preparation",
      "Maintenance logs and test records",
      "As-built and O and M handover packs",
      "Gap analysis and remediation tracking",
      "Portfolio reporting for leadership reviews"
    ],
    deliverables: [
      "Inspection-ready document pack",
      "Compliance status summary",
      "Remediation action tracker",
      "Signed closeout package"
    ],
    questions: [
      "Do you need a document pack for an audit, insurer, or handover?",
      "Are service records spread across teams or contractors?",
      "Do you need support keeping the evidence trail tidy?"
    ],
    ctaLabel: "Prepare documentation pack"
  }
];

export const serviceGroups = [
  {
    title: "Fire Systems",
    summary: "Detection and suppression work for buildings and special-risk spaces.",
    items: services.filter((service) => service.group === "Fire Systems")
  },
  {
    title: "Security Systems",
    summary: "Access and video systems that make sites easier to manage and review.",
    items: services.filter((service) => service.group === "Security Systems")
  },
  {
    title: "Maintenance & Repairs",
    summary: "Planned visits and fast fault response when something stops working.",
    items: services.filter((service) => service.group === "Maintenance & Repairs")
  },
  {
    title: "Documentation & Compliance",
    summary: "Service records, certificates, and closeout packs for decision-makers.",
    items: services.filter((service) => service.group === "Documentation & Compliance")
  }
] as const;

export const industries: IndustryProfile[] = [
  {
    slug: "commercial-buildings",
    title: "Commercial Buildings",
    summary: "Fire and security support for offices, mixed-use buildings, and managed commercial portfolios.",
    commonNeeds: ["Tenant safety", "Simple access control", "Inspection-ready maintenance"],
    relatedServices: ["fire-detection-alarm", "access-control", "cctv-surveillance", "planned-maintenance"]
  },
  {
    slug: "industrial-facilities",
    title: "Industrial Facilities",
    summary: "Reliable protection for plants, warehouses, logistics sites, and high-risk production areas.",
    commonNeeds: ["High-uptime systems", "Perimeter visibility", "Fast fault recovery"],
    relatedServices: ["fire-detection-alarm", "gaseous-suppression", "cctv-surveillance", "callouts-break-fix"]
  },
  {
    slug: "data-server-rooms",
    title: "Data and Server Rooms",
    summary: "Special-risk protection for digital infrastructure where downtime is expensive.",
    commonNeeds: ["Suppression integrity", "Room testing", "Clear records"],
    relatedServices: ["gaseous-suppression", "planned-maintenance", "compliance-reporting"]
  },
  {
    slug: "hospitality",
    title: "Hospitality",
    summary: "Discreet fire and security support for hotels, lodges, restaurants, and tourism portfolios.",
    commonNeeds: ["Guest safety", "Unobtrusive access", "Quick service response"],
    relatedServices: ["fire-detection-alarm", "cctv-surveillance", "planned-maintenance"]
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    summary: "Fire and security services for hospitals, clinics, and medical campuses with strict continuity needs.",
    commonNeeds: ["Life-safety continuity", "Controlled access", "Auditable service records"],
    relatedServices: ["fire-detection-alarm", "access-control", "planned-maintenance", "compliance-reporting"]
  },
  {
    slug: "education",
    title: "Education",
    summary: "Scalable support for schools, colleges, and campuses balancing safety and practicality.",
    commonNeeds: ["Campus safety", "Multi-building control", "Regular servicing"],
    relatedServices: ["fire-detection-alarm", "access-control", "planned-maintenance"]
  }
];

export const sectors = industries;

export const compliancePillars = [
  {
    title: "Clear service records",
    detail: "Service notes, certificates, and test results are kept in a format that is easy to follow later."
  },
  {
    title: "Useful handover packs",
    detail: "As-builts, O and M notes, and closeout documents are organised so the next team can act on them."
  },
  {
    title: "Practical standards support",
    detail: "Relevant standards stay visible, but they do not get in the way of simple decision-making."
  },
  {
    title: "Easy follow-up",
    detail: "When something needs attention, the next step is documented clearly and assigned cleanly."
  }
];

export const caseStudies: CaseStudy[] = [
  {
    slug: "industrial-fire-audit",
    title: "Industrial Fire Audit Program",
    siteType: "Industrial estate",
    challenge: "The client had fragmented fire test history and inconsistent recordkeeping across teams.",
    scope: [
      "Reviewed the site against the fire-system baseline",
      "Rebuilt the asset and service history trail",
      "Set out a practical remediation order"
    ],
    result: "The client moved from scattered evidence to a single, inspection-ready record set with clear ownership.",
    documents: ["Audit pack", "Defect register", "Management summary"]
  },
  {
    slug: "server-room-suppression-upgrade",
    title: "Server Room Suppression Upgrade",
    siteType: "Mission-critical data environment",
    challenge: "The room had uncertain retention performance and incomplete suppression documentation.",
    scope: [
      "Upgraded the suppression configuration",
      "Completed room integrity testing",
      "Verified the discharge logic and alarm interface"
    ],
    result: "The site team received validated performance, better confidence, and a complete commissioning dossier.",
    documents: ["Integrity test certificate", "Verification report", "Service handover pack"]
  },
  {
    slug: "multi-site-security-rollout",
    title: "Multi-Site Access and CCTV Rollout",
    siteType: "Distributed commercial portfolio",
    challenge: "Different sites used different controls, which made incidents harder to trace and manage.",
    scope: [
      "Standardised access and CCTV architecture",
      "Aligned event logging across sites",
      "Introduced simple incident retrieval guidance"
    ],
    result: "Stakeholders gained consistent controls, faster investigations, and clearer reporting across the portfolio.",
    documents: ["Configuration baseline", "Event reporting template", "Operational runbook"]
  }
];

export const resourceCards = [
  {
    title: "Maintenance Planning Checklist",
    description: "A practical checklist for planned maintenance programs that need to stay inspection-ready.",
    format: "Checklist",
    ctaLabel: "Request the checklist",
    intent: "resource"
  },
  {
    title: "Suppression Integrity Primer",
    description: "A short guide to room integrity testing, retention time, and pre-discharge verification.",
    format: "Technical note",
    ctaLabel: "Request the primer",
    intent: "resource"
  },
  {
    title: "Compliance Pack Contents",
    description: "A model structure for service certificates, logs, as-builts, O and M notes, and action records.",
    format: "Reference",
    ctaLabel: "Request the reference",
    intent: "resource"
  }
];

export const contactPaths = [
  {
    value: "project",
    label: "Request a Quote",
    summary: "Tell us about a new installation, upgrade, or site visit."
  },
  {
    value: "maintenance",
    label: "Book Maintenance",
    summary: "Plan a service visit or routine maintenance cycle."
  },
  {
    value: "urgent_callout",
    label: "Emergency Callout",
    summary: "Use this for faults, outages, or urgent site issues."
  },
  {
    value: "general",
    label: "General Enquiry",
    summary: "Ask a question or route a less urgent request."
  }
] as const;
