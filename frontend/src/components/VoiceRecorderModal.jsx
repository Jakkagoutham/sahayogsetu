import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RefreshCw, Sparkles, X, Volume2, AlertCircle, CheckCircle2, Globe, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceRecorderModal({ isOpen, onClose, onVoiceDataExtracted }) {
  const { t, language, supportedLanguages } = useLanguage();

  const [recordingState, setRecordingState] = useState('idle'); // idle | recording | stopped | processing | done | error
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [selectedLangHint, setSelectedLangHint] = useState(language || 'auto');
  const [extractedResult, setExtractedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [textFallback, setTextFallback] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
    }
  }, [isOpen]);

  const cleanupRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setExtractedResult(null);
    setErrorMessage('');
    setShowTextFallback(false);
  };

  const startRecording = async () => {
    setErrorMessage('');
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please use the text input option.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType }) 
        : new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(blob);
        // Stop all audio tracks to release microphone hardware
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250); // Slice every 250ms
      setRecordingState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            // Auto stop after 60 seconds
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone access failed:', err);
      setErrorMessage(err.message || 'Microphone access was denied. You can paste or type your regional speech below.');
      setShowTextFallback(true);
      setRecordingState('error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setRecordingState('stopped');
  };

  const handleProcessAudio = async () => {
    if (!audioBlob) return;
    setRecordingState('processing');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (selectedLangHint && selectedLangHint !== 'auto') {
        formData.append('language', selectedLangHint);
      }

      const res = await fetch('/api/problems/voice-intake', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to analyze voice recording');
      }

      setExtractedResult(data.data);
      setRecordingState('done');
    } catch (err) {
      console.error('Voice processing error:', err);
      setErrorMessage(err.message || 'Error processing audio. Please try again.');
      setRecordingState('error');
    }
  };

  const handleProcessTextFallback = async () => {
    if (!textFallback.trim()) return;
    setRecordingState('processing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/problems/voice-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spokenText: textFallback.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to structure grievance');
      }

      setExtractedResult(data.data);
      setRecordingState('done');
    } catch (err) {
      console.error('Text fallback error:', err);
      setErrorMessage(err.message || 'Error structuring text');
      setRecordingState('error');
    }
  };

  const handleApplyToForm = () => {
    if (extractedResult && onVoiceDataExtracted) {
      onVoiceDataExtracted(extractedResult);
      onClose();
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #111827 0%, #0d121f 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.15)',
        overflow: 'hidden',
        animation: 'modalSlideUp 0.25s ease-out'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
            }}>
              <Mic size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
                {t('voiceModalTitle')}
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                <Sparkles size={12} color="#a855f7" /> Powered by Groq Whisper & LLM
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem' }}>
          
          {/* Language Selection Bar */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '0.6rem 0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
              <Languages size={15} color="#38bdf8" />
              <span>Spoken Language:</span>
            </div>
            <select
              value={selectedLangHint}
              onChange={(e) => setSelectedLangHint(e.target.value)}
              disabled={recordingState === 'recording' || recordingState === 'processing'}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '0.35rem 0.6rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="auto">🌐 Auto-Detect All Indian Languages</option>
              {supportedLanguages.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.nativeName} ({l.name})</option>
              ))}
            </select>
          </div>

          {/* RECORDING STATE VIEW */}
          {recordingState !== 'done' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              
              {/* Central Mic Visualizer Button */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
                {recordingState === 'recording' && (
                  <div style={{
                    position: 'absolute',
                    inset: '-12px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.25)',
                    animation: 'pulseRing 1.5s infinite ease-out'
                  }} />
                )}
                <button
                  type="button"
                  onClick={recordingState === 'recording' ? stopRecording : startRecording}
                  disabled={recordingState === 'processing'}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: recordingState === 'recording' 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                      : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: recordingState === 'processing' ? 'not-allowed' : 'pointer',
                    boxShadow: recordingState === 'recording'
                      ? '0 0 35px rgba(239, 68, 68, 0.6)'
                      : '0 0 25px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  {recordingState === 'recording' ? (
                    <Square size={32} fill="#ffffff" />
                  ) : (
                    <Mic size={38} />
                  )}
                </button>
              </div>

              {/* Status / Timer */}
              {recordingState === 'recording' ? (
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ef4444', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                    ● {formatTimer(recordingTime)}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc', fontWeight: '600' }}>
                    {t('listeningState')}
                  </p>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Mention what the issue is, what happened, and which village/ward you are from. Click stop when finished.
                  </p>

                  {/* Audio Waveform Animation Bars */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', height: '24px', marginTop: '1rem' }}>
                    {[...Array(9)].map((_, i) => (
                      <div key={i} style={{
                        width: '3px',
                        background: '#ef4444',
                        borderRadius: '2px',
                        animation: `waveBar 0.8s infinite ease-in-out alternate ${i * 0.1}s`,
                        height: `${8 + (i % 3) * 7}px`
                      }} />
                    ))}
                  </div>
                </div>
              ) : recordingState === 'stopped' ? (
                <div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={18} /> Voice Recorded ({formatTimer(recordingTime)})
                  </p>
                  <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={startRecording}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#cbd5e1',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <RefreshCw size={14} /> {t('reRecord')}
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessAudio}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '0.6rem 1.4rem',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <Sparkles size={16} /> Process with Groq AI
                    </button>
                  </div>
                </div>
              ) : recordingState === 'processing' ? (
                <div style={{ padding: '1rem 0' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto 1rem',
                    border: '3px solid rgba(59, 130, 246, 0.2)',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc', fontWeight: '600' }}>
                    {t('processingAudio')}
                  </p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Transcribing regional speech with Whisper and auto-filling civic fields...
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: '600' }}>
                    {t('pressToRecord')}
                  </p>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Speak freely in Hindi, Telugu, Tamil, Marathi, or English. AI will understand and auto-fill your grievance.
                  </p>
                </div>
              )}

              {/* Error Box */}
              {errorMessage && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'left'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Text Fallback Toggle */}
              {!showTextFallback && recordingState !== 'recording' && (
                <button
                  type="button"
                  onClick={() => setShowTextFallback(true)}
                  style={{
                    marginTop: '1.25rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Can't record? Type or dictate in your language instead
                </button>
              )}

              {/* Text Fallback Input */}
              {showTextFallback && (
                <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem' }}>
                    Type or paste in any language (e.g. Hindi, Telugu, Tamil):
                  </label>
                  <textarea
                    rows={3}
                    value={textFallback}
                    onChange={(e) => setTextFallback(e.target.value)}
                    placeholder="e.g. మా గ్రామంలో మెయిన్ రోడ్డు దగ్గర మురుగు కాలువ పొంగి రోడ్డు మీద పారుతోంది..."
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      padding: '0.6rem',
                      fontSize: '0.85rem',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleProcessTextFallback}
                    disabled={!textFallback.trim() || recordingState === 'processing'}
                    style={{
                      marginTop: '0.5rem',
                      width: '100%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '0.55rem',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✨ Process Text with AI
                  </button>
                </div>
              )}

            </div>
          )}

          {/* EXTRACTED RESULT VIEW */}
          {recordingState === 'done' && extractedResult && (
            <div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: '700', fontSize: '0.92rem' }}>
                    <CheckCircle2 size={16} /> {t('voiceSuccessTitle')}
                  </div>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontWeight: '600'
                  }}>
                    {extractedResult.detectedLanguage}
                  </span>
                </div>
                
                {/* Original Transcript */}
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                  "{extractedResult.transcribedText}"
                </div>

                {/* Structured Fields Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Title: </span>
                    <strong style={{ color: '#f8fafc' }}>{extractedResult.title}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Category: </span>
                    <span style={{ color: '#38bdf8', fontWeight: '600' }}>{extractedResult.category}</span>
                    <span style={{ margin: '0 0.5rem', color: '#475569' }}>•</span>
                    <span style={{ color: '#94a3b8' }}>Urgency: </span>
                    <span style={{ color: '#fb923c', fontWeight: '600' }}>{extractedResult.urgency}</span>
                  </div>
                  {(extractedResult.village || extractedResult.areaName) && (
                    <div>
                      <span style={{ color: '#94a3b8' }}>Extracted Locality: </span>
                      <span style={{ color: '#cbd5e1' }}>
                        {[extractedResult.areaName, extractedResult.village, extractedResult.mandal, extractedResult.district, extractedResult.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRecordingState('idle')}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RefreshCw size={14} /> Record Again
                </button>
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Sparkles size={16} /> Auto-Fill Form & Continue
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.25); opacity: 0.3; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes waveBar {
          0% { height: 6px; }
          100% { height: 22px; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
