const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const PROBLEMS_FILE = path.join(DATA_DIR, 'problems.json');
const SOLUTIONS_FILE = path.join(DATA_DIR, 'solutions.json');
const INSTITUTIONS_FILE = path.join(DATA_DIR, 'institutions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Pre-seeded premier institution hubs for national coverage
const SEED_INSTITUTIONS = [
  {
    id: "iit-roorkee",
    name: "IIT Roorkee",
    fullName: "Indian Institute of Technology Roorkee",
    hubCode: "HUB-IITR-01",
    state: "Uttarakhand",
    district: "Haridwar",
    aisheCode: "U-0560",
    nodalOfficer: "Prof. S. K. Bhattacharya",
    nodalEmail: "innovation.hub@iitr.ac.in",
    nodalPhone: "+91 98765 43210",
    domains: ["Water Resources", "Rural Infrastructure", "Earthquake Engineering"],
    activeTeams: 18,
    submittedSolutionsCount: 8,
    avgScore: 92.4,
    nationalRank: 2,
    badge: "Tier-1 Premier Hub",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "nit-durgapur",
    name: "NIT Durgapur",
    fullName: "National Institute of Technology Durgapur",
    hubCode: "HUB-NITD-09",
    state: "West Bengal",
    district: "Paschim Bardhaman",
    aisheCode: "U-0573",
    nodalOfficer: "Dr. Mousumi Sen",
    nodalEmail: "iic.head@nitdgp.ac.in",
    nodalPhone: "+91 98765 43211",
    domains: ["Renewable Energy", "Waste Management", "IoT Monitoring"],
    activeTeams: 12,
    submittedSolutionsCount: 5,
    avgScore: 88.0,
    nationalRank: 7,
    badge: "Center of Excellence",
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rvce-bengaluru",
    name: "RV College of Engineering",
    fullName: "RV College of Engineering, Bengaluru",
    hubCode: "HUB-RVCE-24",
    state: "Karnataka",
    district: "Bengaluru Urban",
    aisheCode: "C-1254",
    nodalOfficer: "Dr. K. N. Subramanya",
    nodalEmail: "ruraltech@rvce.edu.in",
    nodalPhone: "+91 98765 43212",
    domains: ["Smart Agriculture", "Autonomous Systems", "Water Purification"],
    activeTeams: 15,
    submittedSolutionsCount: 6,
    avgScore: 89.2,
    nationalRank: 5,
    badge: "Autonomous Innovation Lab",
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "iit-hyderabad",
    name: "IIT Hyderabad",
    fullName: "Indian Institute of Technology Hyderabad",
    hubCode: "HUB-IITH-03",
    state: "Telangana",
    district: "Sangareddy",
    aisheCode: "U-0013",
    nodalOfficer: "Prof. B. S. Murty",
    nodalEmail: "rutag@iith.ac.in",
    nodalPhone: "+91 98765 43213",
    domains: ["Healthcare Diagnostics", "5G Rural Connectivity", "Smart Materials"],
    activeTeams: 22,
    submittedSolutionsCount: 9,
    avgScore: 94.8,
    nationalRank: 1,
    badge: "Top Ranked National Hub",
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "nit-patna",
    name: "NIT Patna",
    fullName: "National Institute of Technology Patna",
    hubCode: "HUB-NITP-15",
    state: "Bihar",
    district: "Patna",
    aisheCode: "U-0072",
    nodalOfficer: "Dr. P. K. Jain",
    nodalEmail: "civictech@nitp.ac.in",
    nodalPhone: "+91 98765 43214",
    domains: ["River Embankment", "Solar Microgrids", "Sanitation"],
    activeTeams: 9,
    submittedSolutionsCount: 4,
    avgScore: 86.5,
    nationalRank: 11,
    badge: "State Emerging Hub",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "iit-bombay",
    name: "IIT Bombay",
    fullName: "Indian Institute of Technology Bombay",
    hubCode: "HUB-IITB-02",
    state: "Maharashtra",
    district: "Mumbai Suburban",
    aisheCode: "U-0306",
    nodalOfficer: "Prof. Milind Atrey",
    nodalEmail: "ctara@iitb.ac.in",
    nodalPhone: "+91 98765 43215",
    domains: ["Rural Technology", "Clean Air", "Low-cost Sanitation"],
    activeTeams: 20,
    submittedSolutionsCount: 7,
    avgScore: 93.1,
    nationalRank: 3,
    badge: "Tier-1 Premier Hub",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Standardized Sector Mapping for Civic & Societal Problems
const SECTOR_MAP = {
  Water: { sectorCode: 'SEC-WTR', prefix: 'WTR', label: 'Water & Sanitation' },
  Roads: { sectorCode: 'SEC-RDS', prefix: 'RDS', label: 'Roads & Infrastructure' },
  Health: { sectorCode: 'SEC-HLT', prefix: 'HLT', label: 'Public Health' },
  Agriculture: { sectorCode: 'SEC-AGR', prefix: 'AGR', label: 'Agriculture & Irrigation' },
  Power: { sectorCode: 'SEC-PWR', prefix: 'PWR', label: 'Power & Energy' },
  Sanitation: { sectorCode: 'SEC-SAN', prefix: 'SAN', label: 'Sanitation & Waste' },
  Education: { sectorCode: 'SEC-EDU', prefix: 'EDU', label: 'Education & Schools' },
  Civic: { sectorCode: 'SEC-GOV', prefix: 'GOV', label: 'Civic Governance & Safety' },
  Environment: { sectorCode: 'SEC-ENV', prefix: 'ENV', label: 'Environment & Pollution' },
  Other: { sectorCode: 'SEC-GEN', prefix: 'GEN', label: 'General / Multi-Sector' }
};

function getSectorMeta(category) {
  if (!category) return { sectorCode: 'SEC-GEN', prefix: 'GEN', label: 'General / Civic' };
  const catLower = category.toLowerCase();
  for (const [key, val] of Object.entries(SECTOR_MAP)) {
    if (key.toLowerCase() === catLower) return val;
  }
  if (catLower.includes('water') || catLower.includes('jal')) return SECTOR_MAP.Water;
  if (catLower.includes('road') || catLower.includes('bridge') || catLower.includes('traffic')) return SECTOR_MAP.Roads;
  if (catLower.includes('health') || catLower.includes('medical') || catLower.includes('vaccin') || catLower.includes('hospital')) return SECTOR_MAP.Health;
  if (catLower.includes('agri') || catLower.includes('farm') || catLower.includes('crop') || catLower.includes('irrigation')) return SECTOR_MAP.Agriculture;
  if (catLower.includes('power') || catLower.includes('electric') || catLower.includes('solar') || catLower.includes('grid')) return SECTOR_MAP.Power;
  if (catLower.includes('sanitat') || catLower.includes('drain') || catLower.includes('waste') || catLower.includes('garbage')) return SECTOR_MAP.Sanitation;
  if (catLower.includes('edu') || catLower.includes('school') || catLower.includes('college')) return SECTOR_MAP.Education;
  if (catLower.includes('gov') || catLower.includes('civic') || catLower.includes('police') || catLower.includes('safe')) return SECTOR_MAP.Civic;
  if (catLower.includes('env') || catLower.includes('pollut') || catLower.includes('air') || catLower.includes('forest')) return SECTOR_MAP.Environment;
  return { sectorCode: 'SEC-GEN', prefix: 'GEN', label: 'General / Multi-Sector' };
}

// Initial seed data designed specifically for Smart India Hackathon prototype
const SEED_PROBLEMS = [
  {
    id: "prob-101",
    sectorCode: "SEC-WTR",
    problemCode: "WTR-101",
    title: "Severe Fluoride Contamination in Village Borewells & RO Plant Malfunction",
    description: "In Mohanpur village, 4 out of 5 communal borewells have high fluoride content (>2.8 mg/L) causing dental and skeletal fluorosis among children. The solar-powered community RO water filtration plant has been non-operational for 3 months due to membrane scaling and lack of spare filters.",
    photoUrl: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80",
    photoAuthenticity: {
      isRealPhoto: true,
      confidence: 96,
      hasGpsMeta: true,
      detectionDetails: "Verified genuine ground capture. Exif sensor signature valid. No synthetic artifacts detected."
    },
    location: {
      state: "Uttar Pradesh",
      district: "Sonbhadra",
      mandal: "Chopan",
      village: "Mohanpur",
      areaName: "Near Panchayat Bhawan & Primary School",
      pincode: "231205",
      coordinates: { lat: 24.5204, lng: 83.0381 }
    },
    category: "Water",
    urgency: "High",
    level: "Village/Ward",
    maxResolutionDays: 7,
    escalationStatus: "Normal",
    rating: 4.8,
    duplicateOf: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prob-102",
    sectorCode: "SEC-RDS",
    problemCode: "RDS-102",
    title: "Broken Bridge Culvert Disrupting Ambulance Access to Mandal Hospital",
    description: "Heavy monsoon runoff eroded the foundation of the main masonry culvert bridge connecting 6 agricultural hamlets to the Taluk CHC Hospital. Ambulances and milk delivery tankers cannot cross, forcing a 28 km detour over unpaved mud tracks.",
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80",
    photoAuthenticity: {
      isRealPhoto: true,
      confidence: 98,
      hasGpsMeta: true,
      detectionDetails: "Real camera proof verified with GPS geotag."
    },
    location: {
      state: "Karnataka",
      district: "Dharwad",
      mandal: "Kundgol",
      village: "Kubihal",
      areaName: "Km 14, Kubihal-Saunshi Road",
      pincode: "581113",
      coordinates: { lat: 15.2571, lng: 75.2539 }
    },
    category: "Roads",
    urgency: "High",
    level: "Mandal",
    maxResolutionDays: 15,
    escalationStatus: "Normal",
    rating: 4.5,
    duplicateOf: null,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prob-103",
    sectorCode: "SEC-HLT",
    problemCode: "HLT-103",
    title: "Vaccine Cold-Chain Failure at Remote Primary Health Centre Due to Grid Outages",
    description: "The Primary Health Sub-Centre suffers 14-hour daily rolling blackouts. Solar backup inverters suffered battery degradation, jeopardizing storage of essential neonatal vaccines (BCG, Rotavirus, Measles) and antivenom vials in the ILR (Ice Lined Refrigerator).",
    photoUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
    photoAuthenticity: {
      isRealPhoto: true,
      confidence: 94,
      hasGpsMeta: true,
      detectionDetails: "Ground shot validated with digital metadata."
    },
    location: {
      state: "Telangana",
      district: "Adilabad",
      mandal: "Utnoor",
      village: "Hasnapur",
      areaName: "Tribal Welfare PHC Compound",
      pincode: "504311",
      coordinates: { lat: 19.3667, lng: 78.7833 }
    },
    category: "Health",
    urgency: "High",
    level: "District",
    maxResolutionDays: 30,
    escalationStatus: "Normal",
    rating: 4.9,
    duplicateOf: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prob-104",
    sectorCode: "SEC-AGR",
    problemCode: "AGR-104",
    title: "Groundwater Depletion & Heavy Siltation in Minor Irrigation Canal",
    description: "The tail-end distributary canal is choked with 2.5 meters of silt and plastic debris. Over 400 acres of paddy and groundnut fields have had zero water supply for two sowing cycles, forcing small farmers to spend heavily on erratic diesel pump rentals.",
    photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
    photoAuthenticity: {
      isRealPhoto: true,
      confidence: 95,
      hasGpsMeta: true,
      detectionDetails: "Verified authentic camera picture."
    },
    location: {
      state: "Maharashtra",
      district: "Yavatmal",
      mandal: "Pusad",
      village: "Shembalpimpri",
      areaName: "Distributary Canal No. 4, Wardha Basin",
      pincode: "445204",
      coordinates: { lat: 19.9167, lng: 77.5667 }
    },
    category: "Agriculture",
    urgency: "Medium",
    level: "Mandal",
    maxResolutionDays: 15,
    escalationStatus: "Normal",
    rating: 4.2,
    duplicateOf: null,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_SOLUTIONS = [
  {
    id: "sol-201",
    problemId: "prob-101",
    teamName: "Jal-Drishti Innovations",
    institution: "Indian Institute of Technology (IIT) Roorkee",
    contactLead: "Rohit Verma (Team Lead)",
    contactEmail: "rohit.verma@iitr.ac.in",
    contactPhone: "+91 98450 12847",
    mentorStatus: "Mentor Approved",
    mentorDetails: {
      name: "Dr. Ananya Sharma",
      designation: "Professor & Chair, Dept. of Chemical Engineering",
      phone: "+91 98450 12847",
      isOtpVerified: true
    },
    industryPartner: "Tata Water Mission / Jal Jeevan Tech Hub",
    description: "Deployment of an activated-alumina bio-sand filter with low-cost indigenous electrodialysis reversal (EDR). Features automated backwashing powered by a small 200W solar panel and IoT TDS/Fluoride level telemetry sent to the Gram Panchayat WhatsApp bot.",
    implementationTimeDays: 5,
    estimatedBudget: "₹ 48,000 per village unit",
    prototypeUrl: "https://github.com/jaldrishti-sih/fluoride-smartfilter",
    votes: 48,
    aiEvaluation: {
      resolutionRateScore: 28, // Max 30
      closureTimeScore: 19,    // Max 20
      citizenSatisfactionScore: 19, // Max 20
      escalationRiskScore: 9,  // Max 10
      reopenedCasesRiskScore: 9, // Max 10
      innovationScore: 9,      // Max 10
      totalScore: 93,
      aiRemarks: "Exceptional low-cost design. Direct resolution of fluoride scaling issue with IoT monitoring meets high standards for sustainable village-level adoption."
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sol-202",
    problemId: "prob-101",
    teamName: "AquaPure Vanguards",
    institution: "National Institute of Technology (NIT) Durgapur",
    contactLead: "Karthik Nair",
    contactEmail: "karthik.nair.nitdgp@gmail.com",
    contactPhone: "+91 97120 44321",
    mentorStatus: "Pending Mentor Review",
    mentorDetails: {
      name: "Prof. S. Sengupta",
      designation: "Assistant Professor, Dept. of Biotechnology",
      phone: "+91 97120 44321",
      isOtpVerified: false
    },
    industryPartner: null,
    description: "Replace dead RO membranes with low-pressure composite nanofiltration membranes, coupled with a rainwater harvesting percolation pit to recharge the local aquifer with low-mineral water.",
    implementationTimeDays: 7,
    estimatedBudget: "₹ 65,000",
    prototypeUrl: "https://aquapure-demo.vercel.app",
    votes: 21,
    aiEvaluation: {
      resolutionRateScore: 24,
      closureTimeScore: 16,
      citizenSatisfactionScore: 17,
      escalationRiskScore: 8,
      reopenedCasesRiskScore: 8,
      innovationScore: 7,
      totalScore: 80,
      aiRemarks: "Viable engineering approach, though higher initial capital expenditure and membrane import costs."
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sol-203",
    problemId: "prob-102",
    teamName: "Setu-Setu InfraTech",
    institution: "RV College of Engineering, Bengaluru",
    contactLead: "Pooja Hegde & Vignesh R.",
    contactEmail: "pooja.civ@rvce.edu.in",
    contactPhone: "+91 94812 77093",
    mentorStatus: "Mentor Approved",
    mentorDetails: {
      name: "Dr. K. S. Murthy",
      designation: "Dean & Professor, Civil Infrastructure Centre",
      phone: "+91 94812 77093",
      isOtpVerified: true
    },
    industryPartner: "L&T Smart Infrastructure & Urban Engineering Lab",
    description: "Modular pre-cast concrete box culvert installation using locally available M30 mix and geo-textile reinforced approach slopes. Can be assembled within 6 days with minimal traffic stoppage, providing 40-tonne load capacity.",
    implementationTimeDays: 10,
    estimatedBudget: "₹ 1,85,000",
    prototypeUrl: "https://setu-infra-prototype.org",
    votes: 36,
    aiEvaluation: {
      resolutionRateScore: 27,
      closureTimeScore: 18,
      citizenSatisfactionScore: 18,
      escalationRiskScore: 9,
      reopenedCasesRiskScore: 9,
      innovationScore: 8,
      totalScore: 89,
      aiRemarks: "Rapid deployment precast modularity satisfies the 15-day Mandal SLA with high structural resilience against monsoon scouring."
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sol-204",
    problemId: "prob-103",
    teamName: "UrjaSwasthya BioTech",
    institution: "Indian Institute of Technology (IIT) Hyderabad",
    contactLead: "Siddharth Rao",
    contactEmail: "siddharth.ee@iith.ac.in",
    contactPhone: "+91 99512 88401",
    mentorStatus: "Mentor Approved",
    mentorDetails: {
      name: "Dr. P. Rajasekhar",
      designation: "Director, Center for Healthcare Technologies",
      phone: "+91 99512 88401",
      isOtpVerified: true
    },
    industryPartner: "Cisco ThingQbator IoT Innovation Center",
    description: "Phase Change Material (PCM) thermal-buffer hybrid solar ILR with supercapacitors and GSM temperature alarm. Keeps vaccines safe at 2-8°C for up to 72 hours even under zero sunlight and zero grid power.",
    implementationTimeDays: 14,
    estimatedBudget: "₹ 42,000 retrofit kit",
    prototypeUrl: "https://urjaswasthya.iith.ac.in",
    votes: 52,
    aiEvaluation: {
      resolutionRateScore: 29,
      closureTimeScore: 19,
      citizenSatisfactionScore: 20,
      escalationRiskScore: 10,
      reopenedCasesRiskScore: 10,
      innovationScore: 10,
      totalScore: 98,
      aiRemarks: "Masterclass solution for rural healthcare infrastructure. 72-hour zero-power holdover completely neutralizes cold-chain failure risks."
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to read data safely
function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return fallback;
  }
}

// Helper to write data safely
function writeJSON(file, data) {
  try {
    const tempFile = `${file}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, file);
    return true;
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
    return false;
  }
}

// Initialize seed data if not present
function initializeDatabase() {
  const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
  const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);
  const institutions = readJSON(INSTITUTIONS_FILE, SEED_INSTITUTIONS);
  console.log(`Database initialized: ${problems.length} problems, ${solutions.length} solutions, ${institutions.length} institutions.`);
}

initializeDatabase();

// Database Access Methods
const db = {
  // Get all problems with filters and computed solution counts
  getProblems({ category, level, urgency, state, search, status } = {}) {
    let problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);

    // Compute solutions count, sector metadata, and highest score for each problem
    problems = problems.map(prob => {
      const probSols = solutions.filter(s => s.problemId === prob.id);
      const topScore = probSols.length > 0 
        ? Math.max(...probSols.map(s => s.aiEvaluation?.totalScore || 0)) 
        : 0;
      
      // Dynamic rating (1 to 5 stars) based on solution engagement & scores
      let calculatedRating = prob.rating;
      if (probSols.length > 0) {
        calculatedRating = Number(Math.min(5, 3.0 + (probSols.length * 0.4) + (topScore / 100)).toFixed(1));
      }

      // Check SLA status
      const daysOpen = Math.floor((Date.now() - new Date(prob.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const isEscalated = prob.maxResolutionDays && daysOpen > prob.maxResolutionDays;

      const sectorMeta = getSectorMeta(prob.category);
      const sectorCode = prob.sectorCode || sectorMeta.sectorCode;
      const problemCode = prob.problemCode || (prob.id.startsWith('prob-') ? `${sectorMeta.prefix}-${prob.id.split('-')[1]}` : `${sectorMeta.prefix}-${prob.id.slice(0, 4).toUpperCase()}`);

      return {
        ...prob,
        sectorCode,
        problemCode,
        sectorLabel: sectorMeta.label,
        status: prob.status || 'Open',
        resolutionProof: prob.resolutionProof || null,
        solutionCount: probSols.length,
        topAiScore: topScore,
        rating: calculatedRating,
        daysOpen,
        isEscalated: isEscalated || prob.escalationStatus === 'Escalated'
      };
    });

    if (category && category !== 'All') {
      problems = problems.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (level && level !== 'All') {
      problems = problems.filter(p => p.level.toLowerCase() === level.toLowerCase());
    }
    if (urgency && urgency !== 'All') {
      problems = problems.filter(p => p.urgency.toLowerCase() === urgency.toLowerCase());
    }
    if (status && status !== 'All') {
      problems = problems.filter(p => (p.status || 'Open').toLowerCase() === status.toLowerCase());
    }
    if (state && state !== 'All') {
      problems = problems.filter(p => p.location?.state?.toLowerCase() === state.toLowerCase());
    }
    if (search) {
      const q = search.trim().toLowerCase().replace(/^#/, '');
      problems = problems.filter(p => {
        const titleMatch = p.title?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const villageMatch = p.location?.village?.toLowerCase().includes(q);
        const districtMatch = p.location?.district?.toLowerCase().includes(q);
        const stateMatch = p.location?.state?.toLowerCase().includes(q);
        const categoryMatch = p.category?.toLowerCase().includes(q);
        
        // Match sector code or problem code
        const sectorCode = (p.sectorCode || '').toLowerCase();
        const problemCode = (p.problemCode || '').toLowerCase();
        const codeMatch = sectorCode.includes(q) || problemCode.includes(q);

        // Alias matching: typing "wtr" or "rds" matches corresponding sector
        const aliasMatch = 
          (q === 'wtr' && sectorCode === 'sec-wtr') ||
          (q === 'rds' && sectorCode === 'sec-rds') ||
          (q === 'hlt' && sectorCode === 'sec-hlt') ||
          (q === 'agr' && sectorCode === 'sec-agr') ||
          (q === 'san' && sectorCode === 'sec-san') ||
          (q === 'pwr' && sectorCode === 'sec-pwr') ||
          (q === 'edu' && sectorCode === 'sec-edu') ||
          (q === 'gov' && sectorCode === 'sec-gov') ||
          (q === 'env' && sectorCode === 'sec-env');

        return titleMatch || descMatch || villageMatch || districtMatch || stateMatch || categoryMatch || codeMatch || aliasMatch;
      });
    }

    if (search) {
      // User requirement: When searching anything, show the recent uploads first with high rating
      // BUT keep AI-flagged irrelevant problems at the very bottom
      problems.sort((a, b) => {
        const isIrrA = a.isIrrelevant === true || a.category === 'Irrelevant';
        const isIrrB = b.isIrrelevant === true || b.category === 'Irrelevant';
        if (isIrrA && !isIrrB) return 1;
        if (!isIrrA && isIrrB) return -1;

        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        const dayA = Math.floor(timeA / (1000 * 60 * 60 * 24));
        const dayB = Math.floor(timeB / (1000 * 60 * 60 * 24));
        
        // 1. Primary: Newest upload day first
        if (dayB !== dayA) {
          return dayB - dayA;
        }
        // 2. Secondary: Highest Rating & AI Score first
        const rateA = (Number(a.rating) || 0) * 20 + (a.topAiScore || 0);
        const rateB = (Number(b.rating) || 0) * 20 + (b.topAiScore || 0);
        if (rateB !== rateA) {
          return rateB - rateA;
        }
        // 3. Exact timestamp
        return timeB - timeA;
      });
    } else {
      // Default sort when not searching: Urgency (High > Medium > Low), then AI rating & score
      // Irrelevant reports are strictly kept at the very end
      const urgencyWeight = { High: 3, Medium: 2, Low: 1 };
      problems.sort((a, b) => {
        const isIrrA = a.isIrrelevant === true || a.category === 'Irrelevant';
        const isIrrB = b.isIrrelevant === true || b.category === 'Irrelevant';
        if (isIrrA && !isIrrB) return 1;
        if (!isIrrA && isIrrB) return -1;

        const urgA = urgencyWeight[a.urgency] || 1;
        const urgB = urgencyWeight[b.urgency] || 1;
        if (urgB !== urgA) {
          return urgB - urgA;
        }
        const scoreA = (a.topAiScore || 0) + (Number(a.rating) || 0) * 10;
        const scoreB = (b.topAiScore || 0) + (Number(b.rating) || 0) * 10;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    }

    return problems;
  },

  // Get problem by ID with associated solutions sorted by AI Score
  getProblemById(id) {
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);

    const problem = problems.find(p => p.id === id);
    if (!problem) return null;

    // Filter solutions for this problem
    const probSols = solutions
      .filter(s => s.problemId === id)
      .sort((a, b) => (b.aiEvaluation?.totalScore || 0) - (a.aiEvaluation?.totalScore || 0));

    // Find similar problems across other states/districts for cross-locality learning
    const similarProblemsAcrossStates = problems
      .filter(p => p.id !== id && p.category === problem.category)
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        title: p.title,
        state: p.location?.state,
        district: p.location?.district,
        level: p.level,
        solutionCount: solutions.filter(s => s.problemId === p.id).length
      }));

    // Find previous solutions implemented/proposed for similar issues in same category
    const previousSolutionsFromCategory = solutions
      .filter(s => s.problemId !== id && problems.find(p => p.id === s.problemId)?.category === problem.category)
      .slice(0, 2)
      .map(s => {
        const sourceProb = problems.find(p => p.id === s.problemId);
        return {
          id: s.id,
          teamName: s.teamName,
          institution: s.institution,
          description: s.description,
          totalScore: s.aiEvaluation?.totalScore,
          sourceProblemTitle: sourceProb?.title,
          sourceState: sourceProb?.location?.state
        };
      });

    const daysOpen = Math.floor((Date.now() - new Date(problem.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const isEscalated = problem.maxResolutionDays && daysOpen > problem.maxResolutionDays;

    const sectorMeta = getSectorMeta(problem.category);
    const sectorCode = problem.sectorCode || sectorMeta.sectorCode;
    const problemCode = problem.problemCode || (problem.id.startsWith('prob-') ? `${sectorMeta.prefix}-${problem.id.split('-')[1]}` : `${sectorMeta.prefix}-${problem.id.slice(0, 4).toUpperCase()}`);

    return {
      ...problem,
      sectorCode,
      problemCode,
      sectorLabel: sectorMeta.label,
      status: problem.status || 'Open',
      resolutionProof: problem.resolutionProof || null,
      solutions: probSols,
      solutionCount: probSols.length,
      topAiScore: probSols.length > 0 ? probSols[0].aiEvaluation?.totalScore : 0,
      daysOpen,
      isEscalated: isEscalated || problem.escalationStatus === 'Escalated',
      similarProblemsAcrossStates,
      previousSolutionsFromCategory
    };
  },

  // Create new problem
  createProblem(data) {
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const sectorMeta = getSectorMeta(data.category);
    const problemCode = data.problemCode || `${sectorMeta.prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newProblem = {
      id: uuidv4(),
      sectorCode: data.sectorCode || sectorMeta.sectorCode,
      problemCode: problemCode,
      title: data.title,
      description: data.description,
      status: "Open",
      resolutionProof: null,
      photoUrl: data.photoUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",
      photoAuthenticity: data.photoAuthenticity || {
        isRealPhoto: true,
        confidence: 90,
        hasGpsMeta: false,
        detectionDetails: "User ground photo submission recorded with verified coordinates."
      },
      location: {
        state: data.location?.state || "Unknown",
        district: data.location?.district || "Unknown",
        mandal: data.location?.mandal || "Unknown",
        village: data.location?.village || "Unknown",
        areaName: data.location?.areaName || "",
        pincode: data.location?.pincode || "",
        coordinates: data.location?.coordinates || { lat: 20.5937, lng: 78.9629 }
      },
      category: data.category || "Other",
      urgency: data.urgency || "Medium",
      level: data.level || "Village/Ward",
      maxResolutionDays: data.maxResolutionDays || 7,
      escalationStatus: "Normal",
      isIrrelevant: Boolean(data.isIrrelevant),
      relevanceFlags: data.relevanceFlags || null,
      rating: data.isIrrelevant ? 1.0 : (data.rating || 3.5),
      duplicateOf: data.duplicateOf || null,
      createdAt: new Date().toISOString()
    };

    problems.unshift(newProblem);
    writeJSON(PROBLEMS_FILE, problems);
    return newProblem;
  },

  // Resolve problem with ground-truth resolution proof photo
  resolveProblem(problemId, { photoUrl, description, resolvedBy }) {
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return null;

    problem.status = "Solved";
    problem.resolutionProof = {
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
      description: description || "Problem resolved and verified on ground with photo proof.",
      resolvedBy: resolvedBy || "Verified Implementation Team",
      resolvedAt: new Date().toISOString()
    };

    writeJSON(PROBLEMS_FILE, problems);
    return problem;
  },

  // Update problem status and pilot sanction details
  updateProblemStatus(id, { status, pilotSanctioned = true, sanctionedGrant, remarks } = {}) {
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const problem = problems.find(p => p.id === id);
    if (!problem) return null;

    if (status) problem.status = status;
    if (pilotSanctioned !== undefined) problem.pilotSanctioned = pilotSanctioned;
    if (sanctionedGrant) problem.sanctionedGrant = sanctionedGrant;
    if (remarks) problem.sanctionRemarks = remarks;
    problem.sanctionedAt = new Date().toISOString();

    writeJSON(PROBLEMS_FILE, problems);
    return problem;
  },


  // Create new solution
  createSolution(data) {
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);
    const newSolution = {
      id: uuidv4(),
      problemId: data.problemId,
      teamName: data.teamName,
      institution: data.institution || "Student Innovators",
      contactLead: data.contactLead || "Team Lead",
      contactEmail: data.contactEmail || "",
      contactPhone: data.contactPhone || "",
      mentorStatus: data.mentorStatus || (data.mentorDetails?.isOtpVerified ? "Mentor Approved" : "Pending Mentor Review"),
      mentorDetails: data.mentorDetails || null,
      industryPartner: data.industryPartner || null,
      description: data.description,
      implementationTimeDays: Number(data.implementationTimeDays) || 7,
      estimatedBudget: data.estimatedBudget || "TBD",
      prototypeUrl: data.prototypeUrl || "",
      votes: 0,
      aiEvaluation: data.aiEvaluation || {
        resolutionRateScore: 20,
        closureTimeScore: 15,
        citizenSatisfactionScore: 15,
        escalationRiskScore: 7,
        reopenedCasesRiskScore: 7,
        innovationScore: 7,
        totalScore: 71,
        aiRemarks: "Standard solution submission. Pending in-depth evaluation."
      },
      createdAt: new Date().toISOString()
    };

    solutions.unshift(newSolution);
    writeJSON(SOLUTIONS_FILE, solutions);

    // Update parent problem rating
    this.recomputeProblemRating(data.problemId);

    return newSolution;
  },

  // Upvote a solution
  upvoteSolution(solutionId) {
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);
    const solution = solutions.find(s => s.id === solutionId);
    if (!solution) return null;

    solution.votes = (solution.votes || 0) + 1;
    writeJSON(SOLUTIONS_FILE, solutions);

    this.recomputeProblemRating(solution.problemId);
    return solution;
  },

  // Recompute problem rating after solution updates
  recomputeProblemRating(problemId) {
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);

    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;

    const probSols = solutions.filter(s => s.problemId === problemId);
    const topScore = probSols.length > 0 
      ? Math.max(...probSols.map(s => s.aiEvaluation?.totalScore || 0)) 
      : 0;

    problem.rating = Number(Math.min(5, 3.0 + (probSols.length * 0.4) + (topScore / 100)).toFixed(1));
    writeJSON(PROBLEMS_FILE, problems);
  },

  // Find candidate duplicates or similar problems in the same or other localities
  findSimilarCandidates(category, village, mandal, district, state) {
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);

    // Local candidates (same village, mandal, or district)
    const localMatches = problems.filter(p => {
      const sameCategory = p.category.toLowerCase() === category.toLowerCase();
      const sameDist = p.location?.district?.toLowerCase() === district?.toLowerCase();
      const sameVill = p.location?.village?.toLowerCase() === village?.toLowerCase();
      return sameCategory && (sameDist || sameVill);
    });

    // Cross-state candidates (different state, same category)
    const crossStateMatches = problems
      .filter(p => p.category.toLowerCase() === category.toLowerCase() && p.location?.state?.toLowerCase() !== state?.toLowerCase())
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        title: p.title,
        state: p.location?.state,
        district: p.location?.district,
        solutions: solutions.filter(s => s.problemId === p.id).map(s => ({
          teamName: s.teamName,
          score: s.aiEvaluation?.totalScore,
          desc: s.description
        }))
      }));

    return { localMatches, crossStateMatches };
  },

  // Delete a single problem and its associated solutions
  deleteProblem(id) {
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);

    const index = problems.findIndex(p => p.id === id);
    if (index === -1) return null;

    const removed = problems.splice(index, 1)[0];
    writeJSON(PROBLEMS_FILE, problems);

    // Remove any solutions tied to this problem
    const remainingSolutions = solutions.filter(s => s.problemId !== id);
    writeJSON(SOLUTIONS_FILE, remainingSolutions);

    return removed;
  },

  // Batch delete multiple problems and their solutions
  deleteProblems(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return { deletedCount: 0 };
    const problems = readJSON(PROBLEMS_FILE, SEED_PROBLEMS);
    const solutions = readJSON(SOLUTIONS_FILE, SEED_SOLUTIONS);

    const idSet = new Set(ids);
    const remainingProblems = problems.filter(p => !idSet.has(p.id));
    const deletedCount = problems.length - remainingProblems.length;
    writeJSON(PROBLEMS_FILE, remainingProblems);

    const remainingSolutions = solutions.filter(s => !idSet.has(s.problemId));
    writeJSON(SOLUTIONS_FILE, remainingSolutions);

    return { deletedCount };
  },

  // Institutions Management (Super Admin & College Hub)
  getInstitutions() {
    return readJSON(INSTITUTIONS_FILE, SEED_INSTITUTIONS);
  },

  getInstitutionById(id) {
    const institutions = readJSON(INSTITUTIONS_FILE, SEED_INSTITUTIONS);
    return institutions.find(i => i.id === id) || null;
  },

  createInstitution(data) {
    const institutions = readJSON(INSTITUTIONS_FILE, SEED_INSTITUTIONS);
    const rawName = (data.name || "Technical Institute").trim();
    const cleanId = (data.id || rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `inst-${Date.now()}`;
    
    // Check if code or id already exists
    const existing = institutions.find(i => i.id === cleanId);
    const finalId = existing ? `${cleanId}-${Math.floor(100 + Math.random() * 900)}` : cleanId;

    const newInst = {
      id: finalId,
      name: rawName,
      fullName: (data.fullName || rawName).trim(),
      hubCode: data.hubCode || `HUB-${rawName.slice(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      state: data.state || "National",
      district: data.district || "",
      aisheCode: data.aisheCode || "",
      nodalOfficer: data.nodalOfficer || "Nodal Officer",
      nodalEmail: data.nodalEmail || "",
      nodalPhone: data.nodalPhone || "",
      domains: Array.isArray(data.domains) 
        ? data.domains 
        : (typeof data.domains === 'string' ? data.domains.split(',').map(d => d.trim()).filter(Boolean) : ["Civic Engineering"]),
      activeTeams: Number(data.activeTeams) || 5,
      submittedSolutionsCount: 0,
      avgScore: Number(data.avgScore) || 88.0,
      nationalRank: Number(data.nationalRank) || (institutions.length + 1),
      badge: data.badge || "Registered Technical Hub",
      createdAt: new Date().toISOString()
    };

    institutions.unshift(newInst);
    writeJSON(INSTITUTIONS_FILE, institutions);
    return newInst;
  },

  updateInstitution(id, data) {
    const institutions = readJSON(INSTITUTIONS_FILE, SEED_INSTITUTIONS);
    const inst = institutions.find(i => i.id === id);
    if (!inst) return null;

    Object.assign(inst, data);
    writeJSON(INSTITUTIONS_FILE, institutions);
    return inst;
  },

  deleteInstitution(id) {
    const institutions = readJSON(INSTITUTIONS_FILE, SEED_INSTITUTIONS);
    const index = institutions.findIndex(i => i.id === id);
    if (index === -1) return null;

    const removed = institutions.splice(index, 1)[0];
    writeJSON(INSTITUTIONS_FILE, institutions);
    return removed;
  }
};

module.exports = db;
