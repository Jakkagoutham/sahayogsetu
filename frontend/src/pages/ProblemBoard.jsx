import React, { useState } from 'react';
import { Search, MapPin, Clock, AlertTriangle, Award, Star, MessageSquare, ShieldCheck, CheckCircle2, ArrowUpDown, Filter, Tag } from 'lucide-react';

const CATEGORIES = ["All", "Water", "Roads", "Health", "Agriculture", "Sanitation", "Education", "Other"];
const LEVELS = ["All", "Village/Ward", "Mandal", "District", "State"];
const URGENCIES = ["All", "High", "Medium", "Low"];
const STATUSES = ["All", "Open", "Solved"];

// Standardized Unique Sector Codes across Civic Portals
const SECTOR_CHIPS = [
  { code: 'SEC-WTR', label: 'Water', icon: '💧' },
  { code: 'SEC-RDS', label: 'Roads', icon: '🛣️' },
  { code: 'SEC-HLT', label: 'Health', icon: '🏥' },
  { code: 'SEC-AGR', label: 'Agriculture', icon: '🌾' },
  { code: 'SEC-PWR', label: 'Power', icon: '⚡' },
  { code: 'SEC-SAN', label: 'Sanitation', icon: '🧹' },
  { code: 'SEC-EDU', label: 'Education', icon: '📚' },
  { code: 'SEC-GOV', label: 'Civic Safety', icon: '🏛️' },
  { code: 'SEC-ENV', label: 'Environment', icon: '🌱' }
];

// Helper to format upload recency
function formatRecency(isoDate) {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export default function ProblemBoard({ problems, onSelectProblem, loading }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('recent_rating'); // 'recent_rating' | 'urgency_ai' | 'ai_score' | 'recent'

  // Filter problems with Sector Code & Keyword support
  let filteredProblems = problems.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchLevel = selectedLevel === 'All' || p.level?.toLowerCase() === selectedLevel.toLowerCase();
    const matchUrgency = selectedUrgency === 'All' || p.urgency?.toLowerCase() === selectedUrgency.toLowerCase();
    const matchStatus = selectedStatus === 'All' || (p.status || 'Open').toLowerCase() === selectedStatus.toLowerCase();
    
    const q = search.trim().toLowerCase().replace(/^#/, '');
    const sectorCode = (p.sectorCode || '').toLowerCase();
    const problemCode = (p.problemCode || '').toLowerCase();

    const matchSearch = !q || 
      p.title?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q) ||
      p.location?.village?.toLowerCase().includes(q) ||
      p.location?.district?.toLowerCase().includes(q) ||
      p.location?.state?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      sectorCode.includes(q) ||
      problemCode.includes(q) ||
      (q === 'wtr' && sectorCode === 'sec-wtr') ||
      (q === 'rds' && sectorCode === 'sec-rds') ||
      (q === 'hlt' && sectorCode === 'sec-hlt') ||
      (q === 'agr' && sectorCode === 'sec-agr') ||
      (q === 'san' && sectorCode === 'sec-san') ||
      (q === 'pwr' && sectorCode === 'sec-pwr') ||
      (q === 'edu' && sectorCode === 'sec-edu') ||
      (q === 'gov' && sectorCode === 'sec-gov') ||
      (q === 'env' && sectorCode === 'sec-env');

    return matchCategory && matchLevel && matchUrgency && matchStatus && matchSearch;
  });

  // Sort problems: User requirement: "when i search anything , show the recent uploads first with high rating"
  const urgencyWeight = { High: 3, Medium: 2, Low: 1 };
  filteredProblems.sort((a, b) => {
    if (search.trim() || sortBy === 'recent_rating') {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      const dayA = Math.floor(timeA / (1000 * 60 * 60 * 24));
      const dayB = Math.floor(timeB / (1000 * 60 * 60 * 24));

      // 1. Primary: Recent upload day first
      if (dayB !== dayA) {
        return dayB - dayA;
      }
      // 2. Secondary: Highest Rating & AI score
      const rateA = (Number(a.rating) || 0) * 20 + (a.topAiScore || 0);
      const rateB = (Number(b.rating) || 0) * 20 + (b.topAiScore || 0);
      if (rateB !== rateA) {
        return rateB - rateA;
      }
      return timeB - timeA;
    } else if (sortBy === 'urgency_ai') {
      // Primary: Urgency (High > Medium > Low)
      const urgA = urgencyWeight[a.urgency] || 1;
      const urgB = urgencyWeight[b.urgency] || 1;
      if (urgB !== urgA) return urgB - urgA;

      // Secondary: AI Rating & Score
      const scoreA = (a.topAiScore || 0) + (Number(a.rating) || 0) * 10;
      const scoreB = (b.topAiScore || 0) + (Number(b.rating) || 0) * 10;
      if (scoreB !== scoreA) return scoreB - scoreA;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    } else if (sortBy === 'ai_score') {
      const scoreA = (a.topAiScore || 0);
      const scoreB = (b.topAiScore || 0);
      return scoreB - scoreA;
    } else {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  const getCategoryClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'water': return 'badge-water';
      case 'roads': return 'badge-roads';
      case 'health': return 'badge-health';
      case 'agriculture': return 'badge-agri';
      case 'sanitation': return 'badge-sanitation';
      case 'education': return 'badge-education';
      default: return 'badge-other';
    }
  };

  const totalOpen = problems.filter(p => (p.status || 'Open') === 'Open').length;
  const totalSolved = problems.filter(p => p.status === 'Solved').length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 20px' }}>
      {/* Page Masthead Title */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderLeft: '5px solid #0a3977',
        borderRadius: '6px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0a3977' }}>
              National Civic Grievance & Problem Board
            </h1>
          </div>
          <p style={{ color: '#475569', fontSize: '0.9rem', maxWidth: '780px' }}>
            Public societal complaints triaged by Groq AI and sorted strictly by <strong>Urgency Level</strong> and <strong>AI Merit Rating</strong>. Open for university student solution submissions and administrative sanctions.
          </p>
        </div>

        {/* Status Tab Counters */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '5px',
            padding: '8px 14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>ACTIVE ISSUES</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#b45309' }}>{totalOpen}</div>
          </div>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '5px',
            padding: '8px 14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '600' }}>SOLVED (WITH PROOF)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#15803d' }}>{totalSolved}</div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar (Government White Card) */}
      <div className="gov-card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        {/* Quick Sector Code Navigator */}
        <div style={{
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#0a3977' }}>
              <Tag size={15} color="#0a3977" />
              <span>SEARCH BY UNIQUE SECTOR CODE:</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>
                (Type or click any sector code to retrieve all problems in that sector)
              </span>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✕ Clear Search Code
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
            {SECTOR_CHIPS.map(chip => {
              const isActive = search.toUpperCase() === chip.code || search.toUpperCase() === chip.code.replace('SEC-', '');
              return (
                <button
                  key={chip.code}
                  onClick={() => {
                    if (isActive) {
                      setSearch('');
                    } else {
                      setSearch(chip.code);
                      setSortBy('recent_rating');
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 11px',
                    borderRadius: '5px',
                    fontSize: '0.76rem',
                    fontWeight: isActive ? '800' : '600',
                    background: isActive ? '#0a3977' : '#f8fafc',
                    color: isActive ? '#ffffff' : '#0f2744',
                    border: isActive ? '1px solid #0a3977' : '1px solid #cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(10,57,119,0.25)' : 'none'
                  }}
                  title={`Click to filter by ${chip.code} (${chip.label})`}
                >
                  <span>{chip.icon}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '800' }}>{chip.code}</span>
                  <span style={{ opacity: isActive ? 0.9 : 0.75 }}>({chip.label})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, village, or Sector Code (e.g. SEC-WTR, SEC-RDS, SEC-HLT)..."
              className="input-field"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Status Filter (All, Open, Solved) */}
          <div style={{ minWidth: '140px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
              style={{ fontWeight: '600' }}
            >
              <option value="All">Status: All</option>
              <option value="Open">Status: Active / Open</option>
              <option value="Solved">Status: Solved / Resolved</option>
            </select>
          </div>

          {/* Level Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="input-field"
            >
              <option value="All">All Admin Levels</option>
              <option value="Village/Ward">Village/Ward (7d SLA)</option>
              <option value="Mandal">Mandal (15d SLA)</option>
              <option value="District">District (30d SLA)</option>
              <option value="State">State (Special Review)</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="input-field"
            >
              <option value="All">All Urgency</option>
              <option value="High">High Urgency</option>
              <option value="Medium">Medium Urgency</option>
              <option value="Low">Low Urgency</option>
            </select>
          </div>

          {/* Sort By Dropdown (Recent with High Rating ⭐, Urgency & AI Rating) */}
          <div style={{ minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} color="#0a3977" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
                style={{ fontWeight: '700', color: '#0a3977' }}
              >
                <option value="recent_rating">Sort: Recent Uploads + High Rating ⭐</option>
                <option value="urgency_ai">Sort: Urgency & AI Rating</option>
                <option value="ai_score">Sort: Highest AI Score</option>
                <option value="recent">Sort: Most Recently Reported</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Result Feedback Banner */}
        {search.trim() && (
          <div style={{
            marginTop: '12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '5px',
            padding: '8px 14px',
            fontSize: '0.78rem',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔍 Results for: <strong>"{search}"</strong></span>
              <span style={{ background: '#dbeafe', padding: '1px 7px', borderRadius: '4px', fontWeight: '700' }}>
                Sorted: Recent Uploads First with High Rating ⭐
              </span>
            </div>
            <span style={{ color: '#64748b' }}>
              {filteredProblems.length} societal problem{filteredProblems.length === 1 ? '' : 's'} found
            </span>
          </div>
        )}

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginTop: '14px',
          paddingTop: '14px',
          borderTop: '1px solid #e2e8f0',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginRight: '4px' }}>
            Category:
          </span>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? '700' : '500',
                  background: isSelected ? '#0a3977' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  border: isSelected ? '1px solid #0a3977' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading official societal problems...</div>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="gov-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '16px' }}>
            No societal grievances found matching the selected filters.
          </p>
          <button 
            onClick={() => { 
              setSearch(''); 
              setSelectedCategory('All'); 
              setSelectedLevel('All'); 
              setSelectedUrgency('All'); 
              setSelectedStatus('All'); 
            }}
            className="btn-secondary"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '22px'
        }}>
          {filteredProblems.map(prob => {
            const isOverdue = prob.isEscalated;
            const daysLeft = Math.max(0, (prob.maxResolutionDays || 7) - (prob.daysOpen || 0));
            const isSolved = prob.status === 'Solved';

            return (
              <div 
                key={prob.id} 
                onClick={() => onSelectProblem(prob.id)}
                className="gov-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  border: isSolved ? '2px solid #86efac' : '1px solid #cbd5e1',
                  background: '#ffffff'
                }}
              >
                {/* Photo Header */}
                <div style={{ position: 'relative', height: '175px', background: '#e2e8f0', overflow: 'hidden' }}>
                  <img 
                    src={isSolved && prob.resolutionProof?.photoUrl ? prob.resolutionProof.photoUrl : prob.photoUrl} 
                    alt={prob.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {/* Category Pill & Sector Code */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <span className={`badge-category ${getCategoryClass(prob.category)}`}>
                      {prob.category}
                    </span>
                    <span style={{
                      background: '#0a3977',
                      color: '#ffffff',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      letterSpacing: '0.4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {prob.sectorCode || 'SEC-GEN'}
                    </span>
                    <span style={{
                      background: '#ffffff',
                      color: '#0a3977',
                      border: '1px solid #cbd5e1',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {prob.problemCode || prob.id}
                    </span>
                  </div>

                  {/* Status / Urgency Badge */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                    {prob.pilotSanctioned && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        background: '#166534',
                        color: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}>
                        <span>🚀 PILOT SANCTIONED</span>
                      </div>
                    )}
                    {isSolved ? (
                      <div className="badge-solved" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        <CheckCircle2 size={13} />
                        <span>SOLVED</span>
                      </div>
                    ) : (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: prob.urgency === 'High' ? '#dc2626' : '#d97706',
                        color: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}>
                        {prob.urgency === 'High' && <div className="urgency-pulse-dot" style={{ backgroundColor: '#ffffff' }} />}
                        <span>{prob.urgency} Urgency</span>
                      </div>
                    )}
                  </div>

                  {/* Ground Proof Geotag Strip */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '10px',
                    background: 'rgba(15, 39, 68, 0.9)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <ShieldCheck size={12} color="#4ade80" />
                    <span>{isSolved ? "Resolution Proof Verified" : "GPS Geotag Verified"}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.02rem',
                    fontWeight: '700',
                    color: '#0a3977',
                    lineHeight: '1.4',
                    marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {prob.title}
                  </h3>

                  {/* Location with Pin */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.8rem',
                    color: '#475569',
                    marginBottom: '10px'
                  }}>
                    <MapPin size={13} color="#ea580c" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prob.location?.village}, {prob.location?.district}, {prob.location?.state}
                    </span>
                  </div>

                  {/* Description snippet */}
                  <p style={{
                    fontSize: '0.84rem',
                    color: '#334155',
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

                  {/* SLA Timeline Banner */}
                  <div style={{
                    background: isSolved ? '#f0fdf4' : isOverdue ? '#fef2f2' : '#f8fafc',
                    border: isSolved ? '1px solid #bbf7d0' : isOverdue ? '1px solid #fecaca' : '1px solid #e2e8f0',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} color={isSolved ? '#15803d' : isOverdue ? '#dc2626' : '#d97706'} />
                      <span style={{ color: '#475569' }}>{prob.level} SLA:</span>
                      <strong style={{ color: '#0f2744' }}>{prob.maxResolutionDays} Days</strong>
                    </div>

                    {isSolved ? (
                      <span style={{ color: '#15803d', fontWeight: '700' }}>
                        ✓ Resolved on Ground
                      </span>
                    ) : isOverdue ? (
                      <span style={{ color: '#b91c1c', fontWeight: '700' }}>
                        ⚠️ Escalated ({prob.daysOpen}d)
                      </span>
                    ) : (
                      <span style={{ color: '#15803d', fontWeight: '600' }}>
                        {daysLeft}d remaining
                      </span>
                    )}
                  </div>

                  {/* Footer Stats: Recency, Solutions, Rating / AI Merit Index */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: '600' }}>
                        📅 {formatRecency(prob.createdAt)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0369a1', fontWeight: '600' }}>
                        <MessageSquare size={13} />
                        <span>{prob.solutionCount || 0}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {prob.topAiScore > 0 ? (
                        <div style={{
                          background: '#fef3c7',
                          border: '1px solid #fde68a',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          color: '#92400e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Award size={12} color="#b45309" />
                          <span>AI: {prob.topAiScore}</span>
                        </div>
                      ) : null}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: '#b45309',
                        fontWeight: '700',
                        fontSize: '0.72rem'
                      }}>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <span>{prob.rating || 4.0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
