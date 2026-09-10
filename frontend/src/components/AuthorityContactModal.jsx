import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, ExternalLink, Calendar, Wallet, CheckCircle, Send } from 'lucide-react';

export default function AuthorityContactModal({ isOpen, onClose, solution, problem }) {
  const [sanctionSent, setSanctionSent] = useState(false);

  if (!isOpen || !solution) return null;

  const handleSendSanction = () => {
    setSanctionSent(true);
    setTimeout(() => {
      setSanctionSent(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="gov-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          width: '100%',
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
                background: '#eff6ff', 
                color: '#1d4ed8', 
                padding: '3px 8px', 
                borderRadius: '4px',
                border: '1px solid #bfdbfe'
              }}>
                GOVERNMENT AUTHORITY CONNECT
              </span>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '800' }}>
                AI Merit: {solution.aiEvaluation?.totalScore || 85}/100
              </span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0a3977' }}>
              {solution.teamName}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>
              {solution.institution || 'University Research & Innovation Team'}
            </p>
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

        {/* Problem Reference */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          fontSize: '0.82rem'
        }}>
          <span style={{ color: '#64748b' }}>Target Civic Grievance: </span>
          <strong style={{ color: '#0f2744' }}>{problem?.title}</strong>
        </div>

        {/* Contact Information Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {/* Team Lead */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <User size={18} color="#0a3977" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Team Lead / Student Innovator</div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f2744' }}>
                {solution.contactLead || 'Student Team Leader'}
              </div>
            </div>
          </div>

          {/* Email */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <Mail size={18} color="#ea580c" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Official University Email</div>
              <a 
                href={`mailto:${solution.contactEmail || 'innovate@university.edu'}`}
                style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0a3977', textDecoration: 'none' }}
              >
                {solution.contactEmail || 'innovate@university.edu'}
              </a>
            </div>
            <a 
              href={`mailto:${solution.contactEmail || 'innovate@university.edu'}?subject=Govt Collaboration: ${encodeURIComponent(problem?.title || 'Civic Problem')}`}
              className="btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Compose Mail
            </a>
          </div>

          {/* Phone */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <Phone size={18} color="#15803d" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Official Contact Number</div>
              <a 
                href={`tel:${solution.contactPhone || '+919876543210'}`}
                style={{ fontSize: '0.88rem', fontWeight: '700', color: '#15803d', textDecoration: 'none' }}
              >
                {solution.contactPhone || '+91 98765 43210'}
              </a>
            </div>
            <a 
              href={`tel:${solution.contactPhone || '+919876543210'}`}
              className="btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Call Team
            </a>
          </div>

          {/* Institutional Faculty Mentor Credentials */}
          <div style={{
            background: (solution.mentorStatus === 'approved' || solution.mentorStatus === 'Mentor Approved' || solution.mentorDetails?.isOtpVerified) ? '#f0fdf4' : '#fffbeb',
            padding: '12px 14px',
            borderRadius: '6px',
            border: (solution.mentorStatus === 'approved' || solution.mentorStatus === 'Mentor Approved' || solution.mentorDetails?.isOtpVerified) ? '1px solid #bbf7d0' : '1px solid #fde68a',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Building2 size={20} color={(solution.mentorStatus === 'approved' || solution.mentorStatus === 'Mentor Approved' || solution.mentorDetails?.isOtpVerified) ? '#15803d' : '#d97706'} style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase' }}>
                  Institutional Faculty Mentor & Technical Hub Lead
                </div>
                {(solution.mentorStatus === 'approved' || solution.mentorStatus === 'Mentor Approved' || solution.mentorDetails?.isOtpVerified) ? (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #86efac'
                  }}>
                    OTP Verified & Approved ✅
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #fde68a'
                  }}>
                    Pending Verification ⏳
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f2744' }}>
                {solution.mentorDetails?.name || 'Academic Faculty Mentor'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                {solution.mentorDetails?.designation || 'Institutional Research Guide'} 
                {solution.mentorDetails?.phone ? ` • Contact: ${solution.mentorDetails.phone}` : ''}
              </div>
            </div>
          </div>

          {/* Industry Partner Backing (if present) */}
          {solution.industryPartner && (
            <div style={{
              background: '#eff6ff',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🏢</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.68rem', color: '#1e40af', fontWeight: '700', textTransform: 'uppercase' }}>
                  Industry Partner / Innovation Hub Backing
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1e3a8a' }}>
                  Backed by: {solution.industryPartner}
                </div>
              </div>
            </div>
          )}

          {/* Timeline & Budget Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Calendar size={16} color="#d97706" />
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Time to Implement</div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f2744' }}>
                  {solution.implementationTimeDays || 7} Days
                </div>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Wallet size={16} color="#7c3aed" />
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Estimated Budget</div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f2744' }}>
                  {solution.estimatedBudget || 'Standard'}
                </div>
              </div>
            </div>
          </div>

          {/* Prototype URL if provided */}
          {solution.prototypeUrl && (
            <div style={{
              background: '#eff6ff',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExternalLink size={16} color="#1d4ed8" />
                <span style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: '600' }}>Prototype / Demo Repository</span>
              </div>
              <a 
                href={solution.prototypeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: '#0a3977', fontWeight: '700' }}
              >
                View Live Demo →
              </a>
            </div>
          )}
        </div>

        {/* Action Button for Authorities */}
        <div>
          {sanctionSent ? (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              color: '#15803d',
              padding: '12px',
              borderRadius: '6px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              fontWeight: '700'
            }}>
              <CheckCircle size={18} />
              <span>Official Collaboration Notice Dispatched to University Team!</span>
            </div>
          ) : (
            <button 
              onClick={handleSendSanction}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              <Send size={16} />
              <span>Initiate Official Pilot Sanction / District MoU</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
