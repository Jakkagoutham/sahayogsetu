import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Award, Clock, AlertTriangle, Building2, 
  MapPin, CheckCircle, Send, FileText, ArrowUpRight, BarChart3, 
  Users, ChevronLeft, ChevronRight, Layers, LayoutGrid, ArrowLeft, 
  Trash2, X, AlertCircle, CheckSquare, Square, Home, Check, ExternalLink 
} from 'lucide-react';
import SectorFilterBar from '../components/SectorFilterBar';

export default function GovernmentPortal({ 
  problems = [], 
  onSelectProblem, 
  onSwitchToCollege, 
  onProblemUpdated, 
  onBack 
}) {
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'sachivalayam' | 'hubs' | 'analytics'
  const [sanctionedIds, setSanctionedIds] = useState({});

  // Batch and Individual Deletion State
  const [selectedProblemIds, setSelectedProblemIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [problemToDeleteSingle, setProblemToDeleteSingle] = useState(null);
  const [isIrrelevantDrawerOpen, setIsIrrelevantDrawerOpen] = useState(false);
  const [selectedIrrelevantIds, setSelectedIrrelevantIds] = useState(new Set());
  const [notificationMsg, setNotificationMsg] = useState('');

  // Sachivalayam Desk State
  const [sachivalayamFilterStatus, setSachivalayamFilterStatus] = useState('All'); // 'All' | 'Pending Dispatch' | 'Dispatched'
  const [sachivalayamSearch, setSachivalayamSearch] = useState('');
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [problemToDispatch, setProblemToDispatch] = useState(null);
  const [dispatchOfficeInput, setDispatchOfficeInput] = useState('');
  const [dispatchSecretaryInput, setDispatchSecretaryInput] = useState('');
  const [dispatchRemarksInput, setDispatchRemarksInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Filter & Search states (Matching user's screenshot)
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('recent_rating');

  // Pagination states to handle large scale (lakhs of problems)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Helper to detect hyper-local/single-family/nuisance grievances
  const isHyperLocalProblem = (p) => {
    if (p.isSachivalayamDispatch) return true;
    const text = `${p.title || ''} ${p.description || ''}`.toLowerCase();
    return /in\s*front\s*of\s*(my|our)?\s*(home|house|gate|door)|stuck\s*drainage|drainage\s*(is)?\s*stuck|loud\s*(disturbance|noise|speaker)|(church|temple|mosque|function\s*hall).*loud|personal\s*(problem|issue)|single\s*family/i.test(text);
  };

  const allSachivalayamProblems = useMemo(() => {
    return problems.filter(isHyperLocalProblem);
  }, [problems]);

  const pendingSachivalayamCount = useMemo(() => {
    return allSachivalayamProblems.filter(p => !p.dispatchStatus || p.dispatchStatus === 'Pending Dispatch').length;
  }, [allSachivalayamProblems]);

  const filteredSachivalayamProblems = useMemo(() => {
    return allSachivalayamProblems.filter(p => {
      const isDispatched = p.dispatchStatus === 'Dispatched';
      if (sachivalayamFilterStatus === 'Pending Dispatch' && isDispatched) return false;
      if (sachivalayamFilterStatus === 'Dispatched' && !isDispatched) return false;

      if (sachivalayamSearch) {
        const q = sachivalayamSearch.trim().toLowerCase();
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const vill = (p.location?.village || '').toLowerCase();
        const mand = (p.location?.mandal || '').toLowerCase();
        const dist = (p.location?.district || '').toLowerCase();
        const area = (p.location?.areaName || '').toLowerCase();
        const off = (p.sachivalayamOffice || '').toLowerCase();
        const sec = (p.targetSecretary || '').toLowerCase();
        const tok = (p.dispatchToken || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || vill.includes(q) || mand.includes(q) || dist.includes(q) || area.includes(q) || off.includes(q) || sec.includes(q) || tok.includes(q);
      }
      return true;
    });
  }, [allSachivalayamProblems, sachivalayamFilterStatus, sachivalayamSearch]);

  const handleOpenDispatchModal = (prob) => {
    setProblemToDispatch(prob);
    const defaultOffice = prob.sachivalayamOffice || `${prob.location?.village || prob.location?.mandal || 'Local'} Grama / Ward Sachivalayam`;
    const defaultSecretary = prob.targetSecretary || (
      `${prob.title || ''} ${prob.description || ''}`.toLowerCase().includes('noise') 
        ? 'Ward Welfare & Police Liaison' 
        : 'Ward Sanitation & Environment Secretary'
    );
    setDispatchOfficeInput(defaultOffice);
    setDispatchSecretaryInput(defaultSecretary);
    setDispatchRemarksInput('Dispatched by District Authority for immediate ward inspection & desilting/action.');
    setDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!problemToDispatch) return;
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/problems/${problemToDispatch.id}/sachivalayam-dispatch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office: dispatchOfficeInput,
          secretary: dispatchSecretaryInput,
          remarks: dispatchRemarksInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch');

      setNotificationMsg(`✅ Officially Dispatched to ${data.problem.sachivalayamOffice || 'Ward Sachivalayam'}! Token: ${data.dispatchToken}`);
      if (onProblemUpdated) {
        onProblemUpdated(data.problem);
      }
      setDispatchModalOpen(false);
      setProblemToDispatch(null);
      setTimeout(() => setNotificationMsg(''), 6000);
    } catch (err) {
      console.error('Dispatch error:', err);
      alert(err.message || 'Failed to dispatch.');
    } finally {
      setIsDispatching(false);
    }
  };

  // National KPIs
  const totalProblems = problems.length;
  const escalatedProblems = problems.filter(p => p.isEscalated);
  const totalSolutions = problems.reduce((acc, p) => acc + (p.solutionCount || 0), 0);
  const readyForSanction = problems.filter(p => (p.topAiScore || 0) >= 85);

  const handleGrantPilot = async (probId, solId) => {
    try {
      const res = await fetch(`/api/problems/${probId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Pilot Sanctioned',
          pilotSanctioned: true,
          sanctionedGrant: '₹ 1,50,000 SIH District Pilot Grant',
          remarks: 'Official pilot deployment sanctioned by District Collectorate with technical hub partnership.'
        })
      });
      if (res.ok) {
        setSanctionedIds(prev => ({ ...prev, [probId]: true }));
      }
    } catch (err) {
      console.error("Error sanctioning pilot:", err);
      setSanctionedIds(prev => ({ ...prev, [probId]: true }));
    }
  };

  // Flagged Irrelevant Problems (AI Moderation)
  const irrelevantProblems = useMemo(() => {
    return problems.filter(p => p.isIrrelevant === true || p.category === 'Irrelevant');
  }, [problems]);

  // Selection handlers
  const toggleSelectProblem = (id) => {
    setSelectedProblemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = (pageItems) => {
    const allSelected = pageItems.every(p => selectedProblemIds.has(p.id));
    setSelectedProblemIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageItems.forEach(p => next.delete(p.id));
      } else {
        pageItems.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedProblemIds.size === 0) return;
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedProblemIds);
      const res = await fetch('/api/problems/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedProblemIds(new Set());
        setDeleteConfirmOpen(false);
        setNotificationMsg(`Successfully removed ${data.deletedCount || ids.length} problem(s) from the platform.`);
        if (onProblemUpdated) onProblemUpdated();
        setTimeout(() => setNotificationMsg(''), 5000);
      } else {
        alert(data.error || 'Failed to delete selected problems.');
      }
    } catch (err) {
      console.error('Error batch deleting problems:', err);
      alert('Network error while deleting problems.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = async (id) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/problems/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setProblemToDeleteSingle(null);
        setSelectedProblemIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setNotificationMsg(`Problem "${data.title || id}" deleted from the platform.`);
        if (onProblemUpdated) onProblemUpdated();
        setTimeout(() => setNotificationMsg(''), 5000);
      } else {
        alert(data.error || 'Failed to delete problem.');
      }
    } catch (err) {
      console.error('Error deleting problem:', err);
      alert('Network error while deleting problem.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeAllIrrelevant = async () => {
    if (irrelevantProblems.length === 0) return;
    const confirm = window.confirm(`Permanently delete all ${irrelevantProblems.length} AI-flagged irrelevant complaints from the site?`);
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const ids = irrelevantProblems.map(p => p.id);
      const res = await fetch('/api/problems/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (res.ok) {
        setIsIrrelevantDrawerOpen(false);
        setSelectedIrrelevantIds(new Set());
        setNotificationMsg(`Purged all ${data.deletedCount || ids.length} irrelevant problem(s) from the platform.`);
        if (onProblemUpdated) onProblemUpdated();
        setTimeout(() => setNotificationMsg(''), 5000);
      } else {
        alert(data.error || 'Failed to purge irrelevant problems.');
      }
    } catch (err) {
      console.error('Error purging irrelevant problems:', err);
      alert('Network error while purging.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeSelectedIrrelevant = async () => {
    if (selectedIrrelevantIds.size === 0) return;
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIrrelevantIds);
      const res = await fetch('/api/problems/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIrrelevantIds(new Set());
        setNotificationMsg(`Deleted ${data.deletedCount || ids.length} selected irrelevant problem(s).`);
        if (onProblemUpdated) onProblemUpdated();
        setTimeout(() => setNotificationMsg(''), 5000);
      } else {
        alert(data.error || 'Failed to delete selected irrelevant problems.');
      }
    } catch (err) {
      console.error('Error deleting irrelevant problems:', err);
      alert('Network error while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered problems list
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
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Navigation Back Button (Requirement 2) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={onBack} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} color="#fb923c" />
          <span>Back to Citizen Board</span>
        </button>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Portal Mode: <strong style={{ color: '#fb923c' }}>Government Administration Desk</strong>
        </div>
      </div>

      {/* Success Notification Alert */}
      {notificationMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '18px',
          color: '#34d399',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={18} />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* 1. Master Authority Header */}
      <div className="glass-card" style={{ padding: '22px 24px', marginBottom: '20px', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(249, 115, 22, 0.35)'
            }}>
              <ShieldAlert size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(249, 115, 22, 0.4)' }}>
                  GOVERNMENT COMMAND DESK
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Smart India Hackathon • National Administrative Oversight
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>
                Authority Pilot Sanction & Resolution Command Center
              </h1>
            </div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={15} />
            <span>Autonomous AI Triage & SLA Monitoring Active</span>
          </div>
        </div>

        {/* National Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total Crowdsourced Problems</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#38bdf8' }}>{totalProblems} Reported</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Student Solutions Submitted</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#4ade80' }}>{totalSolutions} Solutions</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>SLA Overdue / Escalated Cases</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ef4444' }}>
              {escalatedProblems.length} Alert Cases ⚠️
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Ready for Pilot Sanction (Score ≥ 85)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fbbf24' }}>
              {readyForSanction.length} Viable Pilots 🏆
            </div>
          </div>
        </div>

        {/* AI Moderation Alert for Irrelevant Complaints (Small Dedicated Notification Place) */}
        {irrelevantProblems.length > 0 && (
          <div style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={18} color="#fca5a5" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#fca5a5', fontSize: '0.88rem' }}>
                    AI Moderation Alert: {irrelevantProblems.length} Irrelevant / Low-Quality Report{irrelevantProblems.length > 1 ? 's' : ''} Flagged
                  </strong>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(239, 68, 68, 0.3)', color: '#fecaca', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                    Relegated to Bottom
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Groq AI detected irrelevant photos, gibberish descriptions, or mismatched civic context.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsIrrelevantDrawerOpen(true)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 14px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              >
                Inspect & Review ({irrelevantProblems.length})
              </button>
              <button
                onClick={handlePurgeAllIrrelevant}
                disabled={isDeleting}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Trash2 size={13} />
                <span>Delete All Irrelevant</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. STICKY TOP TABS DOCK: Solves the large-scale scrolling problem!
          Authorities can switch between Priority Desk, Affiliated Hubs, and Analytics instantly from top */}
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
            onClick={() => { setActiveTab('triage'); setCurrentPage(1); }}
            className={activeTab === 'triage' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <ShieldAlert size={15} />
            <span>Priority Triage & Pilot Sanctions ({filteredProblems.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('sachivalayam'); setCurrentPage(1); }}
            className={activeTab === 'sachivalayam' ? 'btn-primary' : 'btn-secondary'}
            style={{ 
              padding: '7px 14px', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              border: activeTab === 'sachivalayam' ? '1px solid #ea580c' : '1px solid rgba(234, 88, 12, 0.4)'
            }}
          >
            <Home size={15} color={activeTab === 'sachivalayam' ? '#ffffff' : '#fb923c'} />
            <span>Ward / Grama Sachivalayam Desk ({allSachivalayamProblems.length})</span>
            {pendingSachivalayamCount > 0 && (
              <span style={{
                background: '#ea580c',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '3px'
              }}>
                {pendingSachivalayamCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('hubs')}
            className={activeTab === 'hubs' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <Building2 size={15} />
            <span>Affiliated Technical Hubs Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <BarChart3 size={15} />
            <span>State / District Coverage Analytics</span>
          </button>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Active Records: <strong style={{ color: '#fb923c' }}>{filteredProblems.length}</strong>
        </div>
      </div>

      {/* 3. Sub-Tab 1: Priority Problem Triage & Pilot Sanction Desk with Sector Filter Bar & Pagination */}
      {activeTab === 'triage' && (
        <div>
          {/* Sector Code Filter Bar as requested in screenshot */}
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

          {/* Problem Cards List */}
          {paginatedProblems.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '14px' }}>
                No grievances found matching your sector code or filter criteria.
              </p>
              <button 
                onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedLevel('All'); setSelectedUrgency('All'); setSelectedStatus('All'); }}
                className="btn-secondary"
              >
                Reset Sector Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {/* Batch Selection & Action Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                background: 'rgba(15, 23, 42, 0.75)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={paginatedProblems.length > 0 && paginatedProblems.every(p => selectedProblemIds.has(p.id))}
                    onChange={() => toggleSelectAllPage(paginatedProblems)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ef4444' }}
                  />
                  <span>Select All on this page ({paginatedProblems.length})</span>
                </label>

                {selectedProblemIds.size > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#fca5a5', fontWeight: '700' }}>
                      {selectedProblemIds.size} Selected
                    </span>
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete Selected from Site ({selectedProblemIds.size})</span>
                    </button>
                    <button
                      onClick={() => setSelectedProblemIds(new Set())}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    Select checkboxes below to delete problems from platform
                  </div>
                )}
              </div>

              {paginatedProblems.map(prob => {
                const isOverdue = prob.isEscalated;
                const topScore = prob.topAiScore || 0;
                const isSanctioned = sanctionedIds[prob.id] || prob.pilotSanctioned;
                const isSelected = selectedProblemIds.has(prob.id);

                return (
                  <div 
                    key={prob.id}
                    className="glass-card"
                    style={{
                      padding: '20px 24px',
                      border: isSelected ? '1.5px solid #ef4444' : isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : isSanctioned ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(239, 68, 68, 0.05)' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      {/* Selection Checkbox (Requirement 4) */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProblem(prob.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginTop: '4px',
                          cursor: 'pointer',
                          accentColor: '#ef4444'
                        }}
                        title="Select problem for deletion"
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span className="badge-category badge-water" style={{ fontSize: '0.7rem' }}>
                                {prob.category}
                              </span>
                              {prob.sectorCode && (
                                <span style={{ fontSize: '0.68rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px' }}>
                                  {prob.sectorCode}
                                </span>
                              )}
                              <span style={{
                                background: prob.urgency === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: prob.urgency === 'High' ? '#fca5a5' : '#fcd34d',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '700'
                              }}>
                                {prob.urgency} Urgency
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                • Level: <strong style={{ color: '#e2e8f0' }}>{prob.level}</strong> (SLA: {prob.maxResolutionDays} Days)
                              </span>
                              {isOverdue && (
                                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>
                                  ⚠️ SLA EXCEEDED — ESCALATED
                                </span>
                              )}
                              {isSanctioned && (
                                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>
                                  🚀 PILOT SANCTIONED
                                </span>
                              )}
                              {(prob.isIrrelevant || prob.category === 'Irrelevant') && (
                                <span style={{
                                  background: 'rgba(239, 68, 68, 0.25)',
                                  color: '#fca5a5',
                                  border: '1px solid rgba(239, 68, 68, 0.5)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: '800'
                                }}>
                                  ⚠️ AI FLAGGED: IRRELEVANT REPORT
                                </span>
                              )}
                              {isHyperLocalProblem(prob) && (
                                <span style={{
                                  background: 'rgba(234, 88, 12, 0.25)',
                                  color: '#fb923c',
                                  border: '1px solid rgba(234, 88, 12, 0.5)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: '800'
                                }}>
                                  🏠 WARD SACHIVALAYAM TRACK {prob.dispatchStatus === 'Dispatched' ? `(TOKEN: ${prob.dispatchToken})` : '(PENDING DISPATCH)'}
                                </span>
                              )}
                            </div>

                            <h3 
                              onClick={() => onSelectProblem(prob.id)}
                              style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', cursor: 'pointer', marginTop: '2px' }}
                            >
                              {prob.title}
                            </h3>

                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <MapPin size={13} color="#f97316" />
                              <span>{prob.location?.village}, {prob.location?.district}, {prob.location?.state}</span>
                            </div>

                            {/* AI Flag Reason if Irrelevant */}
                            {prob.relevanceFlags?.flagReason && (
                              <div style={{
                                fontSize: '0.76rem',
                                color: '#fca5a5',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                marginTop: '6px',
                                display: 'inline-block'
                              }}>
                                <strong>AI Flag Reason: </strong>{prob.relevanceFlags.flagReason}
                              </div>
                            )}
                          </div>

                          {/* Top AI Score Badge */}
                          <div style={{
                            background: 'rgba(251, 191, 36, 0.12)',
                            border: '1px solid rgba(251, 191, 36, 0.4)',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            textAlign: 'right'
                          }}>
                            <div style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: '700' }}>TOP AI MERIT SCORE</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fbbf24' }}>
                              {topScore > 0 ? `${topScore} / 100` : 'No Solutions Yet'}
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '14px' }}>
                          {prob.description}
                        </p>

                        {/* Government Action Strip */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-subtle)',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Student Proposals: <strong style={{ color: '#38bdf8' }}>{prob.solutionCount || 0}</strong>
                            {prob.sanctionRemarks && (
                              <span style={{ marginLeft: '10px', color: '#4ade80' }}>• {prob.sanctionRemarks}</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                              onClick={() => onSelectProblem(prob.id)}
                              className="btn-secondary"
                              style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                            >
                              <span>Inspect Solutions ({prob.solutionCount || 0})</span>
                              <ArrowUpRight size={13} />
                            </button>

                            {prob.solutionCount > 0 && (
                              isSanctioned ? (
                                <div style={{
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#4ade80',
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.74rem',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <CheckCircle size={13} />
                                  <span>Pilot Grant Sanctioned!</span>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleGrantPilot(prob.id, prob.solutions?.[0]?.id)}
                                  className="btn-primary"
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '5px 12px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderColor: 'rgba(16, 185, 129, 0.4)'
                                  }}
                                >
                                  <Send size={13} />
                                  <span>Sanction Official Pilot & Release Grant</span>
                                </button>
                              )
                            )}

                            {/* Hyper-Local Sachivalayam dispatch action */}
                            {isHyperLocalProblem(prob) && (
                              prob.dispatchStatus === 'Dispatched' ? (
                                <div style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.4)',
                                  color: '#4ade80',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <CheckCircle size={12} />
                                  <span>Dispatched ({prob.dispatchToken})</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenDispatchModal(prob)}
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '5px 12px',
                                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                  title="Forward to Grama / Ward Sachivalayam"
                                >
                                  <Send size={12} />
                                  <span>Forward to Sachivalayam</span>
                                </button>
                              )
                            )}

                            {/* Individual Delete Problem button (Requirement 4) */}
                            <button
                              onClick={() => setProblemToDeleteSingle(prob)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#f87171',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Delete this problem from the platform"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. PAGINATION CONTROLS: Solves large-scale scrolling for lakhs of problems */}
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
                <span>Records per page:</span>
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

      {/* Sub-Tab: Ward / Grama Sachivalayam Dispatch Desk */}
      {activeTab === 'sachivalayam' && (
        <div>
          {/* Header Card */}
          <div className="glass-card" style={{
            padding: '24px',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid rgba(234, 88, 12, 0.35)',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  flexShrink: 0
                }}>
                  <Home size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      background: 'rgba(234, 88, 12, 0.25)',
                      color: '#fb923c',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(234, 88, 12, 0.4)'
                    }}>
                      WARD & GRAMA SECRETARIAT DESK
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Grassroots Administrative Municipal Dispatch
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', marginTop: '4px', marginBottom: '4px' }}>
                    Hyper-Local & Household Grievance Dispatch Center
                  </h2>
                  <p style={{ color: '#cbd5e1', fontSize: '0.84rem', maxWidth: '780px', lineHeight: '1.5', margin: 0 }}>
                    Autonomous AI Triage has segregated single-household complaints, doorstep drainage clogs, localized loudspeaker disturbances, and individual street maintenance away from the university research board. Authorities can directly issue electronic dispatch orders to the designated Ward/Village Sachivalayam.
                  </p>
                </div>
              </div>

              {/* Action Stats Pill */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total Hyper-Local</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fb923c' }}>{allSachivalayamProblems.length}</div>
                </div>
                <div style={{
                  background: 'rgba(234, 88, 12, 0.1)',
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#fdba74' }}>Pending Dispatch</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ea580c' }}>{pendingSachivalayamCount}</div>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#86efac' }}>Dispatched & Active</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>{allSachivalayamProblems.length - pendingSachivalayamCount}</div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Status Filter Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['All', 'Pending Dispatch', 'Dispatched'].map(st => (
                  <button
                    key={st}
                    onClick={() => setSachivalayamFilterStatus(st)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: sachivalayamFilterStatus === st ? '#ea580c' : 'rgba(255, 255, 255, 0.04)',
                      color: sachivalayamFilterStatus === st ? '#ffffff' : '#94a3b8',
                      border: sachivalayamFilterStatus === st ? '1px solid #ea580c' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {st === 'All' && `All Records (${allSachivalayamProblems.length})`}
                    {st === 'Pending Dispatch' && `⏳ Pending Dispatch (${pendingSachivalayamCount})`}
                    {st === 'Dispatched' && `✅ Dispatched (${allSachivalayamProblems.length - pendingSachivalayamCount})`}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div style={{ minWidth: '280px', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  placeholder="Search door #, street, village, secretary, token..."
                  value={sachivalayamSearch}
                  onChange={(e) => setSachivalayamSearch(e.target.value)}
                  className="input-field"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderColor: 'rgba(234, 88, 12, 0.3)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Grievances List */}
          {filteredSachivalayamProblems.length === 0 ? (
            <div className="gov-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <CheckCircle size={42} color="#10b981" style={{ margin: '0 auto 14px auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>
                No Hyper-Local Grievances Matching Current Criteria
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                All doorstep, individual household, and localized nuisance complaints are cleared or no matching records found.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredSachivalayamProblems.map(prob => {
                const isDispatched = prob.dispatchStatus === 'Dispatched';
                return (
                  <div
                    key={prob.id}
                    className="glass-card"
                    style={{
                      padding: '20px 24px',
                      border: isDispatched ? '1px solid rgba(16, 185, 129, 0.3)' : '1.5px solid rgba(234, 88, 12, 0.4)',
                      background: isDispatched ? 'rgba(15, 23, 42, 0.65)' : 'rgba(234, 88, 12, 0.03)',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Photo Thumbnail */}
                      {prob.photoUrl && (
                        <img
                          src={prob.photoUrl}
                          alt="Grievance evidence"
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            flexShrink: 0
                          }}
                        />
                      )}

                      {/* Main Details */}
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                background: '#ea580c',
                                color: '#ffffff',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                🏠 HYPER-LOCAL CIVIC GRIEVANCE
                              </span>
                              <span style={{
                                fontSize: '0.72rem',
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: '#94a3b8',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {prob.problemCode || 'CIVIC-HL'}
                              </span>
                              <span style={{
                                fontSize: '0.72rem',
                                color: '#fb923c',
                                fontWeight: '600'
                              }}>
                                Category: {prob.category}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc', margin: '4px 0' }}>
                              {prob.title}
                            </h3>

                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={14} color="#ea580c" />
                              <span>
                                {prob.location?.areaName ? `${prob.location.areaName}, ` : ''}
                                {prob.location?.village}, {prob.location?.mandal}, {prob.location?.district}, {prob.location?.state}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isDispatched ? (
                              <div style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#4ade80',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                textAlign: 'right'
                              }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase' }}>STATUS: DISPATCHED</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{prob.dispatchToken}</div>
                              </div>
                            ) : (
                              <div style={{
                                background: 'rgba(234, 88, 12, 0.15)',
                                border: '1px solid rgba(234, 88, 12, 0.4)',
                                color: '#fb923c',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                textAlign: 'right'
                              }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase' }}>DISPATCH QUEUE</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>⏳ Awaiting Action</div>
                              </div>
                            )}
                          </div>
                        </div>

                        <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.5', margin: '8px 0 12px 0' }}>
                          {prob.description}
                        </p>

                        {/* AI Triage & Sachivalayam Desk Assignment Box */}
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(234, 88, 12, 0.25)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          marginBottom: '14px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '12px'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Target Administrative Office</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fb923c', marginTop: '2px' }}>
                              🏛️ {prob.sachivalayamOffice || `${prob.location?.village || prob.location?.mandal || 'Local'} Grama / Ward Sachivalayam`}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Designated Department / Secretary</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>
                              👤 {prob.targetSecretary || 'Ward Sanitation & Environment Secretary'}
                            </div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>AI Segregation Rationale</div>
                            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>
                              "{prob.sachivalayamReason || 'Identified as a single-doorstep/household civic maintenance or noise nuisance complaint suitable for local municipal ward resolution rather than university technological R&D.'}"
                            </div>
                          </div>
                        </div>

                        {/* Dispatch Details if already dispatched */}
                        {isDispatched && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '6px',
                            padding: '10px 14px',
                            fontSize: '0.78rem',
                            color: '#a7f3d0',
                            marginBottom: '14px'
                          }}>
                            <strong>Official Dispatch Record: </strong>
                            Dispatched with Token <code>{prob.dispatchToken}</code> on {new Date(prob.dispatchedAt || Date.now()).toLocaleString()}.
                            {prob.dispatchRemarks && <span> Directive: "{prob.dispatchRemarks}"</span>}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                          <button
                            onClick={() => handleOpenDispatchModal(prob)}
                            style={{
                              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 10px rgba(234, 88, 12, 0.3)'
                            }}
                          >
                            <Send size={14} />
                            <span>{isDispatched ? 'Re-Dispatch / Update Directive' : 'Forward to Ward/Grama Sachivalayam'}</span>
                          </button>

                          <button
                            onClick={() => setProblemToDeleteSingle(prob)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#f87171',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            title="Delete or dismiss grievance"
                          >
                            <Trash2 size={14} />
                            <span>Delete / Dismiss</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Affiliated Technical Hubs Directory (Now directly at top tab!) */}
      {activeTab === 'hubs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc' }}>
                Affiliated Technical Hubs & University Networks
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Inspect university innovation centers, active student teams, and approved pilot solutions.
              </p>
            </div>
            <button onClick={onSwitchToCollege} className="btn-secondary" style={{ fontSize: '0.78rem' }}>
              <span>Switch to College Hub View</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {[
              { name: "IIT Roorkee", state: "Uttarakhand", teams: 18, solved: 8, avg: 92.4 },
              { name: "NIT Durgapur", state: "West Bengal", teams: 12, solved: 5, avg: 88.0 },
              { name: "RV College of Engg", state: "Karnataka", teams: 15, solved: 6, avg: 89.2 },
              { name: "IIT Hyderabad", state: "Telangana", teams: 22, solved: 9, avg: 94.8 },
              { name: "NIT Patna", state: "Bihar", teams: 9, solved: 4, avg: 86.5 }
            ].map(hub => (
              <div key={hub.name} className="glass-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>{hub.name}</h3>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{hub.state}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '12px' }}>
                  <span>Teams: <strong style={{ color: '#38bdf8' }}>{hub.teams}</strong></span>
                  <span>Solved: <strong style={{ color: '#4ade80' }}>{hub.solved}</strong></span>
                  <span>Avg AI: <strong style={{ color: '#fbbf24' }}>{hub.avg}</strong></span>
                </div>
                <button 
                  onClick={onSwitchToCollege}
                  className="btn-secondary" 
                  style={{ width: '100%', fontSize: '0.74rem', justifyContent: 'center', padding: '6px' }}
                >
                  Inspect College Dashboard →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: State / District Coverage Analytics */}
      {activeTab === 'analytics' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={20} color="#fb923c" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc' }}>
              National State & District Resolution Performance
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {[
              { state: "Uttar Pradesh", count: 4, resolvedRate: "82%", avgTime: "5.4d" },
              { state: "Karnataka", count: 3, resolvedRate: "88%", avgTime: "8.2d" },
              { state: "Telangana", count: 2, resolvedRate: "94%", avgTime: "12.0d" },
              { state: "Maharashtra", count: 2, resolvedRate: "78%", avgTime: "9.1d" },
              { state: "Bihar", count: 2, resolvedRate: "85%", avgTime: "6.7d" }
            ].map(st => (
              <div key={st.state} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', marginBottom: '6px' }}>{st.state}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Challenges: <strong style={{ color: '#38bdf8' }}>{st.count}</strong></div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SLA Compliance: <strong style={{ color: '#4ade80' }}>{st.resolvedRate}</strong></div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Avg Closure Speed: <strong style={{ color: '#fbbf24' }}>{st.avgTime}</strong></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONFIRM BATCH DELETE MODAL */}
      {deleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div 
            className="glass-card"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              animation: 'fadeIn 0.2s ease-out'
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
              Delete {selectedProblemIds.size} Selected Problems?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '22px' }}>
              These problems and all associated engineering solutions will be permanently removed from SahayogSetu across all dashboards.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button 
                onClick={() => setDeleteConfirmOpen(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleBatchDelete}
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
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : `Confirm & Delete (${selectedProblemIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIRM SINGLE PROBLEM DELETE MODAL */}
      {problemToDeleteSingle && (
        <div className="modal-overlay" onClick={() => setProblemToDeleteSingle(null)}>
          <div 
            className="glass-card"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              textAlign: 'center',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              animation: 'fadeIn 0.2s ease-out'
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
              Delete Problem from Platform?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '22px' }}>
              Are you sure you want to delete <strong style={{ color: '#fca5a5' }}>"{problemToDeleteSingle.title}"</strong>? This will remove the complaint from the public board and all dashboards.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button 
                onClick={() => setProblemToDeleteSingle(null)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSingleDelete(problemToDeleteSingle.id)}
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
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm & Delete Problem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI IRRELEVANT COMPLAINTS REVIEW & PURGE DRAWER / MODAL */}
      {isIrrelevantDrawerOpen && (
        <div className="modal-overlay" onClick={() => setIsIrrelevantDrawerOpen(false)}>
          <div 
            className="glass-card"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '820px',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <button 
              onClick={() => setIsIrrelevantDrawerOpen(false)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={22} color="#fca5a5" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f8fafc' }}>
                  AI Moderation Queue: Flagged Irrelevant Reports ({irrelevantProblems.length})
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Review reports flagged by Groq AI for irrelevant photos, test input, nonsensical text, or fake location data.
                </p>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={irrelevantProblems.length > 0 && selectedIrrelevantIds.size === irrelevantProblems.length}
                  onChange={() => {
                    if (selectedIrrelevantIds.size === irrelevantProblems.length) {
                      setSelectedIrrelevantIds(new Set());
                    } else {
                      setSelectedIrrelevantIds(new Set(irrelevantProblems.map(p => p.id)));
                    }
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ef4444' }}
                />
                <span>Select All Irrelevant ({irrelevantProblems.length})</span>
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                {selectedIrrelevantIds.size > 0 && (
                  <button
                    onClick={handlePurgeSelectedIrrelevant}
                    disabled={isDeleting}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#fca5a5',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Delete Selected ({selectedIrrelevantIds.size})
                  </button>
                )}

                <button
                  onClick={handlePurgeAllIrrelevant}
                  disabled={isDeleting || irrelevantProblems.length === 0}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete All Flagged Irrelevant</span>
                </button>
              </div>
            </div>

            {/* List of Flagged Problems */}
            {irrelevantProblems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <CheckCircle size={36} color="#4ade80" style={{ margin: '0 auto 12px auto' }} />
                <p>No irrelevant reports currently in the moderation queue.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {irrelevantProblems.map(prob => (
                  <div 
                    key={prob.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      borderRadius: '8px',
                      padding: '14px',
                      border: selectedIrrelevantIds.has(prob.id) ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIrrelevantIds.has(prob.id)}
                      onChange={() => {
                        setSelectedIrrelevantIds(prev => {
                          const next = new Set(prev);
                          if (next.has(prob.id)) next.delete(prob.id);
                          else next.add(prob.id);
                          return next;
                        });
                      }}
                      style={{ width: '16px', height: '16px', marginTop: '4px', cursor: 'pointer', accentColor: '#ef4444' }}
                    />

                    {prob.photoUrl && (
                      <img 
                        src={prob.photoUrl} 
                        alt="Photo proof" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} 
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                        {prob.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '6px' }}>
                        {prob.description}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span>📍 {prob.location?.village}, {prob.location?.district}, {prob.location?.state}</span>
                        <span>Level: {prob.level}</span>
                      </div>

                      {/* AI Flag Reason */}
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        color: '#fca5a5'
                      }}>
                        <strong>AI Reason: </strong>{prob.relevanceFlags?.flagReason || "Flagged as irrelevant ground proof or non-civic complaint."}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSingleDelete(prob.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '6px'
                      }}
                      title="Delete problem"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official Sachivalayam e-Dispatch Modal */}
      {dispatchModalOpen && problemToDispatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="gov-card" style={{
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            background: '#0f172a',
            border: '2px solid #ea580c',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Send size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                    Official Sachivalayam e-Dispatch
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#fb923c' }}>
                    Automated Administrative Forwarding
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setDispatchModalOpen(false); setProblemToDispatch(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'rgba(234, 88, 12, 0.08)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Grievance Subject:</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
                {problemToDispatch.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fdba74', marginTop: '4px' }}>
                📍 {problemToDispatch.location?.areaName ? `${problemToDispatch.location.areaName}, ` : ''}
                {problemToDispatch.location?.village}, {problemToDispatch.location?.mandal}, {problemToDispatch.location?.district}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Target Grama / Ward Sachivalayam Office *
                </label>
                <input
                  type="text"
                  value={dispatchOfficeInput}
                  onChange={(e) => setDispatchOfficeInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Designated Officer / Secretary Desk *
                </label>
                <input
                  type="text"
                  value={dispatchSecretaryInput}
                  onChange={(e) => setDispatchSecretaryInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Administrative Action Directive & Remarks
                </label>
                <textarea
                  rows={3}
                  value={dispatchRemarksInput}
                  onChange={(e) => setDispatchRemarksInput(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => { setDispatchModalOpen(false); setProblemToDispatch(null); }}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={isDispatching}
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDispatching ? (
                  <span>Dispatching to Sachivalayam...</span>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Authorize & Dispatch to Sachivalayam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
