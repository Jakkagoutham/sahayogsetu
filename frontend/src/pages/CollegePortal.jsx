import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, Award, CheckCircle2, ChevronRight, 
  MapPin, Clock, ArrowUpRight, Sparkles, Trophy, BookOpen, 
  FileCheck, ShieldCheck, Plus, Filter, ChevronLeft, Layers 
} from 'lucide-react';
import SolutionSubmitModal from '../components/SolutionSubmitModal';
import SectorFilterBar from '../components/SectorFilterBar';

const PRELOADED_COLLEGES = [
  {
    id: "iit-roorkee",
    name: "IIT Roorkee",
    fullName: "Indian Institute of Technology Roorkee",
    hubCode: "HUB-IITR-01",
    state: "Uttarakhand / UP",
    nodalOfficer: "Prof. S. K. Bhattacharya",
    nodalEmail: "innovation.hub@iitr.ac.in",
    activeTeams: 18,
    submittedSolutionsCount: 8,
    avgScore: 92.4,
    nationalRank: 2,
    badge: "Tier-1 Premier Hub"
  },
  {
    id: "nit-durgapur",
    name: "NIT Durgapur",
    fullName: "National Institute of Technology Durgapur",
    hubCode: "HUB-NITD-09",
    state: "West Bengal",
    nodalOfficer: "Dr. Mousumi Sen",
    nodalEmail: "iic.head@nitdgp.ac.in",
    activeTeams: 12,
    submittedSolutionsCount: 5,
    avgScore: 88.0,
    nationalRank: 7,
    badge: "Center of Excellence"
  },
  {
    id: "rvce-bengaluru",
    name: "RV College of Engineering",
    fullName: "RV College of Engineering, Bengaluru",
    hubCode: "HUB-RVCE-24",
    state: "Karnataka",
    nodalOfficer: "Dr. K. N. Subramanya",
    nodalEmail: "ruraltech@rvce.edu.in",
    activeTeams: 15,
    submittedSolutionsCount: 6,
    avgScore: 89.2,
    nationalRank: 5,
    badge: "Autonomous Innovation Lab"
  },
  {
    id: "iit-hyderabad",
    name: "IIT Hyderabad",
    fullName: "Indian Institute of Technology Hyderabad",
    hubCode: "HUB-IITH-03",
    state: "Telangana",
    nodalOfficer: "Prof. B. S. Murty",
    nodalEmail: "rutag@iith.ac.in",
    activeTeams: 22,
    submittedSolutionsCount: 9,
    avgScore: 94.8,
    nationalRank: 1,
    badge: "Top Ranked National Hub"
  },
  {
    id: "nit-patna",
    name: "NIT Patna",
    fullName: "National Institute of Technology Patna",
    hubCode: "HUB-NITP-15",
    state: "Bihar",
    nodalOfficer: "Dr. P. K. Jain",
    nodalEmail: "civictech@nitp.ac.in",
    activeTeams: 9,
    submittedSolutionsCount: 4,
    avgScore: 86.5,
    nationalRank: 11,
    badge: "State Emerging Hub"
  }
];

export default function CollegePortal({ problems, onSelectProblem, onProblemUpdated }) {
  const [selectedCollegeId, setSelectedCollegeId] = useState("iit-roorkee");
  const [activeSubTab, setActiveSubTab] = useState("challenges"); // 'challenges' | 'solutions' | 'leaderboard'
  const [selectedProblemForModal, setSelectedProblemForModal] = useState(null);

  // Filter & Search states (From screenshot)
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('recent_rating');

  // Pagination states to prevent infinite scroll on thousands/lakhs of problems
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const currentCollege = PRELOADED_COLLEGES.find(c => c.id === selectedCollegeId) || PRELOADED_COLLEGES[0];

  // Filter solutions belonging to this college
  const allSolutions = useMemo(() => {
    return problems.flatMap(p => 
      (p.solutions || []).map(s => ({ 
        ...s, 
        problemTitle: p.title, 
        problemCategory: p.category, 
        problemLevel: p.level, 
        problemId: p.id,
        pilotSanctioned: p.pilotSanctioned
      }))
    );
  }, [problems]);

  const collegeSolutions = useMemo(() => {
    return allSolutions.filter(s => 
      s.institution?.toLowerCase().includes(currentCollege.name.toLowerCase()) ||
      s.institution?.toLowerCase().includes(currentCollege.id.toLowerCase())
    );
  }, [allSolutions, currentCollege]);

  // Filter problems for the challenges tab
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchLev = selectedLevel === 'All' || p.level?.toLowerCase() === selectedLevel.toLowerCase();
      const matchUrg = selectedUrgency === 'All' || p.urgency?.toLowerCase() === selectedUrgency.toLowerCase();
      
      let matchStat = true;
      if (selectedStatus === 'Open') matchStat = p.status !== 'Solved';
      else if (selectedStatus === 'Pilot Sanctioned') matchStat = p.pilotSanctioned || p.status === 'Pilot Sanctioned';
      else if (selectedStatus === 'Solved') matchStat = p.status === 'Solved';

      let matchSearch = true;
      if (search) {
        const q = search.trim().toLowerCase().replace(/^#/, '');
        const title = p.title?.toLowerCase() || '';
        const desc = p.description?.toLowerCase() || '';
        const vill = p.location?.village?.toLowerCase() || '';
        const dist = p.location?.district?.toLowerCase() || '';
        const state = p.location?.state?.toLowerCase() || '';
        const sec = (p.sectorCode || '').toLowerCase();
        const code = (p.problemCode || '').toLowerCase();
        
        matchSearch = title.includes(q) || desc.includes(q) || vill.includes(q) || dist.includes(q) || state.includes(q) || sec.includes(q) || code.includes(q);
      }

      return matchCat && matchLev && matchUrg && matchStat && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'recent_rating') {
        const rateA = (Number(a.rating) || 0) * 20 + (a.topAiScore || 0);
        const rateB = (Number(b.rating) || 0) * 20 + (b.topAiScore || 0);
        return rateB - rateA;
      }
      if (sortBy === 'urgency') {
        const map = { High: 3, Medium: 2, Low: 1 };
        return (map[b.urgency] || 1) - (map[a.urgency] || 1);
      }
      if (sortBy === 'ai_score') {
        return (b.topAiScore || 0) - (a.topAiScore || 0);
      }
      if (sortBy === 'solutions') {
        return (b.solutionCount || 0) - (a.solutionCount || 0);
      }
      return 0;
    });
  }, [problems, selectedCategory, selectedLevel, selectedUrgency, selectedStatus, search, sortBy]);

  // Paginated records
  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage) || 1;
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProblems.slice(start, start + itemsPerPage);
  }, [filteredProblems, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)));
    // Scroll smoothly to start of challenges
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* 1. Top Identity Banner: College Hub Profile */}
      <div className="glass-card" style={{ padding: '22px 24px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
            }}>
              <Building2 size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  {currentCollege.hubCode}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {currentCollege.state} • Nodal Head: <strong style={{ color: '#f8fafc' }}>{currentCollege.nodalOfficer}</strong>
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>
                {currentCollege.fullName}
              </h1>
            </div>
          </div>

          {/* Quick Technical Hub Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Select College Hub:</span>
            <select
              value={selectedCollegeId}
              onChange={(e) => {
                setSelectedCollegeId(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
              style={{ width: 'auto', minWidth: '220px', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(15, 23, 42, 0.9)', height: '38px', fontSize: '0.82rem' }}
            >
              {PRELOADED_COLLEGES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Performance Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Active Student Teams</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8' }}>{currentCollege.activeTeams} Teams</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Proposals & Solutions</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#4ade80' }}>
              {collegeSolutions.length > 0 ? collegeSolutions.length : currentCollege.submittedSolutionsCount} Solved
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Average AI Merit Score</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24' }}>{currentCollege.avgScore} / 100</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>National Hub Ranking</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#c084fc' }}>Rank #{currentCollege.nationalRank} 🇮🇳</div>
          </div>
        </div>
      </div>

      {/* 2. STICKY ACTION DOCK: Solves the large-scale scrolling problem!
          Tab buttons stay locked at top so students never have to scroll to bottom to find buttons */}
      <div style={{
        position: 'sticky',
        top: '64px',
        zIndex: 60,
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(16px)',
        padding: '10px 0',
        marginBottom: '18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveSubTab('challenges'); setCurrentPage(1); }}
            className={activeSubTab === 'challenges' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <BookOpen size={15} />
            <span>Available Challenges ({filteredProblems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('solutions')}
            className={activeSubTab === 'solutions' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <FileCheck size={15} />
            <span>Our Hub's Solutions ({collegeSolutions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={activeSubTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <Trophy size={15} />
            <span>National Hub Leaderboard</span>
          </button>
        </div>

        {/* Quick count indicator */}
        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Displaying: <strong style={{ color: '#60a5fa' }}>{filteredProblems.length}</strong> Societal Challenges
        </div>
      </div>

      {/* 3. Sub-Tab 1: Available Challenges with Sector Code Filter Bar & Pagination */}
      {activeSubTab === 'challenges' && (
        <div>
          {/* Sector Code Filter Bar as requested in image */}
          <SectorFilterBar
            search={search}
            setSearch={setSearch}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            selectedUrgency={selectedUrgency}
            setSelectedUrgency={setSelectedUrgency}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            totalResultsCount={filteredProblems.length}
          />

          {/* Cards Grid */}
          {paginatedProblems.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '14px' }}>
                No challenges found matching your sector code or filter criteria.
              </p>
              <button 
                onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedLevel('All'); setSelectedUrgency('All'); setSelectedStatus('All'); }}
                className="btn-secondary"
              >
                Reset Sector Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '18px',
              marginBottom: '24px'
            }}>
              {paginatedProblems.map(prob => (
                <div 
                  key={prob.id}
                  className="glass-card"
                  style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    border: prob.pilotSanctioned ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge-category badge-water" style={{ fontSize: '0.7rem' }}>
                        {prob.category}
                      </span>
                      {prob.sectorCode && (
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px' }}>
                          {prob.sectorCode}
                        </span>
                      )}
                      {prob.pilotSanctioned && (
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80', padding: '1px 6px', borderRadius: '4px' }}>
                          🚀 PILOT SANCTIONED
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: '600' }}>
                      SLA: {prob.maxResolutionDays}d ({prob.level})
                    </span>
                  </div>

                  <h3 
                    onClick={() => onSelectProblem(prob.id)}
                    style={{ fontSize: '0.98rem', fontWeight: '700', color: '#f8fafc', marginBottom: '6px', cursor: 'pointer', lineHeight: '1.4' }}
                  >
                    {prob.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '10px' }}>
                    <MapPin size={13} color="#f97316" />
                    <span>{prob.location?.village}, {prob.location?.district}, {prob.location?.state}</span>
                  </div>

                  <p style={{
                    fontSize: '0.82rem',
                    color: '#cbd5e1',
                    lineHeight: '1.5',
                    marginBottom: '14px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1
                  }}>
                    {prob.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                      {prob.solutionCount || 0} Existing Solutions
                    </span>
                    <button 
                      onClick={() => setSelectedProblemForModal(prob)}
                      className="btn-accent"
                      style={{ fontSize: '0.74rem', padding: '6px 12px' }}
                    >
                      <Plus size={13} />
                      <span>Submit Solution</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. PAGINATION CONTROLS: Solves large-scale scroll problem for Lakhs of problems */}
          {filteredProblems.length > itemsPerPage && (
            <div className="glass-card" style={{
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="input-field"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.78rem', height: '32px' }}
                >
                  <option value={6}>6 items</option>
                  <option value={12}>12 items</option>
                  <option value={24}>24 items</option>
                  <option value={50}>50 items</option>
                </select>
                <span>(Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProblems.length)} of {filteredProblems.length})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '6px 11px', fontSize: '0.78rem', minWidth: '32px' }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Our College's Solutions Portfolio */}
      {activeSubTab === 'solutions' && (
        <div>
          {collegeSolutions.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <Sparkles size={36} color="#4ade80" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No Solutions Submitted Yet for {currentCollege.name}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
                Select an open challenge from the Available Challenges tab and submit your student team's engineering prototype!
              </p>
              <button onClick={() => setActiveSubTab('challenges')} className="btn-primary">
                Browse Open Challenges
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {collegeSolutions.map(sol => (
                <div key={sol.id} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', background: 'rgba(16, 185, 129, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px' }}>
                          COLLEGE SUBMISSION
                        </span>
                        {sol.pilotSanctioned && (
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.25)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                            🚀 PILOT SANCTIONED
                          </span>
                        )}
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc' }}>
                          {sol.teamName}
                        </h3>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        Lead: <strong style={{ color: '#cbd5e1' }}>{sol.contactLead}</strong> | Target: <strong style={{ color: '#60a5fa' }}>{sol.problemTitle}</strong>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(251, 191, 36, 0.12)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: '700' }}>GROQ AI EVALUATION</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24' }}>
                        {sol.aiEvaluation?.totalScore || 85} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ 100</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '12px' }}>
                    {sol.description}
                  </p>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem'
                  }}>
                    <span style={{ color: '#94a3b8' }}>
                      Est. Budget: <strong style={{ color: '#4ade80' }}>{sol.estimatedBudget}</strong> • Time: <strong style={{ color: '#38bdf8' }}>{sol.implementationTimeDays} Days</strong>
                    </span>
                    <button 
                      onClick={() => onSelectProblem(sol.problemId)}
                      className="btn-secondary"
                      style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                    >
                      <span>Inspect Challenge</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: National Leaderboard */}
      {activeSubTab === 'leaderboard' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Trophy size={20} color="#fbbf24" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
              National Technical Hub Leaderboard (SIH Grand Challenge)
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '18px' }}>
            Universities and engineering colleges ranked by solved societal challenges, average AI merit score, and ground pilot impact.
          </p>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)'
          }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: '700' }}>Rank</th>
                <th style={{ padding: '10px 14px', color: '#f8fafc', fontWeight: '700' }}>Institution Name</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: '700' }}>State</th>
                <th style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: '700', textAlign: 'center' }}>Active Teams</th>
                <th style={{ padding: '10px 14px', color: '#4ade80', fontWeight: '700', textAlign: 'center' }}>Solutions</th>
                <th style={{ padding: '10px 14px', color: '#fbbf24', fontWeight: '700', textAlign: 'right' }}>Avg AI Score</th>
              </tr>
            </thead>
            <tbody>
              {PRELOADED_COLLEGES
                .sort((a, b) => b.avgScore - a.avgScore)
                .map((col, idx) => (
                  <tr 
                    key={col.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: col.id === currentCollege.id ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: '800', color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : '#64748b' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#f8fafc' }}>
                      {col.fullName}
                      {col.id === currentCollege.id && (
                        <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#10b981', color: 'black', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          YOUR HUB
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{col.state}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#38bdf8', fontWeight: '600' }}>{col.activeTeams}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#4ade80', fontWeight: '600' }}>{col.submittedSolutionsCount}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#fbbf24', fontWeight: '800' }}>{col.avgScore} / 100</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Solution Submit Modal with prefilled college */}
      {selectedProblemForModal && (
        <SolutionSubmitModal
          isOpen={!!selectedProblemForModal}
          onClose={() => setSelectedProblemForModal(null)}
          problem={selectedProblemForModal}
          onSolutionSubmitted={(newSol) => {
            if (onProblemUpdated) onProblemUpdated();
            setSelectedProblemForModal(null);
          }}
        />
      )}
    </div>
  );
}
