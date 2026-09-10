import React, { useState } from 'react';
import { 
  X, Sparkles, Send, Users, Building2, Mail, Phone, Clock, DollarSign, 
  Link2, FileText, CheckCircle2, ShieldCheck, AlertCircle, Smartphone, Award, Briefcase
} from 'lucide-react';

const PRESET_INSTITUTIONS = [
  "IIT Delhi (Indian Institute of Technology Delhi)",
  "IIT Bombay (Indian Institute of Technology Bombay)",
  "IIT Madras (Indian Institute of Technology Madras)",
  "IIT Roorkee (Indian Institute of Technology Roorkee)",
  "BITS Pilani (Birla Institute of Technology and Science)",
  "NIT Trichy (National Institute of Technology Tiruchirappalli)",
  "DTU (Delhi Technological University)",
  "Anna University, Chennai",
  "COEP Technological University, Pune",
  "Jadavpur University, Kolkata",
  "Vellore Institute of Technology (VIT)",
  "Manipal Institute of Technology (MIT)",
  "Other / Affiliated University / Innovation Lab"
];

const PRESET_INDUSTRY_PARTNERS = [
  "Tata Water Mission",
  "L&T Smart Infra Technology Lab",
  "Cisco ThingQbator Innovation Center",
  "NITI Aayog AIC Incubation Hub",
  "Siemens Smart Grid Center of Excellence",
  "Bosch India Urban Mobility Lab",
  "Infosys Foundation Tech Collaborative",
  "Other Industry Partner / Technical Hub"
];

export default function SolutionSubmitModal({ isOpen, onClose, problem, onSolutionSubmitted }) {
  const [formData, setFormData] = useState({
    teamName: '',
    institutionSelect: PRESET_INSTITUTIONS[0],
    customInstitution: '',
    contactLead: '',
    contactEmail: '',
    contactPhone: '',
    implementationTimeDays: 7,
    estimatedBudget: '',
    prototypeUrl: '',
    description: '',
    hasMentorApproval: 'yes', // 'yes' | 'no'
    mentorName: '',
    mentorDesignation: '',
    mentorPhone: '',
    industryPartnerSelect: '',
    customIndustryPartner: ''
  });

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [activeOtpPhone, setActiveOtpPhone] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccessMsg, setResendSuccessMsg] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [smsAppUrl, setSmsAppUrl] = useState('');
  const [hasCarrierGateway, setHasCarrierGateway] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [evaluatedResult, setEvaluatedResult] = useState(null);

  // Resend cooldown countdown timer
  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // When student alters mentor mobile or name, invalidate previous OTP session to ensure 100% sync
    if (name === 'mentorPhone' || name === 'mentorName') {
      if (otpSent || isOtpVerified) {
        setOtpSent(false);
        setIsOtpVerified(false);
        setActiveOtpPhone('');
        setInputOtp('');
        setOtpMessage('');
        setOtpError('');
        setResendSuccessMsg('');
        setWhatsappUrl('');
        setSmsAppUrl('');
      }
    }
  };

  const getEffectiveInstitution = () => {
    if (formData.institutionSelect === "Other / Affiliated University / Innovation Lab") {
      return formData.customInstitution.trim() || "Affiliated Engineering Institution";
    }
    return formData.institutionSelect;
  };

  const getEffectiveIndustryPartner = () => {
    if (formData.hasMentorApproval !== 'yes') return '';
    if (!formData.industryPartnerSelect) return '';
    if (formData.industryPartnerSelect === "Other Industry Partner / Technical Hub") {
      return formData.customIndustryPartner.trim();
    }
    return formData.industryPartnerSelect;
  };

  // Dispatch Real SMS OTP to Mentor Phone (Initial or Resend)
  const handleSendMentorOtp = async (isResend = false) => {
    setOtpError('');
    setOtpMessage('');
    setResendSuccessMsg('');

    const rawDigits = (formData.mentorPhone || '').replace(/\D/g, '');
    const clean10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    if (!clean10 || clean10.length !== 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }
    if (!formData.mentorName || formData.mentorName.trim().length < 2) {
      setOtpError('Please provide the mentor full name first.');
      return;
    }

    if (isResend) {
      setIsResending(true);
    } else {
      setOtpLoading(true);
    }

    try {
      const res = await fetch('/api/solutions/send-mentor-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clean10,
          mentorName: formData.mentorName.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch OTP.');
      }

      setOtpSent(true);
      setActiveOtpPhone(data.phone || clean10);
      setInputOtp(''); // Clear input for fresh code entry
      setOtpMessage(data.message || `Verification code generated for +91 ${clean10}.`);
      setWhatsappUrl(data.whatsappUrl || '');
      setSmsAppUrl(data.smsAppUrl || '');
      setHasCarrierGateway(!!data.hasCarrier);
      setResendCooldown(30); // 30-second cooldown protection

      if (isResend) {
        setResendSuccessMsg(`Fresh 6-digit OTP code dispatched for +91 ${clean10}! Please check your mobile.`);
      }
    } catch (err) {
      setOtpError(err.message || 'Error communicating with SMS service.');
    } finally {
      setOtpLoading(false);
      setIsResending(false);
    }
  };

  // Verify OTP
  const handleVerifyMentorOtp = async () => {
    setOtpError('');
    setOtpMessage('');
    setResendSuccessMsg('');

    if (!inputOtp || inputOtp.trim().length < 4) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      const targetPhone = activeOtpPhone || formData.mentorPhone;
      const res = await fetch('/api/solutions/verify-mentor-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          otp: inputOtp.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code.');
      }

      setIsOtpVerified(true);
      setOtpMessage(data.message || 'Faculty Mentor verified successfully!');
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.teamName.trim()) {
      setError('Please provide your team name.');
      return;
    }

    const institution = getEffectiveInstitution();
    if (!institution) {
      setError('Please provide your institution name.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a detailed technical solution proposal.');
      return;
    }

    // Mentor validation if user claimed mentor approval
    if (formData.hasMentorApproval === 'yes') {
      if (!formData.mentorName.trim()) {
        setError('Please provide the mentor name or switch to direct student submission.');
        return;
      }
      if (!isOtpVerified) {
        setError('Please verify the mentor via Mobile OTP to receive the "Mentor Approved ✅" credential badge.');
        return;
      }
    }

    setLoading(true);

    const mentorStatus = (formData.hasMentorApproval === 'yes' && isOtpVerified) ? 'approved' : 'pending';
    const industryPartner = getEffectiveIndustryPartner();

    const payload = {
      teamName: formData.teamName.trim(),
      institution,
      contactLead: formData.contactLead.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      implementationTimeDays: Number(formData.implementationTimeDays) || 7,
      estimatedBudget: formData.estimatedBudget.trim(),
      prototypeUrl: formData.prototypeUrl.trim(),
      description: formData.description.trim(),
      mentorStatus,
      mentorDetails: {
        name: formData.mentorName.trim(),
        designation: formData.mentorDesignation.trim(),
        phone: formData.mentorPhone.trim(),
        isOtpVerified
      },
      industryPartner
    };

    try {
      const res = await fetch(`/api/problems/${problem.id}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit solution.');
      }

      setEvaluatedResult(data.solution);
      if (onSolutionSubmitted) {
        onSolutionSubmitted(data.solution);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setEvaluatedResult(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="gov-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.25)',
          borderRadius: '8px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: '800', 
                background: '#f0fdf4', 
                color: '#15803d', 
                padding: '3px 8px', 
                borderRadius: '4px',
                border: '1px solid #bbf7d0'
              }}>
                STUDENT + INSTITUTION + TECHNICAL HUB COLLABORATION
              </span>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>
                Target SLA: {problem?.maxResolutionDays} Days ({problem?.level})
              </span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0a3977' }}>
              Submit Technical Solution Proposal
            </h2>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* If Evaluated: Show Groq Score Card */}
        {evaluatedResult ? (
          <div style={{ animation: 'fadeIn 0.25s ease-in-out' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={42} color="#15803d" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#14532d', marginBottom: '4px' }}>
                Solution Evaluated & Verified!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '12px' }}>
                Autonomous Groq AI scoring completed against official government weightage criteria.
              </p>

              {/* Status Badges Granted */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f2744',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  🏛️ {evaluatedResult.institution}
                </span>

                {evaluatedResult.mentorStatus === 'approved' ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}>
                    🛡️ Mentor Approved ✅ ({evaluatedResult.mentorDetails?.name || 'Faculty Mentor'})
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    color: '#b45309',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}>
                    ⏳ Pending Mentor Review
                  </span>
                )}

                {evaluatedResult.industryPartner && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}>
                    🏢 Backed by: {evaluatedResult.industryPartner}
                  </span>
                )}
              </div>
              
              <div style={{
                margin: '10px auto',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '6px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '8px 24px',
                borderRadius: '9999px'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#92400e', fontWeight: '700' }}>Comprehensive AI Score:</span>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#b45309' }}>
                  {evaluatedResult.aiEvaluation?.totalScore}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#78350f' }}>/ 100</span>
              </div>
            </div>

            {/* Score Breakdown Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Resolution Rate (max 30)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0a3977' }}>
                  {evaluatedResult.aiEvaluation?.resolutionRateScore} / 30
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Closure Time (max 20)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0a3977' }}>
                  {evaluatedResult.aiEvaluation?.closureTimeScore} / 20
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Citizen Satisfaction (max 20)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0a3977' }}>
                  {evaluatedResult.aiEvaluation?.citizenSatisfactionScore} / 20
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Escalation Risk (max 10)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0a3977' }}>
                  {evaluatedResult.aiEvaluation?.escalationRiskScore} / 10
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Reopened Prevention (max 10)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0a3977' }}>
                  {evaluatedResult.aiEvaluation?.reopenedCasesRiskScore} / 10
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Innovation & Best Practices (max 10)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0a3977' }}>
                  {evaluatedResult.aiEvaluation?.innovationScore} / 10
                </div>
              </div>
            </div>

            {/* AI Remarks */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              padding: '14px',
              marginBottom: '24px',
              fontSize: '0.85rem',
              color: '#1e293b'
            }}>
              <strong style={{ color: '#1d4ed8' }}>AI Triage Remarks: </strong>
              {evaluatedResult.aiEvaluation?.aiRemarks}
            </div>

            <button onClick={handleFinish} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              View Updated Solution Rankings
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '10px 14px',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Team & Institution Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Team / Innovator Name *
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="e.g. EcoPurify Vanguard"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Institution / University Name *
                </label>
                <select
                  name="institutionSelect"
                  value={formData.institutionSelect}
                  onChange={handleChange}
                  className="input-field"
                  style={{ background: '#ffffff', cursor: 'pointer' }}
                >
                  {PRESET_INSTITUTIONS.map((inst, i) => (
                    <option key={i} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom institution text input if 'Other' selected */}
            {formData.institutionSelect === "Other / Affiliated University / Innovation Lab" && (
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Specify University / Engineering College / Incubation Lab Name *
                </label>
                <input
                  type="text"
                  name="customInstitution"
                  value={formData.customInstitution}
                  onChange={handleChange}
                  placeholder="Enter exact college / lab name..."
                  required
                  className="input-field"
                />
              </div>
            )}

            {/* 2. MENTOR APPROVAL & MOBILE OTP VERIFICATION SECTION */}
            <div style={{
              background: '#f8fafc',
              border: isOtpVerified ? '1.5px solid #86efac' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color={isOtpVerified ? '#15803d' : '#0a3977'} />
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0a3977' }}>
                    Faculty Mentor & Technical Hub Endorsement
                  </span>
                </div>
                {isOtpVerified && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #86efac'
                  }}>
                    Mentor Approved ✅
                  </span>
                )}
              </div>

              {/* Approval Choice */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Has this solution been reviewed & approved by a Faculty Mentor or Technical Hub Lead?
                </span>
                <div style={{ display: 'flex', gap: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: formData.hasMentorApproval === 'yes' ? '700' : '500' }}>
                    <input 
                      type="radio" 
                      name="hasMentorApproval" 
                      value="yes" 
                      checked={formData.hasMentorApproval === 'yes'} 
                      onChange={handleChange} 
                    />
                    <span>Yes — Approved by Mentor / Lab Lead</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: formData.hasMentorApproval === 'no' ? '700' : '500' }}>
                    <input 
                      type="radio" 
                      name="hasMentorApproval" 
                      value="no" 
                      checked={formData.hasMentorApproval === 'no'} 
                      onChange={handleChange} 
                    />
                    <span>No — Direct Student Submission (Pending Review ⏳)</span>
                  </label>
                </div>
              </div>

              {/* Mentor Inputs if Yes */}
              {formData.hasMentorApproval === 'yes' && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        Mentor Full Name *
                      </label>
                      <input
                        type="text"
                        name="mentorName"
                        value={formData.mentorName}
                        onChange={handleChange}
                        placeholder="e.g. Dr. Ramesh Rao"
                        disabled={isOtpVerified}
                        required={formData.hasMentorApproval === 'yes'}
                        className="input-field"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        Designation / Department *
                      </label>
                      <input
                        type="text"
                        name="mentorDesignation"
                        value={formData.mentorDesignation}
                        onChange={handleChange}
                        placeholder="e.g. Professor, Dept of Civil Eng"
                        disabled={isOtpVerified}
                        required={formData.hasMentorApproval === 'yes'}
                        className="input-field"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        Mentor Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="mentorPhone"
                        value={formData.mentorPhone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        disabled={isOtpVerified}
                        required={formData.hasMentorApproval === 'yes'}
                        className="input-field"
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  {/* OTP Action Bar */}
                  {!isOtpVerified ? (
                    <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      {!otpSent ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                            <Smartphone size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                            A verification code is required to officially certify your mentor's endorsement:
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendMentorOtp(false)}
                            disabled={otpLoading}
                            className="btn-primary"
                            style={{ fontSize: '0.82rem', padding: '7px 16px' }}
                          >
                            {otpLoading ? 'Generating OTP...' : 'Send Verification OTP'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          {/* Top Status */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Smartphone size={16} color="#0a3977" />
                              <span>Mobile Verification for {formData.mentorName} (+91 {activeOtpPhone || formData.mentorPhone})</span>
                            </div>
                            {hasCarrierGateway ? (
                              <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                                Cellular Carrier Active
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#1d4ed8', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                                Instant Phone Dispatch Active
                              </span>
                            )}
                          </div>

                          {/* Resend Success Banner */}
                          {resendSuccessMsg && (
                            <div style={{
                              marginBottom: '10px',
                              background: '#ecfdf5',
                              border: '1px solid #10b981',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              color: '#065f46',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <CheckCircle2 size={16} color="#059669" />
                              <span><strong>{resendSuccessMsg}</strong></span>
                            </div>
                          )}

                          {/* Direct Delivery Buttons to Phone */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: '8px', fontWeight: '700' }}>
                              📲 Deliver Verification Code to Phone (+91 {activeOtpPhone || formData.mentorPhone?.replace(/\D/g, '').slice(-10)}):
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#25D366',
                                    color: '#ffffff',
                                    fontSize: '0.82rem',
                                    fontWeight: '700',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    boxShadow: '0 2px 4px rgba(37,211,102,0.25)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span>🟢 Deliver OTP via WhatsApp (+91 {activeOtpPhone || formData.mentorPhone?.replace(/\D/g, '').slice(-10)})</span>
                                </a>
                              )}

                              {smsAppUrl && (
                                <a
                                  href={smsAppUrl}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#0a3977',
                                    color: '#ffffff',
                                    fontSize: '0.82rem',
                                    fontWeight: '700',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span>💬 Open Phone SMS App</span>
                                </a>
                              )}
                            </div>

                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '8px', lineHeight: '1.4' }}>
                              💡 <strong>Real-Time Delivery:</strong> Tap the green button above to deliver the OTP to <strong>+91 {activeOtpPhone || formData.mentorPhone}</strong>. The recipient will see the notification on their mobile device and share the 6-digit code.
                            </div>
                          </div>

                          {/* OTP Input & Verify Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              maxLength={6}
                              value={inputOtp}
                              onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="Enter 6-digit OTP"
                              style={{
                                width: '160px',
                                padding: '8px 12px',
                                fontSize: '0.92rem',
                                fontWeight: '700',
                                textAlign: 'center',
                                letterSpacing: '3px',
                                border: '1px solid #0a3977',
                                borderRadius: '4px'
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyMentorOtp}
                              disabled={otpLoading || !inputOtp || inputOtp.length < 4}
                              className="btn-primary"
                              style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                            >
                              {otpLoading ? 'Verifying...' : 'Verify OTP Code'}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleSendMentorOtp(true)}
                              disabled={isResending || resendCooldown > 0}
                              style={{
                                background: resendCooldown > 0 ? '#f1f5f9' : 'transparent',
                                border: resendCooldown > 0 ? '1px solid #cbd5e1' : 'none',
                                color: resendCooldown > 0 ? '#64748b' : '#0a3977',
                                padding: resendCooldown > 0 ? '6px 12px' : '0',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                              }}
                            >
                              {isResending ? '🔄 Resending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '🔄 Resend Code'}
                            </button>
                          </div>
                        </div>
                      )}

                      {otpError && (
                        <div style={{ marginTop: '10px', color: '#b91c1c', fontSize: '0.78rem', background: '#fef2f2', padding: '6px 10px', borderRadius: '4px' }}>
                          ⚠️ {otpError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                      color: '#166534'
                    }}>
                      <CheckCircle2 size={16} color="#15803d" />
                      <span>
                        <strong>Mentor Verified: </strong>
                        Mobile OTP successfully validated for {formData.mentorName} ({formData.mentorPhone}). This solution will feature the official <strong>Mentor Approved ✅</strong> badge.
                      </span>
                    </div>
                  )}

                  {/* 3. INDUSTRY PARTNER / TECHNICAL HUB (UNLOCKED UPON MENTOR APPROVAL) */}
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Briefcase size={15} color="#0a3977" />
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0a3977' }}>
                        Industry Partner / Innovation Hub Backing (Optional)
                      </label>
                      <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                        Unlocked via Mentor Approval
                      </span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '8px' }}>
                      If this institutional project is supported or co-incubated by an industry CSR partner or corporate innovation lab, select it below:
                    </p>
                    <select
                      name="industryPartnerSelect"
                      value={formData.industryPartnerSelect}
                      onChange={handleChange}
                      className="input-field"
                      style={{ background: '#ffffff', cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      <option value="">-- None / Independent Institutional Lab Project --</option>
                      {PRESET_INDUSTRY_PARTNERS.map((partner, i) => (
                        <option key={i} value={partner}>{partner}</option>
                      ))}
                    </select>

                    {formData.industryPartnerSelect === "Other Industry Partner / Technical Hub" && (
                      <input
                        type="text"
                        name="customIndustryPartner"
                        value={formData.customIndustryPartner}
                        onChange={handleChange}
                        placeholder="Enter Industry / Technical Hub Name (e.g. Cisco ThingQbator, Bosch Mobility Lab)..."
                        className="input-field"
                        style={{ marginTop: '8px', fontSize: '0.82rem' }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Student Lead Contact Coordinates */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0a3977', marginBottom: '8px' }}>
                Student Team Lead Coordinates (For Official District Pilot Sanction)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Lead Name *</label>
                  <input
                    type="text"
                    name="contactLead"
                    value={formData.contactLead}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="input-field"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Official Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="rahul@iitd.ac.in"
                    required
                    className="input-field"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    className="input-field"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>

            {/* 5. Timeline, Budget, Prototype Link */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Execution Days ({problem?.level} SLA: {problem?.maxResolutionDays}d) *
                </label>
                <input
                  type="number"
                  name="implementationTimeDays"
                  value={formData.implementationTimeDays}
                  onChange={handleChange}
                  min="1"
                  max="90"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Estimated Budget
                </label>
                <input
                  type="text"
                  name="estimatedBudget"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                  placeholder="e.g. ₹ 35,000"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Prototype / GitHub URL
                </label>
                <input
                  type="url"
                  name="prototypeUrl"
                  value={formData.prototypeUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/..."
                  className="input-field"
                />
              </div>
            </div>

            {/* 6. Technical Proposal Description */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Technical Architecture & Execution Methodology *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Explain the root-cause fix, engineering methodology, IoT or low-cost materials used, and why this prevents recurring failure..."
                required
                className="input-field"
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    <span>Groq AI Scoring in Progress...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit & Run AI Evaluation (100 Pts)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
