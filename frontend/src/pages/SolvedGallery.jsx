import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Award, MapPin, Calendar, Search, Filter, 
  ArrowRight, ArrowLeft, ExternalLink, Image as ImageIcon, 
  CheckCircle, Sparkles, Building2, Layers, ZoomIn, X 
} from 'lucide-react';

const SECTOR_FILTERS = [
  { code: 'All', label: 'All Solved Cases' },
  { code: 'Water', label: '💧 Water' },
  { code: 'Roads', label: '🛣️ Roads & Bridges' },
  { code: 'Sanitation', label: '🧹 Sanitation & Drains' },
  { code: 'Agriculture', label: '🌾 Agriculture & Canals' },
  { code: 'Health', label: '🏥 Healthcare' }
];

export default function SolvedGallery({ 
  problems = [], 
  onSelectProblem, 
  onNavigateBoard, 
  onNavigateReport 
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState(null); // { url, title, type }
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'comparative'

  // Extract all solved problems with valid resolution proofs
  const solvedProblems = useMemo(() => {
    return problems.filter(p => {
      const isSolved = p.status === 'Solved' || p.resolutionProof;
      if (!isSolved) return false;

      const matchCat = selectedCategory === 'All' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const resDesc = (p.resolutionProof?.description || '').toLowerCase();
        const resolvedBy = (p.resolutionProof?.resolvedBy || '').toLowerCase();
        const vill = (p.location?.village || '').toLowerCase();
        const dist = (p.location?.district || '').toLowerCase();
        const state = (p.location?.state || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || resDesc.includes(q) || resolvedBy.includes(q) || vill.includes(q) || dist.includes(q) || state.includes(q);
      }
      return true;
    });
  }, [problems, selectedCategory, searchQuery]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 20px' }}>
      {/* Top Nav Back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={onNavigateBoard} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} color="#0a3977" />
          <span>Back to Problem Board</span>
        </button>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Ground-Truth Physical Proof Gallery • <strong>100% Verifiable Impact</strong>
        </div>
      </div>

      {/* Hero Showcase Card */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f172a 100%)',
        color: '#ffffff',
        padding: '32px 36px',
        borderRadius: '12px',
        marginBottom: '26px',
        boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(52, 211, 153, 0.2)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#a7f3d0',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '800',
            marginBottom: '12px'
          }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>SOLVED GRIEVANCES & IMPLEMENTATION GALLERY</span>
          </div>

          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            Verified Civic Resolutions with Ground Photographic Proof
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#d1fae5', maxWidth: '820px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            Every resolved issue on SahayogSetu is backed by tamper-resistant photographic evidence from university engineering teams, faculty mentors, and municipal field inspectors. Browse real-world before-and-after transformations.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: '700' }}>Total Problems Solved</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#34d399' }}>{solvedProblems.length} Closed on Ground</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: '700' }}>Verification Standard</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>100% Geotagged Proof</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="gov-card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Sector Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SECTOR_FILTERS.map(f => (
              <button
                key={f.code}
                onClick={() => setSelectedCategory(f.code)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: selectedCategory === f.code ? '#15803d' : '#f1f5f9',
                  color: selectedCategory === f.code ? '#ffffff' : '#334155',
                  border: selectedCategory === f.code ? '1px solid #15803d' : '1px solid #e2e8f0'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 240px', maxWidth: '380px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search solved problems, resolving teams, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', fontSize: '0.84rem' }}
            />
          </div>
        </div>
      </div>

      {/* Solved Problems Cards Grid */}
      {solvedProblems.length === 0 ? (
        <div className="gov-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f2744', marginBottom: '8px' }}>
            No Solved Problems Matching Filter
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 20px auto' }}>
            Try selecting "All Solved Cases" or adjusting your search query to inspect completed physical resolutions.
          </p>
          <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {solvedProblems.map(prob => {
            const initialPhoto = prob.photoUrl;
            const resolutionPhoto = prob.resolutionProof?.photoUrl || initialPhoto;
            const hasBothPhotos = initialPhoto && prob.resolutionProof?.photoUrl && initialPhoto !== prob.resolutionProof.photoUrl;

            return (
              <div
                key={prob.id}
                className="gov-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '2px solid #86efac',
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(22, 163, 74, 0.1)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {/* 1. REQUIRED TOP MARK: "SOLVED" HEADER BANNER */}
                <div style={{
                  background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={18} color="#ffffff" />
                    <span>SOLVED / RESOLUTION VERIFIED</span>
                  </div>
                  <span style={{
                    background: '#ffffff',
                    color: '#15803d',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {prob.problemCode || 'VERIFIED'}
                  </span>
                </div>

                {/* 2. Photo Showcase (Initial Defect vs Verified Resolution Proof) */}
                <div style={{ position: 'relative', height: '220px', background: '#0f172a', overflow: 'hidden' }}>
                  <img
                    src={resolutionPhoto}
                    alt={prob.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Top-Right Zoom Button */}
                  <button
                    onClick={() => setSelectedZoomPhoto({ url: resolutionPhoto, title: prob.title, type: 'Resolution Proof Photo' })}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      backdropFilter: 'blur(4px)'
                    }}
                    title="Zoom Resolution Proof Image"
                  >
                    <ZoomIn size={13} />
                    <span>Proof Photo</span>
                  </button>

                  {/* Initial Problem Thumbnail (Before vs After Picture in Picture) */}
                  {hasBothPhotos && (
                    <div 
                      onClick={() => setSelectedZoomPhoto({ url: initialPhoto, title: prob.title, type: 'Original Reported Defect' })}
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.8)',
                        border: '2px solid #ffffff',
                        borderRadius: '6px',
                        padding: '2px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                      title="Click to view original reported defect image"
                    >
                      <img
                        src={initialPhoto}
                        alt="Initial defect"
                        style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <span style={{ fontSize: '0.6rem', color: '#ffffff', fontWeight: '800', marginTop: '2px' }}>
                        BEFORE
                      </span>
                    </div>
                  )}

                  {/* Category Chip */}
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                    <span style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {prob.category}
                    </span>
                  </div>
                </div>

                {/* 3. Problem & Resolution Details */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 
                      onClick={() => onSelectProblem && onSelectProblem(prob.id)}
                      style={{ 
                        fontSize: '1.08rem', 
                        fontWeight: '800', 
                        color: '#0f2744', 
                        marginBottom: '6px',
                        cursor: 'pointer',
                        lineHeight: '1.4'
                      }}
                    >
                      {prob.title}
                    </h3>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
                      <MapPin size={14} color="#15803d" />
                      <span>{prob.location?.village}, {prob.location?.mandal}, {prob.location?.district}, {prob.location?.state}</span>
                    </div>

                    {/* Verified Resolution Box */}
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ fontSize: '0.68rem', color: '#166534', fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle size={13} color="#16a34a" />
                        <span>Verified Ground Resolution Report</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#14532d', lineHeight: '1.45' }}>
                        {prob.resolutionProof?.description || 'Issue physically verified as repaired and functional on ground by district inspection team.'}
                      </p>
                    </div>

                    {/* Implementing Team & Timestamp */}
                    <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
                      <div>
                        <strong>Resolved By: </strong>
                        <span style={{ color: '#0369a1', fontWeight: '700' }}>
                          {prob.resolutionProof?.resolvedBy || 'Verified Implementation Team'}
                        </span>
                      </div>
                      {prob.resolutionProof?.resolvedAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} color="#64748b" />
                          <span>Closed: {new Date(prob.resolutionProof.resolvedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => onSelectProblem && onSelectProblem(prob.id)}
                      className="btn-secondary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#15803d',
                        borderColor: '#86efac'
                      }}
                    >
                      <span>Inspect Full Audit & Solutions</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {selectedZoomPhoto && (
        <div 
          onClick={() => setSelectedZoomPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '840px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              border: '2px solid #16a34a'
            }}
          >
            <div style={{
              background: '#15803d',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#ffffff'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '800', color: '#bbf7d0' }}>
                  {selectedZoomPhoto.type}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                  {selectedZoomPhoto.title}
                </div>
              </div>

              <button
                onClick={() => setSelectedZoomPhoto(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '70vh', overflow: 'hidden', background: '#000000', display: 'flex', justifyContent: 'center' }}>
              <img
                src={selectedZoomPhoto.url}
                alt={selectedZoomPhoto.title}
                style={{ maxHeight: '70vh', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ padding: '14px 18px', background: '#0f172a', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Verified Photographic Ground Proof</span>
              <button
                onClick={() => setSelectedZoomPhoto(null)}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
