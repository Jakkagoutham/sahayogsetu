import React from 'react';
import { X, Award, Clock, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function RubricModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="gov-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '6px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #fde68a'
            }}>
              <Award size={24} color="#b45309" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0a3977' }}>
                Official Government Evaluation Matrix
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                Standards prescribed by the Smart India Hackathon & administrative SLA benchmarks
              </p>
            </div>
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

        {/* Section 1: 6-Parameter Weightage Matrix */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <CheckCircle2 size={16} color="#0a3977" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f2744' }}>
              Table 1: AI Solution Evaluation Matrix (100 Points Total)
            </h3>
          </div>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            background: '#ffffff',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #cbd5e1'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px', fontWeight: '700', color: '#0f2744', borderBottom: '1px solid #cbd5e1' }}>
                  Parameter
                </th>
                <th style={{ padding: '10px 16px', fontWeight: '800', color: '#0a3977', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>
                  Weightage (Points)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b' }}>Resolution Rate</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>30</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b' }}>Average Closure Time vs SLA</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>20</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b' }}>Citizen Satisfaction Score</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>20</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b' }}>Escalation Percentage</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>10</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b' }}>Reopened Cases / Durability</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>10</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b' }}>Innovation & Best Practices</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: '800', color: '#0369a1' }}>10</td>
              </tr>
              <tr style={{ background: '#f0fdf4' }}>
                <td style={{ padding: '12px 16px', fontWeight: '800', color: '#166534' }}>Total Comprehensive Merit Score</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: '#15803d', fontSize: '1rem' }}>100</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: SLA Timelines & Automatic Escalation */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Clock size={16} color="#ea580c" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f2744' }}>
              Table 2: Administrative Level & Maximum Resolution SLA
            </h3>
          </div>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            background: '#ffffff',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            marginBottom: '14px'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px', fontWeight: '700', color: '#0f2744', borderBottom: '1px solid #cbd5e1' }}>
                  Administrative Tier
                </th>
                <th style={{ padding: '10px 16px', fontWeight: '800', color: '#ea580c', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>
                  Maximum Resolution SLA
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b', fontWeight: '600' }}>Village / Ward</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', color: '#0f2744', fontWeight: '700' }}>7 Days</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b', fontWeight: '600' }}>Mandal</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', color: '#0f2744', fontWeight: '700' }}>15 Days</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '9px 16px', color: '#1e293b', fontWeight: '600' }}>District</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', color: '#0f2744', fontWeight: '700' }}>30 Days</td>
              </tr>
              <tr>
                <td style={{ padding: '9px 16px', color: '#1e293b', fontWeight: '600' }}>State</td>
                <td style={{ padding: '9px 16px', textAlign: 'right', color: '#dc2626', fontWeight: '700' }}>Special Review</td>
              </tr>
            </tbody>
          </table>

          {/* Automatic Escalation Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '0.82rem',
            color: '#991b1b'
          }}>
            <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>
              <strong>Statutory Escalation:</strong> Automatic administrative escalation triggers when timelines are exceeded.
            </span>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button onClick={onClose} className="btn-secondary">
            Close Rubric
          </button>
        </div>
      </div>
    </div>
  );
}
