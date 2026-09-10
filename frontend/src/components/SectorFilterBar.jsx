import React from 'react';
import { Search, Tag, ArrowUpDown, X, Filter } from 'lucide-react';

export const SECTOR_CHIPS = [
  { code: 'SEC-WTR', label: 'Water', icon: '💧' },
  { code: 'SEC-RDS', label: 'Roads', icon: '🛣️' },
  { code: 'SEC-HLT', label: 'Health', icon: '🏥' },
  { code: 'SEC-AGR', label: 'Agriculture', icon: '🌾' },
  { code: 'SEC-PWR', label: 'Power', icon: '⚡' },
  { code: 'SEC-SAN', label: 'Sanitation', icon: '🧹' },
  { code: 'SEC-EDU', label: 'Education', icon: '📚' },
  { code: 'SEC-GOV', label: 'Civic Safety', icon: '🏛️' },
  { code: 'SEC-ENV', label: 'Environment', icon: '🌱' },
];

export const CATEGORIES = ["All", "Water", "Roads", "Health", "Agriculture", "Sanitation", "Education", "Other"];

export default function SectorFilterBar({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  selectedUrgency,
  setSelectedUrgency,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  totalResultsCount = 0
}) {
  const hasActiveFilters = 
    search || 
    selectedCategory !== 'All' || 
    selectedLevel !== 'All' || 
    selectedUrgency !== 'All' || 
    (selectedStatus && selectedStatus !== 'All');

  const handleClearAll = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedUrgency('All');
    if (setSelectedStatus) setSelectedStatus('All');
  };

  return (
    <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '22px', border: '1px solid var(--border-subtle)' }}>
      {/* 1. Unique Sector Code Strip (From Screenshot) */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '800', color: '#60a5fa' }}>
            <Tag size={14} color="#60a5fa" />
            <span>SEARCH BY UNIQUE SECTOR CODE:</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '400' }}>
              (Type or click any sector code to retrieve all problems in that sector)
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Sector Code Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {SECTOR_CHIPS.map(chip => {
            const isActive = search?.toUpperCase() === chip.code || search?.toUpperCase() === chip.code.replace('SEC-', '');
            return (
              <button
                key={chip.code}
                onClick={() => {
                  if (isActive) {
                    setSearch('');
                  } else {
                    setSearch(chip.code);
                    if (setSortBy) setSortBy('recent_rating');
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? '800' : '600',
                  background: isActive ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#93c5fd' : '#cbd5e1',
                  border: isActive ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title={`Click to filter by ${chip.code} (${chip.label})`}
              >
                <span>{chip.icon}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '800' }}>{chip.code}</span>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({chip.label})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Search Box & Dropdown Filters (From Screenshot) */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        {/* Search Box */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keyword, village, or Sector Code (e.g. SEC-WTR, SEC-RDS, SEC-HLT)..."
            className="input-field"
            style={{ paddingLeft: '38px', fontSize: '0.82rem', height: '38px' }}
          />
        </div>

        {/* Status Dropdown if supplied */}
        {setSelectedStatus && (
          <div style={{ minWidth: '130px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem', height: '38px', padding: '6px 10px' }}
            >
              <option value="All">Status: All</option>
              <option value="Open">Status: Open</option>
              <option value="Pilot Sanctioned">Status: Pilot Sanctioned</option>
              <option value="Solved">Status: Solved</option>
            </select>
          </div>
        )}

        {/* Level Dropdown */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="input-field"
            style={{ fontSize: '0.8rem', height: '38px', padding: '6px 10px' }}
          >
            <option value="All">All Admin Levels</option>
            <option value="Village/Ward">Village/Ward (7d SLA)</option>
            <option value="Mandal">Mandal (15d SLA)</option>
            <option value="District">District (30d SLA)</option>
            <option value="State">State (Special Review)</option>
          </select>
        </div>

        {/* Urgency Dropdown */}
        <div style={{ minWidth: '120px' }}>
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="input-field"
            style={{ fontSize: '0.8rem', height: '38px', padding: '6px 10px' }}
          >
            <option value="All">All Urgency</option>
            <option value="High">High Urgency</option>
            <option value="Medium">Medium Urgency</option>
            <option value="Low">Low Urgency</option>
          </select>
        </div>
      </div>

      {/* 3. Sort Row & Category Pills (From Screenshot) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        {/* Sort Selector */}
        {setSortBy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={14} color="#fbbf24" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
              style={{ width: 'auto', fontSize: '0.78rem', height: '34px', padding: '4px 8px', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
            >
              <option value="recent_rating">Sort: Recent Uploads + High Rating ⭐️</option>
              <option value="urgency">Sort: High Urgency First 🔥</option>
              <option value="ai_score">Sort: Highest AI Merit Score 🏆</option>
              <option value="solutions">Sort: Most Solutions Submitted 💡</option>
            </select>
          </div>
        )}

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>
            Category:
          </span>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? '700' : '500',
                  background: isSelected ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#60a5fa' : '#cbd5e1',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
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
    </div>
  );
}
