import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Building2, Plus, Trash2, Edit3, MapPin, 
  Mail, Phone, Award, CheckCircle2, AlertTriangle, ArrowLeft, 
  Search, ExternalLink, Users, Layers, Sparkles, RefreshCw, X 
} from 'lucide-react';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi NCR", "Jammu and Kashmir", "Ladakh"
];

const HUB_BADGES = [
  "Tier-1 Premier Hub",
  "Center of Excellence",
  "Autonomous Innovation Lab",
  "Top Ranked National Hub",
  "State Emerging Hub",
  "Registered Technical Hub"
];

export default function SuperAdminPortal({ 
  problems = [], 
  onBack, 
  onSwitchToCollege, 
  onSelectProblem 
}) {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [institutionToDelete, setInstitutionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State for Adding an Institution Profile
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    hubCode: '',
    state: 'Karnataka',
    district: '',
    aisheCode: '',
    nodalOfficer: '',
    nodalEmail: '',
    nodalPhone: '',
    domains: 'Water Resources, Smart Infrastructure, Rural IoT',
    activeTeams: 10,
    badge: 'Tier-1 Premier Hub'
  });

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/institutions');
      const data = await res.json();
      if (res.ok && data.institutions) {
        setInstitutions(data.institutions);
      }
    } catch (err) {
      console.error("Error fetching institutions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide the institution short or recognized name.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        domains: formData.domains.split(',').map(d => d.trim()).filter(Boolean)
      };

      const res = await fetch('/api/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create institution profile');
      }

      setSuccessMsg(`Institution "${data.institution.name}" successfully added to national hub registry.`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        fullName: '',
        hubCode: '',
        state: 'Karnataka',
        district: '',
        aisheCode: '',
        nodalOfficer: '',
        nodalEmail: '',
        nodalPhone: '',
        domains: 'Water Resources, Smart Infrastructure, Rural IoT',
        activeTeams: 10,
        badge: 'Tier-1 Premier Hub'
      });
      fetchInstitutions();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating institution.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteInstitution = async () => {
    if (!institutionToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/institutions/${institutionToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Institution "${institutionToDelete.name}" removed from platform.`);
        setInstitutionToDelete(null);
        fetchInstitutions();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        alert(data.error || 'Failed to delete institution profile.');
      }
    } catch (err) {
      console.error("Error deleting institution:", err);
      alert('Network error while deleting institution profile.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered institutions
  const filteredInstitutions = institutions.filter(inst => {
    const matchState = selectedState === 'All' || (inst.state && inst.state.toLowerCase() === selectedState.toLowerCase());
    const q = search.toLowerCase().trim();
    const matchSearch = !q || 
      inst.name?.toLowerCase().includes(q) ||
      inst.fullName?.toLowerCase().includes(q) ||
      inst.hubCode?.toLowerCase().includes(q) ||
      inst.nodalOfficer?.toLowerCase().includes(q) ||
      inst.district?.toLowerCase().includes(q);
    return matchState && matchSearch;
  });

  const totalSolutions = problems.reduce((acc, p) => acc + (p.solutionCount || 0), 0);
  const totalTeams = institutions.reduce((acc, i) => acc + (Number(i.activeTeams) || 0), 0);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* 1. Top Navigation & Quick Back Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={onBack} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} color="#60a5fa" />
          <span>Back to Citizen Board</span>
        </button>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Portal Mode: <strong style={{ color: '#a855f7' }}>Super Admin Authority Desk</strong>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#34d399',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Master Super Admin Header */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(168, 85, 247, 0.35)'
            }}>
              <Building2 size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: '700', 
                  background: 'rgba(168, 85, 247, 0.2)', 
                  color: '#c084fc', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  border: '1px solid rgba(168, 85, 247, 0.4)' 
                }}>
                  SUPER ADMIN PORTAL
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Smart India Hackathon • National Institutional Governance
                </span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>
                Institutional Technical Hub Registry & Platform Administration
              </h1>
            </div>
          </div>

          {/* Primary Action Button to Add Institution Profile */}
          <button
            onClick={() => { setIsAddModalOpen(true); setError(''); }}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
              borderColor: 'rgba(168, 85, 247, 0.5)',
              boxShadow: '0 4px 16px rgba(147, 51, 234, 0.35)',
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} />
            <span>Add Institution Profile</span>
          </button>
        </div>

        {/* System Overview Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginTop: '22px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Registered Institutes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c084fc', marginTop: '2px' }}>{institutions.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Premier engineering colleges & hubs</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Active Innovation Teams</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>{totalTeams}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Under faculty mentorship</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Total Civic Complaints</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f97316', marginTop: '2px' }}>{problems.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Across all categories & administrative tiers</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Submitted Solutions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4ade80', marginTop: '2px' }}>{totalSolutions}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Evaluated against 100-pt SLA matrix</div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by institute name, hub code, nodal officer, or city..."
              className="input-field"
              style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>State:</span>
            <select 
              value={selectedState} 
              onChange={e => setSelectedState(e.target.value)}
              className="input-field"
              style={{ padding: '8px 12px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All States ({institutions.length})</option>
              {INDIAN_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <button 
              onClick={fetchInstitutions} 
              className="btn-secondary" 
              title="Refresh Registry"
              style={{ padding: '8px 12px' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Institutions Grid */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc' }}>
          Registered Engineering Institutes & Technical Hubs ({filteredInstitutions.length})
        </h2>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Authorized to propose solutions and submit student engineering prototypes
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <p>Loading registered institution profiles...</p>
        </div>
      ) : filteredInstitutions.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Building2 size={40} color="#a855f7" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>
            No Institution Profiles Found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '18px' }}>
            {search ? "No institutions matched your search query." : "No engineering hubs registered in this category."}
          </p>
          <button 
            onClick={() => { setIsAddModalOpen(true); setError(''); }}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' }}
          >
            <Plus size={16} />
            <span>Add First Institution Profile</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {filteredInstitutions.map((inst, index) => (
            <div 
              key={inst.id}
              className="glass-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                {/* Header Badge & Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(168, 85, 247, 0.35)'
                  }}>
                    {inst.hubCode || `HUB-${inst.id}`}
                  </span>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#4ade80',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    {inst.badge || 'Registered Hub'}
                  </span>
                </div>

                {/* Institution Name */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc', marginBottom: '4px' }}>
                  {inst.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '14px' }}>
                  {inst.fullName || inst.name}
                </p>

                {/* Location & AISHE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#f97316" />
                    <span>{inst.district ? `${inst.district}, ` : ''}{inst.state}</span>
                  </span>
                  {inst.aisheCode && (
                    <span style={{ color: '#94a3b8' }}>
                      AISHE: <strong style={{ color: '#e2e8f0' }}>{inst.aisheCode}</strong>
                    </span>
                  )}
                </div>

                {/* Nodal Officer Contact */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '14px',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>
                    Nodal Innovation Officer:
                  </div>
                  <div style={{ color: '#f8fafc', fontWeight: '700', marginBottom: '4px' }}>
                    {inst.nodalOfficer || 'Designated Faculty Coordinator'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#38bdf8' }}>
                    {inst.nodalEmail && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} />
                        <span>{inst.nodalEmail}</span>
                      </span>
                    )}
                    {inst.nodalPhone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                        <Phone size={12} />
                        <span>{inst.nodalPhone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Technical Domains */}
                {inst.domains && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Technical Domains
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(Array.isArray(inst.domains) ? inst.domains : inst.domains.split(',')).map((dom, i) => (
                        <span 
                          key={i}
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}
                        >
                          {dom.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer with Stats & Delete Option */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '10px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Teams: <strong style={{ color: '#4ade80' }}>{inst.activeTeams || 5}</strong> • Avg Score: <strong style={{ color: '#fbbf24' }}>{inst.avgScore || 88.0}</strong>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Delete Institution Option (Requirement 4) */}
                  <button
                    onClick={() => setInstitutionToDelete(inst)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#f87171',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Delete institution profile"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ADD INSTITUTION PROFILE MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div 
            className="glass-card"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '30px',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <button 
              onClick={() => setIsAddModalOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={22} color="#c084fc" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f8fafc' }}>
                  Register New Institution Profile
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Authorizes engineering college labs to submit evaluated student solutions
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '10px 14px',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Institution Name (Short) *
                  </label>
                  <input 
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. IIT Bombay / NIT Warangal"
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Full Legal Name
                  </label>
                  <input 
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Indian Institute of Technology Bombay"
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Hub Code (Optional)
                  </label>
                  <input 
                    type="text"
                    name="hubCode"
                    value={formData.hubCode}
                    onChange={handleInputChange}
                    placeholder="e.g. HUB-IITB-02"
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    State *
                  </label>
                  <select 
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    District / City
                  </label>
                  <input 
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai Suburban"
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    AISHE / AICTE Code
                  </label>
                  <input 
                    type="text"
                    name="aisheCode"
                    value={formData.aisheCode}
                    onChange={handleInputChange}
                    placeholder="e.g. U-0306"
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Initial Active Teams
                  </label>
                  <input 
                    type="number"
                    min="1"
                    name="activeTeams"
                    value={formData.activeTeams}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Hub Tier / Badge
                  </label>
                  <select 
                    name="badge"
                    value={formData.badge}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {HUB_BADGES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nodal Officer Credentials */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>
                  Designated Faculty Nodal Officer
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Officer Name</label>
                    <input 
                      type="text"
                      name="nodalOfficer"
                      value={formData.nodalOfficer}
                      onChange={handleInputChange}
                      placeholder="e.g. Prof. Milind Atrey"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Official Email</label>
                    <input 
                      type="email"
                      name="nodalEmail"
                      value={formData.nodalEmail}
                      onChange={handleInputChange}
                      placeholder="e.g. innovation@institute.ac.in"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Contact Phone</label>
                    <input 
                      type="text"
                      name="nodalPhone"
                      value={formData.nodalPhone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Domains */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Technical Focus Domains (Comma-separated)
                </label>
                <input 
                  type="text"
                  name="domains"
                  value={formData.domains}
                  onChange={handleInputChange}
                  placeholder="Water Engineering, Smart Roads, Rural IoT, Sanitation"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                  style={{
                    background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                    borderColor: 'rgba(168, 85, 247, 0.5)'
                  }}
                >
                  {submitting ? 'Saving Profile...' : 'Save & Register Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CONFIRM DELETE MODAL */}
      {institutionToDelete && (
        <div className="modal-overlay" onClick={() => setInstitutionToDelete(null)}>
          <div 
            className="glass-card"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Trash2 size={24} color="#f87171" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
              Delete Institution Profile?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '22px' }}>
              Are you sure you want to delete <strong style={{ color: '#f87171' }}>"{institutionToDelete.name}"</strong> ({institutionToDelete.hubCode})? This institution will no longer appear in the college hub registry.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button 
                onClick={() => setInstitutionToDelete(null)}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteInstitution}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
