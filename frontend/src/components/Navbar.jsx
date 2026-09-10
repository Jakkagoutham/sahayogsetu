import React, { useState } from 'react';
import { 
  ShieldCheck, PlusCircle, LayoutGrid, Award, 
  Building2, ShieldAlert, ChevronDown, Check, User, Globe, Languages 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  portalMode, 
  setPortalMode, 
  onOpenRubric, 
  stats 
}) {
  const [isPortalDropdownOpen, setIsPortalDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const { t, language, setLanguage, supportedLanguages, currentLangObj } = useLanguage();

  const getPortalInfo = () => {
    switch (portalMode) {
      case 'college':
        return {
          title: 'College Hub Portal',
          icon: <Building2 size={16} color="#4ade80" />,
          color: '#10b981',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          badgeBorder: 'rgba(16, 185, 129, 0.4)'
        };
      case 'government':
        return {
          title: 'Government Portal',
          icon: <ShieldAlert size={16} color="#fb923c" />,
          color: '#f97316',
          badgeBg: 'rgba(249, 115, 22, 0.15)',
          badgeBorder: 'rgba(249, 115, 22, 0.4)'
        };
      case 'superadmin':
        return {
          title: 'Super Admin Portal',
          icon: <ShieldCheck size={16} color="#c084fc" />,
          color: '#a855f7',
          badgeBg: 'rgba(168, 85, 247, 0.15)',
          badgeBorder: 'rgba(168, 85, 247, 0.4)'
        };
      default:
        return {
          title: 'Citizen Portal',
          icon: <User size={16} color="#60a5fa" />,
          color: '#3b82f6',
          badgeBg: 'rgba(59, 130, 246, 0.15)',
          badgeBorder: 'rgba(59, 130, 246, 0.4)'
        };
    }
  };

  const portalInfo = getPortalInfo();

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(11, 15, 25, 0.9)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div 
          onClick={() => { setPortalMode('citizen'); setActiveTab('board'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f97316 0%, #2563eb 50%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Sahayog<span style={{ color: '#f97316' }}>Setu</span>
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: '700', 
                background: portalInfo.badgeBg, 
                color: portalInfo.color, 
                padding: '2px 8px', 
                borderRadius: '9999px',
                border: `1px solid ${portalInfo.badgeBorder}`
              }}>
                {portalInfo.title.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Crowdsourced Civic Challenges • Technical Hubs & Autonomous AI
            </p>
          </div>
        </div>

        {/* Center Navigation (Relevant to Citizen View) */}
        {portalMode === 'citizen' && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('board')}
              className={activeTab === 'board' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            >
              <LayoutGrid size={15} />
              <span>{t('problemBoard')}</span>
            </button>

            <button
              onClick={() => setActiveTab('submit')}
              className={activeTab === 'submit' ? 'btn-accent' : 'btn-secondary'}
              style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            >
              <PlusCircle size={15} />
              <span>{t('reportProblem')}</span>
            </button>

            <button
              onClick={onOpenRubric}
              className="btn-secondary"
              title="Official SIH 6-Parameter Weightage Matrix & SLA Timelines"
              style={{ padding: '7px 12px', fontSize: '0.8rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}
            >
              <Award size={15} />
              <span>{t('sihRubric')}</span>
            </button>
          </nav>
        )}

        {/* Top-Right Portal Switcher Button as explicitly requested by user */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsPortalDropdownOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(30, 41, 59, 0.85)',
              border: `1px solid ${portalInfo.badgeBorder}`,
              borderRadius: '12px',
              padding: '8px 14px',
              cursor: 'pointer',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {portalInfo.icon}
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Switch Portal</div>
              <div style={{ color: portalInfo.color }}>{portalInfo.title}</div>
            </div>
            <ChevronDown size={15} color="#94a3b8" />
          </button>

          {/* Switcher Dropdown Menu */}
          {isPortalDropdownOpen && (
            <div 
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                padding: '8px',
                zIndex: 200,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Option 1: Citizen Portal (Default) */}
              <div
                onClick={() => {
                  setPortalMode('citizen');
                  setActiveTab('board');
                  setIsPortalDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: portalMode === 'citizen' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: portalMode === 'citizen' ? '#60a5fa' : '#cbd5e1',
                  fontSize: '0.82rem',
                  marginBottom: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={16} color="#60a5fa" />
                  <div>
                    <div style={{ fontWeight: '700' }}>Citizen Portal</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Public challenges & reporting</div>
                  </div>
                </div>
                {portalMode === 'citizen' && <Check size={14} color="#60a5fa" />}
              </div>

              {/* Option 2: College Portal */}
              <div
                onClick={() => {
                  setPortalMode('college');
                  setIsPortalDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: portalMode === 'college' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: portalMode === 'college' ? '#4ade80' : '#cbd5e1',
                  fontSize: '0.82rem',
                  marginBottom: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={16} color="#4ade80" />
                  <div>
                    <div style={{ fontWeight: '700' }}>College Hub Portal</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>University labs & student teams</div>
                  </div>
                </div>
                {portalMode === 'college' && <Check size={14} color="#4ade80" />}
              </div>

              {/* Option 3: Government Portal */}
              <div
                onClick={() => {
                  setPortalMode('government');
                  setIsPortalDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: portalMode === 'government' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                  color: portalMode === 'government' ? '#fb923c' : '#cbd5e1',
                  fontSize: '0.82rem',
                  marginBottom: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={16} color="#fb923c" />
                  <div>
                    <div style={{ fontWeight: '700' }}>Government Portal</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Command center & pilot grants</div>
                  </div>
                </div>
                {portalMode === 'government' && <Check size={14} color="#fb923c" />}
              </div>

              {/* Option 4: Super Admin Portal */}
              <div
                onClick={() => {
                  setPortalMode('superadmin');
                  setIsPortalDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: portalMode === 'superadmin' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  color: portalMode === 'superadmin' ? '#c084fc' : '#cbd5e1',
                  fontSize: '0.82rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={16} color="#c084fc" />
                  <div>
                    <div style={{ fontWeight: '700' }}>Super Admin Portal</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Institutions & system control</div>
                  </div>
                </div>
                {portalMode === 'superadmin' && <Check size={14} color="#c084fc" />}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '8px 12px',
              cursor: 'pointer',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <Globe size={16} color="#38bdf8" />
            <span>{currentLangObj.flag} {currentLangObj.nativeName}</span>
            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {isLangDropdownOpen && (
            <div 
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '190px',
                padding: '6px',
                zIndex: 200,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8)',
                borderRadius: '12px',
                background: '#111827'
              }}
            >
              <div style={{ padding: '4px 8px 6px', fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Language
              </div>
              {supportedLanguages.map(l => (
                <div
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setIsLangDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: language === l.code ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: language === l.code ? '#38bdf8' : '#cbd5e1',
                    fontSize: '0.82rem',
                    marginBottom: '2px',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{l.flag}</span>
                    <span style={{ fontWeight: language === l.code ? '700' : '500' }}>{l.nativeName}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({l.name})</span>
                  </div>
                  {language === l.code && <Check size={14} color="#38bdf8" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
