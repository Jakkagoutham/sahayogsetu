import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, MapPin, Clock, AlertTriangle, ShieldCheck, ThumbsUp, 
  Award, ExternalLink, Users, Sparkles, ChevronDown, ChevronUp, 
  Layers, CheckCircle2, PhoneCall, Plus, FileText, Send, Camera, Upload, X 
} from 'lucide-react';
import AuthorityContactModal from '../components/AuthorityContactModal';
import SolutionSubmitModal from '../components/SolutionSubmitModal';

export default function ProblemDetail({ problemId, onBack, onNavigateToProblem }) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSolutionForContact, setSelectedSolutionForContact] = useState(null);
  const [isSubmitSolutionOpen, setIsSubmitSolutionOpen] = useState(false);
  const [expandedScoreIds, setExpandedScoreIds] = useState({});
  const [upvotingIds, setUpvotingIds] = useState({});

  // Resolution Proof Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionPhotoFile, setResolutionPhotoFile] = useState(null);
  const [resolutionPhotoPreview, setResolutionPhotoPreview] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({ description: '', resolvedBy: '' });
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [resolutionError, setResolutionError] = useState('');
  const resolutionFileInputRef = useRef(null);

  const fetchProblemDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/problems/${problemId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load problem');
      setProblem(data.problem);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading problem details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (problemId) {
      fetchProblemDetails();
    }
  }, [problemId]);

  const toggleScoreBreakdown = (solId) => {
    setExpandedScoreIds(prev => ({
      ...prev,
      [solId]: !prev[solId]
    }));
  };

  const handleUpvote = async (solId) => {
    if (upvotingIds[solId]) return;
    setUpvotingIds(prev => ({ ...prev, [solId]: true }));

    try {
      const res = await fetch(`/api/solutions/${solId}/upvote`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setProblem(prev => ({
          ...prev,
          solutions: prev.solutions.map(s => s.id === solId ? { ...s, votes: data.votes } : s)
        }));
      }
    } catch (err) {
      console.error("Upvote error:", err);
    } finally {
      setUpvotingIds(prev => ({ ...prev, [solId]: false }));
    }
  };

  const handleSolutionSubmitted = (newSol) => {
    fetchProblemDetails();
  };

  // Resolution Photo Upload Handlers
  const handleResolutionPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResolutionPhotoFile(file);
    setResolutionPhotoPreview(URL.createObjectURL(file));
    setResolutionError('');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionPhotoFile) {
      setResolutionError("Photographic proof of resolution is mandatory to mark this issue as Solved.");
      return;
    }
    setSubmittingResolution(true);
    setResolutionError('');

    try {
      const payload = new FormData();
      payload.append('resolutionPhoto', resolutionPhotoFile);
      payload.append('description', resolutionForm.description || 'Problem resolved and ground proof verified.');
      payload.append('resolvedBy', resolutionForm.resolvedBy || 'Municipal Authority / University Innovation Team');

      const res = await fetch(`/api/problems/${problemId}/resolve`, {
        method: 'POST',
        body: payload
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit resolution proof');

      setProblem(data.problem);
      setIsResolveModalOpen(false);
      setResolutionPhotoFile(null);
      setResolutionPhotoPreview(null);
    } catch (err) {
      console.error(err);
      setResolutionError(err.message || 'Error submitting resolution proof');
    } finally {
      setSubmittingResolution(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
        <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>Loading official grievance data & AI evaluations...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Grievance Board
        </button>
        <div className="gov-card" style={{ padding: '32px', textAlign: 'center' }}>
          <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '1.25rem', color: '#991b1b', marginBottom: '8px' }}>Failed to Load Grievance</h2>
          <p style={{ color: '#475569', marginBottom: '20px' }}>{error || 'Problem not found.'}</p>
          <button onClick={onBack} className="btn-primary">Return to Grievance Board</button>
        </div>
      </div>
    );
  }

  const isOverdue = problem.isEscalated;
  const isSolved = problem.status === 'Solved';
  const daysLeft = Math.max(0, (problem.maxResolutionDays || 7) - (problem.daysOpen || 0));
  const coords = problem.location?.coordinates;
  const mapLink = coords?.lat && coords?.lng ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : null;

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '28px 20px' }}>
      {/* Navigation & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Problem Board</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {!isSolved ? (
            <button 
              onClick={() => setIsResolveModalOpen(true)}
              className="btn-success"
              title="Upload official photo proof and close this complaint"
            >
              <Camera size={16} />
              <span>Upload Resolution Proof & Mark Solved</span>
            </button>
          ) : (
            <div className="badge-solved" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>Officially Resolved with Photo Proof</span>
            </div>
          )}

          <button 
            onClick={() => setIsSubmitSolutionOpen(true)}
            className="btn-accent"
          >
            <Plus size={16} />
            <span>Submit Solution (Students)</span>
          </button>
        </div>
      </div>

      {/* RESOLUTION BANNER IF SOLVED */}
      {isSolved && (
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: '6px',
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <CheckCircle2 size={24} color="#15803d" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#14532d' }}>
              STATUS: OFFICIALLY RESOLVED & CLOSED WITH GROUND PROOF
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '18px', lineHeight: '1.5' }}>
            This civic challenge has been physically rectified on site. Photographic proof and implementation details have been recorded in official government records.
          </p>

          {/* Before vs After Photo Proof Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '16px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ background: '#fef2f2', padding: '6px 12px', borderBottom: '1px solid #fecaca', fontSize: '0.78rem', fontWeight: '800', color: '#991b1b' }}>
                BEFORE: Initial Reported Grievance
              </div>
              <img src={problem.photoUrl} alt="Before Problem" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
            </div>

            <div style={{ background: '#ffffff', border: '2px solid #22c55e', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ background: '#dcfce7', padding: '6px 12px', borderBottom: '1px solid #86efac', fontSize: '0.78rem', fontWeight: '800', color: '#15803d' }}>
                AFTER: Official Ground Resolution Proof (Work Completed)
              </div>
              <img src={problem.resolutionProof?.photoUrl} alt="After Resolution" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '5px', padding: '14px 18px', fontSize: '0.84rem', color: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              <div><strong>Executed & Verified By:</strong> <span style={{ color: '#0a3977', fontWeight: '600' }}>{problem.resolutionProof?.resolvedBy || "Municipal Authority"}</span></div>
              <div><strong>Resolution Date:</strong> <span style={{ color: '#0a3977', fontWeight: '600' }}>{problem.resolutionProof?.resolvedAt ? new Date(problem.resolutionProof.resolvedAt).toLocaleString() : "Verified"}</span></div>
            </div>
            <div><strong>Resolution Summary:</strong> {problem.resolutionProof?.description}</div>
          </div>
        </div>
      )}

      {/* Main Problem Card (Government White Card) */}
      <div className="gov-card" style={{ padding: '30px', marginBottom: '32px' }}>
        {/* Top Badges Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Sector Code Badge */}
            <span style={{
              background: '#0a3977',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.5px'
            }}>
              SECTOR: {problem.sectorCode || 'SEC-GEN'}
            </span>
            {/* Problem Ref Code */}
            <span style={{
              background: '#f8fafc',
              color: '#0a3977',
              border: '1px solid #cbd5e1',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '800'
            }}>
              REF: {problem.problemCode || problem.id}
            </span>
            <span className="badge-category badge-water">
              {problem.category}
            </span>
            <span style={{
              background: problem.urgency === 'High' ? '#fef2f2' : '#fffbeb',
              color: problem.urgency === 'High' ? '#991b1b' : '#92400e',
              border: `1px solid ${problem.urgency === 'High' ? '#fecaca' : '#fde68a'}`,
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              {problem.urgency} Urgency
            </span>
            <span style={{
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              Level: {problem.level}
            </span>
            {isSolved && (
              <span className="badge-solved">
                <CheckCircle2 size={13} />
                <span>RESOLVED</span>
              </span>
            )}
          </div>

          {/* Citizen Privacy Assurance Notice */}
          <div style={{
            fontSize: '0.75rem',
            color: '#15803d',
            background: '#f0fdf4',
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600'
          }}>
            <ShieldCheck size={14} color="#15803d" />
            <span>Anonymous Citizen Grievance (Zero PII Collected)</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: '1.35', marginBottom: '16px', color: '#0a3977' }}>
          {problem.title}
        </h1>

        {/* Location & GPS Info Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <MapPin size={18} color="#ea580c" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: '#334155' }}>
            <strong>{problem.location?.village}</strong> ({problem.location?.areaName || 'Main Locality'}), {problem.location?.mandal} Mandal, {problem.location?.district} District, {problem.location?.state} — {problem.location?.pincode}
          </div>
          {mapLink && (
            <a 
              href={mapLink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                marginLeft: 'auto',
                fontSize: '0.78rem',
                color: '#0a3977',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none'
              }}
            >
              <span>View Map Geotag ({coords?.lat?.toFixed(4)}, {coords?.lng?.toFixed(4)})</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Photo Proof & Description Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Photo */}
          <div>
            <div style={{
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
              position: 'relative',
              background: '#f1f5f9'
            }}>
              <img 
                src={problem.photoUrl} 
                alt="Ground Proof" 
                style={{ width: '100%', height: '230px', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(10, 57, 119, 0.9))',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={16} color="#4ade80" />
                <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: '600' }}>
                  {problem.photoAuthenticity?.detectionDetails || "Ground Proof Geotagged"}
                </span>
              </div>
            </div>
          </div>

          {/* Description & SLA Tracker */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Detailed Problem Statement
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#1e293b', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>
              {problem.description}
            </p>

            {/* SLA Resolution Box */}
            <div style={{
              background: isSolved ? '#f0fdf4' : isOverdue ? '#fef2f2' : '#eff6ff',
              border: isSolved ? '1px solid #bbf7d0' : isOverdue ? '1px solid #fecaca' : '1px solid #bfdbfe',
              borderRadius: '6px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Government SLA ({problem.level})
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0a3977' }}>
                  Maximum Resolution Time: {problem.maxResolutionDays} Days
                </div>
              </div>

              <div>
                {isSolved ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: '800', fontSize: '0.88rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Resolution Work Completed</span>
                  </div>
                ) : isOverdue ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: '800', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} />
                    <span>TIMELINE EXCEEDED: Escalated to District Administration</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: '700', fontSize: '0.85rem' }}>
                    <Clock size={16} />
                    <span>{daysLeft} Days Remaining within SLA</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Locality Section: Similar Issues from Other States */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layers size={18} color="#0a3977" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f2744' }}>
              Cross-Locality Insights: Related Challenges Being Solved in Other States
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {problem.similarProblemsAcrossStates && problem.similarProblemsAcrossStates.length > 0 ? (
              problem.similarProblemsAcrossStates.map(sim => (
                <div 
                  key={sim.id} 
                  onClick={() => onNavigateToProblem(sim.id)}
                  style={{
                    background: '#ffffff',
                    padding: '12px 14px',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: '800', marginBottom: '3px' }}>
                    {sim.state} • {sim.district}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0a3977', marginBottom: '5px' }}>
                    {sim.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: '600' }}>
                    {sim.solutionCount} solutions proposed → View problem
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No cross-state problems in this category yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Solutions Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0a3977' }}>
              Ranked Engineering Solutions ({problem.solutions?.length || 0})
            </h2>
            <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
              Evaluated on Official 6-Parameter Matrix (100 Pts)
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569' }}>
            Autonomous Groq AI evaluates solutions against root-cause resolution, SLA compliance, and durability.
          </p>
        </div>

        <button 
          onClick={() => setIsSubmitSolutionOpen(true)}
          className="btn-accent"
        >
          <Plus size={16} />
          <span>Submit Solution (Students)</span>
        </button>
      </div>

      {/* Solutions List */}
      {(!problem.solutions || problem.solutions.length === 0) ? (
        <div className="gov-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Sparkles size={36} color="#0a3977" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0a3977', marginBottom: '6px' }}>No Solutions Submitted Yet</h3>
          <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '20px' }}>
            Be the first university team to propose a technical solution and get evaluated against the SIH 100-pt rubric!
          </p>
          <button onClick={() => setIsSubmitSolutionOpen(true)} className="btn-primary">
            Submit Solution Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {problem.solutions.map((sol, index) => {
            const isTopRanked = index === 0;
            const evalScore = sol.aiEvaluation?.totalScore || 75;
            const isExpanded = expandedScoreIds[sol.id];

            return (
              <div 
                key={sol.id}
                className="gov-card"
                style={{
                  padding: '24px',
                  border: isTopRanked ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                  background: '#ffffff',
                  boxShadow: isTopRanked ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none'
                }}
              >
                {/* Top Badge for #1 solution */}
                {isTopRanked && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    marginBottom: '14px'
                  }}>
                    <Award size={15} color="#b45309" />
                    <span>AI RANK #1 • RECOMMENDED FOR OFFICIAL GOVERNMENT PILOT SANCTION</span>
                  </div>
                )}

                {/* Solution Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0a3977' }}>
                        {sol.teamName}
                      </h3>
                      
                      {/* Institution Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        background: '#f8fafc',
                        color: '#0f2744',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1'
                      }}>
                        🏛️ {sol.institution || 'Engineering & Research Institute'}
                      </span>

                      {/* Mentor/Technical Hub Status Badge */}
                      {(sol.mentorStatus === 'approved' || sol.mentorStatus === 'Mentor Approved' || sol.mentorDetails?.isOtpVerified) ? (
                        <span 
                          title={sol.mentorDetails?.phone ? `Verified Mobile: ${sol.mentorDetails.phone}` : 'Verified Faculty Endorsement'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            background: '#ecfdf5',
                            color: '#065f46',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            border: '1px solid #a7f3d0'
                          }}
                        >
                          <CheckCircle2 size={13} color="#059669" />
                          <span>
                            Mentor Approved ✅ 
                            {sol.mentorDetails?.name ? ` (${sol.mentorDetails.name}${sol.mentorDetails.designation ? ` - ${sol.mentorDetails.designation}` : ''})` : ''}
                          </span>
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          background: '#fffbeb',
                          color: '#b45309',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          border: '1px solid #fde68a'
                        }}>
                          <Clock size={13} color="#d97706" />
                          <span>Pending Mentor Review ⏳</span>
                        </span>
                      )}

                      {/* Industry Partner Tag (Optional) */}
                      {sol.industryPartner && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe'
                        }}>
                          🏢 Backed by: {sol.industryPartner}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Team Lead: <strong style={{ color: '#0f2744' }}>{sol.contactLead}</strong> | Implementation Time: <strong style={{ color: '#0369a1' }}>{sol.implementationTimeDays} Days</strong> | Estimated Budget: <strong style={{ color: '#15803d' }}>{sol.estimatedBudget}</strong>
                    </div>
                  </div>

                  {/* Groq AI Score Badge */}
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textAlign: 'right'
                  }}>
                    <div style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: '800', textTransform: 'uppercase' }}>
                      AI Merit Score
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#b45309' }}>
                      {evalScore} <span style={{ fontSize: '0.8rem', color: '#78350f' }}>/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Technical Proposal */}
                <p style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: '1.6', marginBottom: '18px' }}>
                  {sol.description}
                </p>

                {/* AI Remarks Banner */}
                {sol.aiEvaluation?.aiRemarks && (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '5px',
                    padding: '12px 16px',
                    fontSize: '0.82rem',
                    color: '#1e293b',
                    marginBottom: '16px'
                  }}>
                    <strong style={{ color: '#1d4ed8' }}>Autonomous AI Evaluation Remarks: </strong>
                    {sol.aiEvaluation.aiRemarks}
                  </div>
                )}

                {/* Collapsible 6-Parameter Weightage Breakdown */}
                <div style={{ marginBottom: '18px' }}>
                  <button 
                    onClick={() => toggleScoreBreakdown(sol.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0a3977',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: 0
                    }}
                  >
                    <span>{isExpanded ? 'Hide' : 'View'} Official 6-Parameter Score Breakdown</span>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  {isExpanded && (
                    <div style={{
                      marginTop: '12px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Resolution Rate</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0a3977' }}>
                          {sol.aiEvaluation?.resolutionRateScore || 24} / 30
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Closure Time vs SLA</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0a3977' }}>
                          {sol.aiEvaluation?.closureTimeScore || 16} / 20
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Citizen Satisfaction</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0a3977' }}>
                          {sol.aiEvaluation?.citizenSatisfactionScore || 16} / 20
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Escalation Risk</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0a3977' }}>
                          {sol.aiEvaluation?.escalationRiskScore || 8} / 10
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Reopened Prevention</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0a3977' }}>
                          {sol.aiEvaluation?.reopenedCasesRiskScore || 8} / 10
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Innovation / Tech</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0a3977' }}>
                          {sol.aiEvaluation?.innovationScore || 8} / 10
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions: Upvote & Authority Contact */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {/* Upvote Button */}
                  <button 
                    onClick={() => handleUpvote(sol.id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    <ThumbsUp size={14} color="#0a3977" />
                    <span>Upvote ({sol.votes || 0})</span>
                  </button>

                  {/* Authority Contact Button */}
                  <button 
                    onClick={() => setSelectedSolutionForContact(sol)}
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  >
                    <PhoneCall size={15} />
                    <span>Contact Team / View Credentials (Govt Authority)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RESOLUTION PROOF SUBMISSION MODAL */}
      {isResolveModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResolveModalOpen(false)}>
          <div 
            className="gov-card"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <button 
              onClick={() => setIsResolveModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CheckCircle2 size={24} color="#15803d" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a3977' }}>
                Submit Resolution Proof & Mark Solved
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '20px' }}>
              Upload photographic evidence showing that this civic issue has been resolved in the field. Once submitted, the status is officially updated to <strong>Solved</strong>.
            </p>

            {resolutionError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '10px 14px',
                borderRadius: '5px',
                color: '#991b1b',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                {resolutionError}
              </div>
            )}

            <form onSubmit={handleResolveSubmit}>
              {/* Photo Upload Box */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Resolution Ground Proof Photo *
                </label>
                <div 
                  onClick={() => resolutionFileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '6px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                    overflow: 'hidden'
                  }}
                >
                  {resolutionPhotoPreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={resolutionPhotoPreview} alt="Resolution Proof Preview" style={{ maxHeight: '180px', margin: '0 auto', borderRadius: '4px', objectFit: 'cover' }} />
                      <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '700', marginTop: '8px' }}>
                        ✓ Photo attached. Click to change.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} color="#0a3977" style={{ margin: '0 auto 8px auto' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0a3977' }}>
                        Click to select resolution proof photo
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        Captured photo showing the completed repair / installation
                      </div>
                    </div>
                  )}
                </div>
                <input 
                  type="file"
                  ref={resolutionFileInputRef}
                  onChange={handleResolutionPhotoUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              {/* Resolved By */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Executed / Resolved By *
                </label>
                <input 
                  type="text"
                  required
                  value={resolutionForm.resolvedBy}
                  onChange={e => setResolutionForm(prev => ({ ...prev, resolvedBy: e.target.value }))}
                  placeholder="e.g. Gram Panchayat Engineering Wing / Team Jal-Drishti Pilot"
                  className="input-field"
                />
              </div>

              {/* Resolution Notes */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Resolution Summary / Completion Notes *
                </label>
                <textarea 
                  required
                  rows={4}
                  value={resolutionForm.description}
                  onChange={e => setResolutionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the physical work done on the ground (materials used, functional status restored, beneficiary impact)..."
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsResolveModalOpen(false)} 
                  className="btn-secondary"
                  disabled={submittingResolution}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingResolution}
                  className="btn-success"
                  style={{ padding: '10px 20px' }}
                >
                  {submittingResolution ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>Saving Resolution Proof...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Mark as Solved</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authority Contact Modal */}
      <AuthorityContactModal
        isOpen={!!selectedSolutionForContact}
        onClose={() => setSelectedSolutionForContact(null)}
        solution={selectedSolutionForContact}
        problem={problem}
      />

      {/* Solution Submit Modal */}
      <SolutionSubmitModal
        isOpen={isSubmitSolutionOpen}
        onClose={() => setIsSubmitSolutionOpen(false)}
        problem={problem}
        onSolutionSubmitted={handleSolutionSubmitted}
      />
    </div>
  );
}
