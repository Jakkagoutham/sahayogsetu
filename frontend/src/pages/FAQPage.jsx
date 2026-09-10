import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, ChevronDown, ChevronUp, Search, ShieldCheck, 
  Mic, Clock, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, 
  Building2, Award, FileText, PhoneCall, Sparkles 
} from 'lucide-react';

const FAQ_DATA = [
  {
    id: 1,
    category: "Platform & Technology",
    question: 'What is the "Public Grievance Redressal System (PGRS)" on SahayogSetu?',
    shortAnswer: 'SahayogSetu is an AI-driven civic innovation and grievance redressal platform under Smart India Hackathon bridging citizens, university innovators, and government authorities.',
    fullAnswer: `SahayogSetu is an autonomous Public Grievance Redressal and Societal Innovation ecosystem engineered under the Smart India Hackathon (SIH) framework.

Unlike legacy grievance portals where civic complaints get buried in bureaucratic backlogs without technological resolution:
• SahayogSetu connects community problems directly to university engineering innovators, R&D labs, and incubation hubs.
• Student engineering teams design low-cost hardware and software prototypes to permanently resolve civic bottlenecks.
• District Collectorates and municipal departments evaluate submissions using an official 100-point 6-parameter government evaluation matrix to sanction pilot deployment grants (up to ₹1,50,000 per project).
• It incorporates Groq LPU AI triage, camera GPS EXIF ground proof, and 100% citizen identity privacy.`,
    tags: ["SIH Framework", "Autonomous AI", "University Innovators", "Pilot Sanctions"]
  },
  {
    id: 2,
    category: "Platform & Technology",
    question: 'Is SahayogSetu only a web portal, or does it cover voice, mobile, and other channels?',
    shortAnswer: 'SahayogSetu is a multimodal platform featuring Groq Whisper voice intake in 6 regional Indian languages, mobile GPS photo capture, and automated 2FA alerts.',
    fullAnswer: `SahayogSetu is not limited to a traditional desktop web portal. It is built from the ground up for grassroots Indian accessibility:
• **AI Voice Grievance Studio**: Citizens can speak naturally in 6 regional languages (हिन्दी, తెలుగు, தமிழ், ಕನ್ನಡ, मराठी, and English) using Groq Whisper Large v3. The AI automatically transcribes, translates, and structures form fields in sub-seconds.
• **Hardware Camera Sensor Capture**: Extracts real-time tamper-resistant GPS latitude and longitude directly from smartphone EXIF metadata.
• **Two-Factor Authentication (2FA)**: High-priority notifications and faculty mentor OTP verifications are routed via automated SMS and WhatsApp bots.
• **Responsive Mobile-First Interface**: Works seamlessly across budget smartphones, rural Common Service Centers (CSCs), and municipal kiosks.`,
    tags: ["Groq Whisper", "6 Regional Languages", "GPS Geotag", "SMS/WhatsApp 2FA"]
  },
  {
    id: 3,
    category: "Grievance Registration",
    question: 'What is a grievance and what types of grievances can one register on SahayogSetu?',
    shortAnswer: 'Any civic infrastructure, environmental, or public service malfunction. SahayogSetu intelligently bifurcates them into Societal Innovation Challenges and Local Sachivalayam Grievances.',
    fullAnswer: `A grievance on SahayogSetu is any verifiable public deficiency, infrastructural breakdown, or environmental hazard affecting communities.

Groq AI automatically classifies submissions into two specialized operational tracks:
1. **Societal / Technological Innovation Track**:
   Broad, multi-household, or engineering challenges requiring technological solutions.
   *Examples:* High fluoride/arsenic contamination in borewells, broken bridge culverts, solar cold-storage failures in primary health centers, canal siltation, and crop disease outbreaks.
   *Resolution Agency:* University Engineering Teams, Incubators, and Government MoUs.
2. **Grama / Ward Sachivalayam Track**:
   Hyper-local, single-household, or localized doorstep maintenance nuisances.
   *Examples:* Drainage clogged right in front of a private home gate, high-decibel loudspeaker noise disturbances from nearby temples/churches/function halls past midnight, or single street light bulb fusion.
   *Resolution Agency:* Local Grama/Ward Sachivalayam (Panchayat Secretaries & Ward Sanitation Officers).`,
    tags: ["Dual Track", "Engineering Innovation", "Ward Sachivalayam", "Civic Categories"]
  },
  {
    id: 4,
    category: "Grievance Registration",
    question: 'Who can register a grievance on SahayogSetu and how do I register one?',
    shortAnswer: 'Any Indian citizen can register anonymously with zero login or personal data requirements via the Web form or the Regional Language Mic button.',
    fullAnswer: `Any resident of India can register a civic grievance. To eliminate fears of harassment or intimidation, SahayogSetu guarantees **100% Zero-PII Citizen Anonymity** (no name, phone number, or email is ever collected or stored).

**Two Easy Methods to Register:**
1. **Via Regional Voice Recording (Mic Button)**:
   • Click the microphone button on the "Report Grievance" page.
   • Select your mother tongue (or leave as Auto-detect) and speak your problem naturally (e.g. in Telugu, Hindi, Tamil, etc.).
   • Groq Whisper and LLM extract the title, description, category, urgency, and village/mandal details automatically!
2. **Via Standard Ground Proof Form**:
   • Take an authentic photograph of the defect using your camera phone (GPS tags are extracted automatically).
   • Review the auto-populated location and click **Submit Grievance**.`,
    tags: ["Zero-PII", "100% Anonymous", "Mic Recording", "No Login Needed"]
  },
  {
    id: 5,
    category: "Grievance Registration",
    question: 'How do I know that my grievance is registered and how can I track its real-time status?',
    shortAnswer: 'Every submission receives an official standardized Problem Code (e.g. WTR-101, RDS-102, SAN-105) and is tracked in real-time on the public Problem Board.',
    fullAnswer: `Immediately upon submission:
1. **Instant AI Confirmation**: The platform displays the registered **Problem Code** (e.g., \`WTR-101\`, \`RDS-102\`, \`SAN-105\`), assigned category, administrative tier, and target SLA deadline.
2. **Public Live Problem Board**: Your issue appears live on the citizen **Problem Board**, where community members can upvote it and university engineering students can browse it to propose solutions.
3. **Real-Time SLA Countdown**: The system tracks the days elapsed against the official SLA (Village: 7d, Mandal: 15d, District: 30d, State: 90d).
4. **Search by Keyword or Sector**: Search anytime by village name, district, or Sector Code (\`SEC-WTR\`, \`SEC-RDS\`, \`SEC-SAN\`) to inspect active student proposals, pilot grants, or resolution proofs.`,
    tags: ["Problem Code", "SLA Countdown", "Live Tracking", "Sector Search"]
  },
  {
    id: 6,
    category: "Governance & Vigilance",
    question: 'Who is the grievance redressal officer on SahayogSetu?',
    shortAnswer: 'Redressal is driven collaboratively by University Student Innovators, Verified Faculty Mentors, District Collectorates, and Local Sachivalayam Secretaries.',
    fullAnswer: `Redressal is structured through a collaborative governance pipeline tailored to the challenge type:

• **For Systemic Engineering Challenges**:
  - **Lead Innovators**: University Engineering and Research Teams registered under premier technical hubs (IIT Roorkee, IIT Hyderabad, NIT Durgapur, RVCE Bengaluru, etc.).
  - **Academic Mentors**: Department Heads / Senior Professors who authenticate the engineering viability of student proposals via 2-Factor OTP.
  - **Sanctioning Authority**: District Collectorates, Municipal Commissioners, and State Innovation Missions that issue official pilot sanctions and release funding grants.

• **For Hyper-Local Ward Grievances**:
  - **Grama / Ward Sachivalayam Officers**: The designated Panchayat Executive Secretary, Ward Sanitation & Environment Secretary, or Ward Welfare & Police Liaison directly receives the electronic dispatch ticket for ground execution.`,
    tags: ["Faculty Mentors", "District Collectorates", "Sachivalayam Secretaries", "Academic Hubs"]
  },
  {
    id: 7,
    category: "SLA & Redressal",
    question: 'How do I know that a grievance has actually been redressed on the ground?',
    shortAnswer: 'SahayogSetu mandates verifiable Before & After Ground-Truth Photographic Proof before an issue can be marked "Solved".',
    fullAnswer: `On SahayogSetu, a problem is **never** closed merely by an administrative signature or text status update.

**The Ground-Truth Verification Protocol:**
1. **Resolution Proof Upload**: The implementation team or municipal field inspector must submit a genuine geotagged photograph showing the repaired infrastructure or commissioned plant.
2. **Technical Resolution Report**: A comprehensive explanation detailing the engineering methodology, materials used, capacity restored, and testing laboratory verification results (e.g. water TDS/fluoride test report).
3. **Public Showcase in Solved Gallery**: All verified resolutions are immortalized on the citizen **Solved Problems Gallery** with a prominent **SOLVED** badge for open community audit and transparency.`,
    tags: ["Ground Proof", "Before & After", "Solved Gallery", "Public Audit"]
  },
  {
    id: 8,
    category: "SLA & Redressal",
    question: 'What if I am not happy with the redressed grievance? How does escalation and reopening work?',
    shortAnswer: 'Citizens can downvote or re-flag unsatisfactory work. The system penalizes poor durability in the SIH scoring rubric and auto-triggers an Escalation Alert ⚠️.',
    fullAnswer: `Citizen satisfaction is paramount and mathematically enforced:

• **Scoring Rubric Penalty**: In SahayogSetu's official 100-Point Evaluation Matrix, **Reopened Cases & Durability** carries a dedicated 10-point weightage, and **Citizen Satisfaction** carries 20 points. Teams whose fixes fail or get reopened lose competitive rank and pilot grants.
• **Re-opening & Community Downvoting**: If a repaired pipe leaks again or a bridge repair was substandard, citizens can re-flag the grievance.
• **Automated Escalation Engine**:
  - If a problem is re-opened or exceeds its SLA timeline without permanent resolution, the platform automatically flags it as **ESCALATED ALERT ⚠️** in glowing red.
  - Escalated cases are prioritized to the top of the Government Command Center for direct District Collector / State Nodal intervention.`,
    tags: ["Durability Penalty", "Escalation Alert ⚠️", "Re-open Option", "District Review"]
  },
  {
    id: 9,
    category: "SLA & Redressal",
    question: 'What is the official time limit (SLA) for grievance redressal on SahayogSetu?',
    shortAnswer: 'Strict SIH SLA boundaries: Village/Ward Level: 7 Days • Mandal Level: 15 Days • District Level: 30 Days • State Level: 90 Days.',
    fullAnswer: `To prevent bureaucratic paralysis, SahayogSetu enforces strict time limits based on the administrative jurisdiction assigned during Groq AI classification:

| Administrative Tier | Maximum SLA | Scope of Grievances |
| :--- | :--- | :--- |
| **Village / Ward** | **7 Days** | Handpump repairs, doorstep drain desilting, localized garbage removal, fused street lights. |
| **Mandal / Block** | **15 Days** | Distributary irrigation canal breaches, primary healthcare cold-chain solar retrofits, secondary road potholes. |
| **District Level** | **30 Days** | High-fluoride/arsenic community RO plant installations, bridge culvert rebuilds, rural power feeder repairs. |
| **State Level** | **90 Days** | Inter-district highway scouring, multi-village watershed dams, grid-scale renewable energy storage. |

*Note:* If an issue remains unresolved beyond these limits, it triggers autonomous SLA escalation.`,
    tags: ["7-Day SLA", "15-Day SLA", "30-Day SLA", "90-Day SLA", "Strict Matrix"]
  },
  {
    id: 10,
    category: "Grievance Registration",
    question: 'What types of grievances are NOT taken up for redressal by the platform?',
    shortAnswer: 'AI-generated synthetic images, photo-content mismatches, commercial advertisements, private family disputes, and sub-judice legal cases.',
    fullAnswer: `To maintain high integrity for university innovators and government authorities, the following categories are rejected or quarantined:

1. **Synthetic / AI-Generated Photos**: Images created via Midjourney, DALL-E, or Stable Diffusion are detected by our vision heuristics and rejected immediately. Authentic camera photos are required.
2. **Relevance Mismatches**: Submissions where the photo does not match the problem statement (e.g. uploading a picture of a cat for a road pothole grievance) are blocked by the Groq Vision audit.
3. **Sub-Judice Matters**: Disputes currently pending before any Court of Law, Tribunal, or Lokayukta.
4. **Commercial Advertising & Spam**: Promotional solicitations, party political campaigns, or commercial product placements.
5. **Vague / Incoherent Text**: Gibberish or abusive text without identifiable geographic location or civic consequence.`,
    tags: ["Relevance Filter", "No AI Images", "Spam Protection", "Integrity Check"]
  },
  {
    id: 11,
    category: "Platform & Technology",
    question: 'Is citizen feedback taken on grievance redressal and how does it influence solutions?',
    shortAnswer: 'Yes! Citizen Satisfaction carries an official 20-point weightage in the 100-point SIH evaluation matrix, directly influencing government pilot grant funding.',
    fullAnswer: `Citizen feedback is not merely a survey on SahayogSetu—it directly determines which university engineering solutions receive government funding!

Under the **Official Smart India Hackathon 6-Parameter Evaluation Matrix (100 Points Total)**:
• **Resolution Rate**: 30 Points
• **Average Closure Time vs SLA**: 20 Points
• **Citizen Satisfaction Score**: **20 Points** (direct community voting and satisfaction ratings)
• **Escalation Risk Percentage**: 10 Points
• **Durability / Reopened Cases**: 10 Points
• **Innovation & Frugal Tech**: 10 Points

Citizens can upvote student proposals on the Problem Detail page. Teams with high citizen satisfaction rise to Rank #1 on the Government Command Desk, unlocking ₹1,50,000 District Pilot Grants.`,
    tags: ["20-Point Weightage", "SIH 100-Pt Matrix", "Community Upvoting", "Pilot Funding"]
  },
  {
    id: 12,
    category: "Governance & Vigilance",
    question: 'Who acts as the "Audit Officer" on SahayogSetu?',
    shortAnswer: 'SahayogSetu utilizes a dual audit model: Autonomous Groq Multimodal AI Vision Audit + Registered University Faculty Nodal Officers & District Authorities.',
    fullAnswer: `Audit oversight operates in two complementary layers:

1. **Autonomous AI Audit Layer**:
   • Groq Vision models inspect uploaded ground-proof images to verify subject authenticity.
   • EXIF parsing modules extract hardware camera geotags (GPS latitude/longitude) and detect digital synthetic artifacts.
   • Cross-locality similarity engines flag duplicate complaints within the same mandal/district.

2. **Human Administrative & Nodal Audit Layer**:
   • **Academic Faculty Nodal Officers**: Registered Deans and Department Chairs at premier institutions authenticate student proposals via two-factor OTP before submission to government desks.
   • **District Collectorate Nodal Desks**: Government officials physically inspect pilot installations before signing off on full implementation and grant disbursals.`,
    tags: ["Dual Audit", "AI Vision Audit", "Faculty Nodal Officer", "District Collector"]
  },
  {
    id: 13,
    category: "Governance & Vigilance",
    question: 'How do I register grievances related to corruption, bribery, illegal sand mining, or excise violations?',
    shortAnswer: 'These are treated as High-Priority Integrity & Vigilance issues. Our Zero-PII architecture completely protects whistleblower identity.',
    fullAnswer: `Grievances involving corruption, bribery demands by public servants, illegal riverbed sand mining, or excise violations require absolute whistleblower confidentiality:

• **Zero-PII Protection**: SahayogSetu does not store IP addresses, citizen names, or phone numbers. Whistleblowers can safely document illegal dumping, sand extraction, or bribery without fear of retaliation.
• **Confidential Routing**: These grievances bypass the public university innovation board and are securely segregated directly into the **Government Command Center\'s Vigilance Desk**.
• **GPS Ground Proof**: Submitting genuine photographic evidence with camera geotags provides immediate empirical proof for vigilance and enforcement branch inspections.`,
    tags: ["Whistleblower Safe", "Zero-PII", "Vigilance Desk", "Confidential"]
  },
  {
    id: 14,
    category: "Grievance Registration",
    question: 'Can I use SahayogSetu for raising a new application or routine citizen service request?',
    shortAnswer: 'No. Routine welfare and certificate applications (Aadhaar, Caste, Ration card) go to CSC / Meeseva. SahayogSetu is dedicated to civic malfunctions and societal challenges.',
    fullAnswer: `It is vital to distinguish between a **Public Service Application** and a **Civic Grievance / Challenge**:

• **What SahayogSetu IS For**:
  Broken roads, contaminated water supplies, non-functional government hospital machines, defective solar plants, clogged municipal drains, canal siltation, and public infrastructure defects.
• **What SahayogSetu IS NOT For**:
  Routine individual certificate or welfare scheme applications (e.g. applying for a new Ration Card, Caste/Income Certificate, Birth Certificate, Aadhaar update, or Land Title Deed).
  *Where to go:* For routine service requests, citizens should visit their local **Common Service Center (CSC), Meeseva, or State Citizen Service Portal**.

However, if your village school has no drinking water or your street drain has collapsed, SahayogSetu is the exact platform to get it solved!`,
    tags: ["Scope Distinction", "CSC / Meeseva", "Civic Grievances Only"]
  }
];

export const FAQ_CATEGORIES = [
  "All",
  "Platform & Technology",
  "Grievance Registration",
  "SLA & Redressal",
  "Governance & Vigilance"
];

export default function FAQPage({ onNavigateBoard, onNavigateReport }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(1); // open first FAQ by default

  const toggleFAQ = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchCategory = selectedCategory === "All" || faq.category === selectedCategory;
      if (!matchCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inQuestion = faq.question.toLowerCase().includes(q);
        const inShort = faq.shortAnswer.toLowerCase().includes(q);
        const inFull = faq.fullAnswer.toLowerCase().includes(q);
        const inTags = faq.tags.some(t => t.toLowerCase().includes(q));
        return inQuestion || inShort || inFull || inTags;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Nav Back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={onNavigateBoard} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} color="#0a3977" />
          <span>Back to Problem Board</span>
        </button>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Official Citizen Knowledge Base • <strong>Smart India Hackathon</strong>
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0a3977 0%, #0f2744 50%, #1e3a8a 100%)',
        color: '#ffffff',
        padding: '36px 32px',
        borderRadius: '12px',
        marginBottom: '28px',
        boxShadow: '0 8px 24px rgba(10, 57, 119, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '12px' }}>
            <HelpCircle size={15} color="#38bdf8" />
            <span>Frequently Asked Questions & Portal Architecture</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            Public Grievance Redressal System (PGRS) FAQs
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', maxWidth: '780px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            Everything you need to know about SahayogSetu: AI-driven autonomous triage, Zero-PII citizen privacy, 6 regional Indian languages, SLA timelines, and university engineering pilot funding.
          </p>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onNavigateReport}
              className="btn-accent"
              style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={16} />
              <span>Report a Problem Now</span>
            </button>
            <button
              onClick={onNavigateBoard}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Explore Live Problems</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="gov-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search FAQs (e.g., 'SLA time limit', 'voice intake', 'Sachivalayam', 'corruption', 'anonymity')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '40px', fontSize: '0.9rem' }}
          />
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FAQ_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: selectedCategory === cat ? '#0a3977' : '#f1f5f9',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                border: selectedCategory === cat ? '1px solid #0a3977' : '1px solid #e2e8f0'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredFAQs.length === 0 ? (
          <div className="gov-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <HelpCircle size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f2744', marginBottom: '6px' }}>
              No matching FAQs found
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Try searching with different keywords like "SLA", "voice", "Sachivalayam", or "audit".
            </p>
          </div>
        ) : (
          filteredFAQs.map((faq, idx) => {
            const isOpen = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="gov-card"
                style={{
                  border: isOpen ? '1.5px solid #0a3977' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isOpen ? '0 4px 16px rgba(10, 57, 119, 0.08)' : 'none'
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleFAQ(faq.id)}
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isOpen ? '#f8fafc' : '#ffffff',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, paddingRight: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isOpen ? '#0a3977' : '#e0f2fe',
                      color: isOpen ? '#ffffff' : '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {faq.id}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          background: '#f1f5f9',
                          color: '#0369a1',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: '700'
                        }}>
                          {faq.category}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: '700', color: isOpen ? '#0a3977' : '#0f2744', margin: 0, lineHeight: '1.4' }}>
                        {faq.question}
                      </h3>
                      {!isOpen && (
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                          {faq.shortAnswer}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isOpen ? '#e0f2fe' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}>
                    {isOpen ? (
                      <ChevronUp size={18} color="#0a3977" />
                    ) : (
                      <ChevronDown size={18} color="#64748b" />
                    )}
                  </div>
                </div>

                {/* Accordion Body */}
                {isOpen && (
                  <div style={{
                    padding: '0 22px 22px 64px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div style={{
                      fontSize: '0.88rem',
                      color: '#334155',
                      lineHeight: '1.65',
                      whiteSpace: 'pre-line',
                      paddingTop: '16px'
                    }}>
                      {faq.fullAnswer}
                    </div>

                    {/* Tags */}
                    {faq.tags && faq.tags.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Key Features:</span>
                        {faq.tags.map(tag => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.72rem',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#0a3977',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still have questions footer card */}
      <div style={{
        marginTop: '36px',
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '10px',
        padding: '22px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#166534', margin: 0 }}>
              Need to Report a Civic Challenge Right Away?
            </h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#15803d' }}>
              Your submission is 100% anonymous. Zero personal identification is required.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateReport}
          className="btn-accent"
          style={{ fontSize: '0.85rem', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Sparkles size={16} />
          <span>Submit Grievance Now</span>
        </button>
      </div>
    </div>
  );
}
