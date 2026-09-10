import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RubricModal from './components/RubricModal';
import ProblemBoard from './pages/ProblemBoard';
import ProblemDetail from './pages/ProblemDetail';
import SubmitProblem from './pages/SubmitProblem';
import CollegePortal from './pages/CollegePortal';
import GovernmentPortal from './pages/GovernmentPortal';
import SuperAdminPortal from './pages/SuperAdminPortal';
import GestureNavButton from './components/GestureNavButton';
import { Award, ShieldCheck } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';

function MainApp() {
  // By default, open in Citizen / User's Portal as strictly requested
  const [portalMode, setPortalMode] = useState('citizen'); // 'citizen' | 'college' | 'government'
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'submit' | 'detail'
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRubricOpen, setIsRubricOpen] = useState(false);

  // History stack for gesture navigation (back to previous dashboards without clicking main buttons)
  const [historyStack, setHistoryStack] = useState([]);

  // Fetch problems list from backend API
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/problems');
      const data = await res.json();
      if (res.ok && data.problems) {
        setProblems(data.problems);
      }
    } catch (err) {
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // Helper to push current state to history stack before transitioning
  const pushHistory = (newPortal, newTab, newProbId) => {
    // Only push if there is a real transition
    if (newPortal !== portalMode || newTab !== activeTab || newProbId !== selectedProblemId) {
      setHistoryStack(prev => [
        ...prev.slice(-15), // keep last 15 navigation steps
        {
          portalMode,
          activeTab,
          selectedProblemId
        }
      ]);
    }
  };

  const handlePortalSwitch = (newMode) => {
    if (newMode !== portalMode) {
      pushHistory(newMode, 'board', null);
      setPortalMode(newMode);
      setActiveTab('board');
      setSelectedProblemId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTabSwitch = (newTab) => {
    if (newTab !== activeTab) {
      pushHistory(portalMode, newTab, null);
      setActiveTab(newTab);
      if (newTab !== 'detail') setSelectedProblemId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProblem = (id) => {
    pushHistory(portalMode, 'detail', id);
    setSelectedProblemId(id);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProblemCreated = (newProb) => {
    fetchProblems();
    setSelectedProblemId(newProb.id);
  };

  // Pop from history stack to go back to previous dashboard / view
  const handleGoBack = () => {
    if (historyStack.length > 0) {
      const lastState = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, -1));
      setPortalMode(lastState.portalMode);
      setActiveTab(lastState.activeTab);
      setSelectedProblemId(lastState.selectedProblemId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeTab === 'detail') {
      setActiveTab('board');
      setSelectedProblemId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (portalMode !== 'citizen') {
      setPortalMode('citizen');
      setActiveTab('board');
      setSelectedProblemId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Derive title of previous view for the gesture button pill
  const getPreviousTitle = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      if (prev.selectedProblemId) return 'Problem Detail';
      if (prev.portalMode === 'superadmin') return 'Super Admin';
      if (prev.portalMode === 'college') return 'College Hub';
      if (prev.portalMode === 'government') return 'Government Portal';
      if (prev.portalMode === 'citizen') {
        return prev.activeTab === 'submit' ? 'Report Form' : 'Citizen Board';
      }
    }
    if (activeTab === 'detail') return 'Dashboard';
    if (portalMode !== 'citizen') return 'Citizen Board';
    return '';
  };

  const canGoBack = historyStack.length > 0 || activeTab === 'detail' || portalMode !== 'citizen';
  const totalSolutions = problems.reduce((acc, p) => acc + (p.solutionCount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar with Brand, Live Metrics, and Top-Right Portal Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
        portalMode={portalMode}
        setPortalMode={handlePortalSwitch}
        onOpenRubric={() => setIsRubricOpen(true)}
        stats={{
          totalProblems: problems.length,
          totalSolutions: totalSolutions
        }}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* Detail view is accessible from any portal */}
        {activeTab === 'detail' && selectedProblemId ? (
          <ProblemDetail
            problemId={selectedProblemId}
            portalMode={portalMode}
            onBack={handleGoBack}
            onNavigateToProblem={(id) => {
              handleSelectProblem(id);
            }}
          />
        ) : (
          <>
            {/* 1. CITIZEN PORTAL (DEFAULT VIEW) */}
            {portalMode === 'citizen' && (
              <>
                {activeTab === 'board' && (
                  <ProblemBoard
                    problems={problems}
                    loading={loading}
                    onSelectProblem={handleSelectProblem}
                  />
                )}

                {activeTab === 'submit' && (
                  <SubmitProblem
                    onProblemCreated={handleProblemCreated}
                    onNavigateBoard={() => {
                      handleTabSwitch('board');
                    }}
                  />
                )}
              </>
            )}

            {/* 2. COLLEGE / TECHNICAL HUB PORTAL */}
            {portalMode === 'college' && (
              <CollegePortal
                problems={problems}
                onSelectProblem={handleSelectProblem}
                onProblemUpdated={fetchProblems}
                onBack={handleGoBack}
              />
            )}

            {/* 3. GOVERNMENT / AUTHORITY COMMAND CENTER PORTAL */}
            {portalMode === 'government' && (
              <GovernmentPortal
                problems={problems}
                onSelectProblem={handleSelectProblem}
                onSwitchToCollege={() => handlePortalSwitch('college')}
                onProblemUpdated={fetchProblems}
                onBack={handleGoBack}
              />
            )}

            {/* 4. SUPER ADMIN PORTAL */}
            {portalMode === 'superadmin' && (
              <SuperAdminPortal
                problems={problems}
                onSelectProblem={handleSelectProblem}
                onSwitchToCollege={() => handlePortalSwitch('college')}
                onProblemUpdated={fetchProblems}
                onBack={handleGoBack}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Gesture Navigation & Quick Back Pill */}
      <GestureNavButton
        canGoBack={canGoBack}
        previousTitle={getPreviousTitle()}
        onGoBack={handleGoBack}
      />

      {/* Official Government 6-Parameter Weightage & SLA Rubric Modal */}
      <RubricModal
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.95)',
        padding: '24px 20px',
        marginTop: '40px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '800', fontSize: '1rem', color: '#f8fafc' }}>
                Sahayog<span style={{ color: '#f97316' }}>Setu</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                • National Civic Problem-Solving & Technical Hub Network
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '560px' }}>
              Connects citizens (ground reality), university technical hubs (engineering prototypes), and government authorities (pilot sanctions).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsRubricOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fbbf24',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Award size={15} />
              <span>SIH 100-pt Evaluation Rubric</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: '#475569' }}>•</span>

            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Active View: <strong style={{ 
                color: portalMode === 'college' ? '#4ade80' : 
                       portalMode === 'government' ? '#fb923c' : 
                       portalMode === 'superadmin' ? '#c084fc' : '#60a5fa' 
              }}>
                {portalMode === 'college' ? 'College Hub' : 
                 portalMode === 'government' ? 'Government Command' : 
                 portalMode === 'superadmin' ? 'Super Admin' : 'Citizen Portal'}
              </strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
