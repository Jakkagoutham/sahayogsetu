import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUp, Compass } from 'lucide-react';

export default function GestureNavButton({ 
  canGoBack, 
  previousTitle, 
  onGoBack 
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll for Scroll-to-Top floating button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 260);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut listener (Alt + ArrowLeft or Backspace when not in input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input or textarea
      const targetTag = e.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if ((e.altKey && e.key === 'ArrowLeft') || (e.key === 'Escape' && canGoBack)) {
        if (canGoBack && onGoBack) {
          e.preventDefault();
          onGoBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, onGoBack]);

  // Touch swipe gesture listener (swipe from left edge to right)
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e) => {
      if (startX < 80 && e.changedTouches.length === 1) {
        const diffX = e.changedTouches[0].clientX - startX;
        const diffY = Math.abs(e.changedTouches[0].clientY - startY);
        // If swiped right at least 70px with minimal vertical movement
        if (diffX > 70 && diffY < 50 && canGoBack && onGoBack) {
          onGoBack();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canGoBack, onGoBack]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Floating Quick Gesture / Previous Dashboard Pill Button (Bottom Left) */}
      {canGoBack && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 990,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <button
            onClick={onGoBack}
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: '700',
              transition: 'all 0.2s ease'
            }}
            title="Press Alt + Left Arrow or swipe right to go back"
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowLeft size={16} color="#60a5fa" />
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1' }}>
                Previous Dashboard
              </span>
              <span style={{ color: '#60a5fa' }}>
                {previousTitle || 'Previous View'}
              </span>
            </div>
            <span style={{
              fontSize: '0.65rem',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#94a3b8',
              marginLeft: '4px'
            }}>
              Alt + ←
            </span>
          </button>
        </div>
      )}

      {/* 2. Floating Scroll-to-Top Button (Bottom Right) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="glass-card"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc',
            cursor: 'pointer',
            zIndex: 990,
            transition: 'all 0.2s ease'
          }}
          title="Scroll to Top"
        >
          <ArrowUp size={18} color="#38bdf8" />
        </button>
      )}
    </>
  );
}
