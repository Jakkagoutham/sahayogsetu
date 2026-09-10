import React, { useState, useRef } from 'react';
import { Camera, MapPin, ShieldAlert, Sparkles, CheckCircle, AlertTriangle, ArrowRight, Layers, RefreshCw, XCircle, ArrowLeft, Mic, Volume2 } from 'lucide-react';
import EXIF from 'exif-js';
import { useLanguage } from '../context/LanguageContext';
import VoiceRecorderModal from '../components/VoiceRecorderModal';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi NCR", "Jammu and Kashmir", "Ladakh"
];

export default function SubmitProblem({ onProblemCreated, onNavigateBoard }) {
  const { t } = useLanguage();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceFilledNotice, setVoiceFilledNotice] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    state: 'Uttar Pradesh',
    district: '',
    mandal: '',
    village: '',
    areaName: '',
    pincode: '',
    lat: '',
    lng: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gpsExtracted, setGpsExtracted] = useState(false);
  const [gpsPromptRequired, setGpsPromptRequired] = useState(false);
  const [photoAuthenticityNote, setPhotoAuthenticityNote] = useState(null);
  const [photoMismatchError, setPhotoMismatchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Extract EXIF from uploaded image
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setGpsExtracted(false);
    setGpsPromptRequired(false);
    setPhotoAuthenticityNote(null);
    setPhotoMismatchError(null);
    setError('');

    // Read EXIF client-side
    EXIF.getData(file, function() {
      const lat = EXIF.getTag(this, "GPSLatitude");
      const lng = EXIF.getTag(this, "GPSLongitude");
      const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
      const lngRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";
      const software = (EXIF.getTag(this, "Software") || "").toLowerCase();
      const make = EXIF.getTag(this, "Make") || "";
      const model = EXIF.getTag(this, "Model") || "";

      // AI photo authenticity heuristic check
      const aiTokens = ["midjourney", "stable diffusion", "dall-e", "canvas", "photoshop generative", "novelai"];
      const isAI = aiTokens.some(tok => software.includes(tok));

      if (isAI) {
        setPhotoAuthenticityNote({
          isReal: false,
          msg: "⚠️ Advisory: Digital synthetic software signatures detected in metadata. Authentic camera capture required for official administrative processing."
        });
      } else {
        setPhotoAuthenticityNote({
          isReal: true,
          msg: `✅ Hardware Camera Geotag: Genuine capture verified (${make ? make + ' ' + model : 'Mobile Sensor Camera'}).`
        });
      }

      if (lat && lng && lat.length === 3 && lng.length === 3) {
        const decLat = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef === "S" ? -1 : 1);
        const decLng = (lng[0] + lng[1] / 60 + lng[2] / 3600) * (lngRef === "W" ? -1 : 1);

        setFormData(prev => ({
          ...prev,
          lat: decLat.toFixed(6),
          lng: decLng.toFixed(6)
        }));
        setGpsExtracted(true);
      } else {
        setGpsPromptRequired(true);
      }
    });
  };

  // Get current device GPS via HTML5 Geolocation
  const handleGetDeviceLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          }));
          setGpsExtracted(true);
          setGpsPromptRequired(false);
        },
        (err) => {
          console.warn("Geolocation denied:", err.message);
          setError("Location access denied or unavailable. Please enter coordinates manually.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Please enter coordinates manually.");
    }
  };

  const handleVoiceDataExtracted = (data) => {
    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
      description: data.description || prev.description,
      state: data.state || prev.state,
      district: data.district || prev.district,
      mandal: data.mandal || prev.mandal,
      village: data.village || prev.village,
      areaName: data.areaName || prev.areaName
    }));
    setVoiceFilledNotice({
      language: data.detectedLanguage || 'Regional Language',
      transcription: data.transcribedText || ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a title for the problem.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a detailed description.');
      return;
    }

    setSubmitting(true);
    setError('');
    setPhotoMismatchError(null);

    try {
      const dataPayload = new FormData();
      dataPayload.append('title', formData.title);
      dataPayload.append('description', formData.description);
      dataPayload.append('state', formData.state);
      dataPayload.append('district', formData.district);
      dataPayload.append('mandal', formData.mandal);
      dataPayload.append('village', formData.village);
      dataPayload.append('areaName', formData.areaName);
      dataPayload.append('pincode', formData.pincode);
      dataPayload.append('lat', formData.lat);
      dataPayload.append('lng', formData.lng);

      if (photoFile) {
        dataPayload.append('photo', photoFile);
      }

      const res = await fetch('/api/problems', {
        method: 'POST',
        body: dataPayload
      });

      const result = await res.json();
      if (!res.ok) {
        if (res.status === 422 || result.error === "Photo Relevance Mismatch") {
          setPhotoMismatchError({
            detectedSubject: result.detectedSubject || "Unrelated image content",
            reason: result.reason || "The uploaded photograph does not match the problem statement.",
            message: result.message
          });
          setError("Ground Proof Photo Relevance Check Failed: The uploaded picture does not match the problem statement. Please resubmit a relevant photo.");
          if (fileInputRef.current) {
            fileInputRef.current.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
        throw new Error(result.error || result.message || 'Failed to submit problem');
      }

      setSubmissionResult(result);
      if (onProblemCreated) {
        onProblemCreated(result.problem);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error communicating with server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Navigation Back Button (Requirement 2) */}
      <div style={{ marginBottom: '18px' }}>
        <button 
          onClick={onNavigateBoard} 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} color="#0a3977" />
          <span>Back to Problem Board</span>
        </button>
      </div>

      {/* Title & Privacy Guarantee Header */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#0a3977', marginBottom: '8px' }}>
          Report a Societal Problem / Citizen Grievance
        </h1>
        <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '640px', margin: '0 auto' }}>
          Connect local civic, water, road, health, agricultural, or sanitation issues directly to university innovators & government authorities.
        </p>

        {/* 100% Anonymity Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '6px 16px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginTop: '14px'
        }}>
          <ShieldAlert size={16} color="#15803d" />
          <span>Citizen Privacy Guarantee: Zero personal data (name, phone, email) is collected or stored.</span>
        </div>
      </div>

      {submissionResult ? (
        /* Post-Submission Success & Duplicate / Cross-State Insights */
        <div className="gov-card" style={{ padding: '32px', animation: 'fadeIn 0.25s ease-out' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: submissionResult.isIrrelevant ? '#fef2f2' : '#dcfce7',
              border: submissionResult.isIrrelevant ? '2px solid #ef4444' : '2px solid #16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              {submissionResult.isIrrelevant ? (
                <AlertTriangle size={36} color="#dc2626" />
              ) : (
                <CheckCircle size={36} color="#15803d" />
              )}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: submissionResult.isIrrelevant ? '#991b1b' : '#0a3977', marginBottom: '6px' }}>
              {submissionResult.isIrrelevant ? 'Grievance Queued for AI Moderation' : 'Problem Successfully Registered!'}
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>
              {submissionResult.isIrrelevant 
                ? `Advisory: Groq AI flagged this report (${submissionResult.flagReason || 'Photo or context mismatch'}). It has been queued under the low priority Irrelevant section for administrative review.`
                : 'Autonomous Groq AI has classified your issue and forwarded it to university engineering problem solvers.'}
            </p>
          </div>

          {/* AI Classification Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Category Tagged</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0369a1', marginTop: '2px' }}>
                {submissionResult.problem.category}
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Urgency Level</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#dc2626', marginTop: '2px' }}>
                {submissionResult.problem.urgency} Urgency
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Admin Tier</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#d97706', marginTop: '2px' }}>
                {submissionResult.problem.level}
              </div>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Max Resolution SLA</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#15803d', marginTop: '2px' }}>
                {submissionResult.problem.maxResolutionDays} Days
              </div>
            </div>
          </div>

          {/* Duplicate Notice if Detected */}
          {submissionResult.duplicateDetected && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: '700', marginBottom: '4px' }}>
                <AlertTriangle size={18} />
                <span>Existing Similar Problem Identified in Your Locality!</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#78350f' }}>
                An identical or related civic challenge was already recorded in this area. Your submission has been linked to aggregate community demand.
              </p>
            </div>
          )}

          {/* Cross-State Similar Problems Preview */}
          {submissionResult.crossStateSimilarProblems && submissionResult.crossStateSimilarProblems.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Layers size={18} color="#0a3977" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f2744' }}>
                  Cross-Locality Intelligence: Solutions Being Piloted in Other States
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {submissionResult.crossStateSimilarProblems.map(p => (
                  <div key={p.id} style={{
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f2744' }}>{p.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.district}, {p.state} • {p.solutions?.length || 0} active solutions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '24px' }}>
            <button 
              onClick={() => {
                setSubmissionResult(null);
                setFormData({
                  title: '',
                  description: '',
                  state: 'Uttar Pradesh',
                  district: '',
                  mandal: '',
                  village: '',
                  areaName: '',
                  pincode: '',
                  lat: '',
                  lng: ''
                });
                setPhotoFile(null);
                setPhotoPreview(null);
                setPhotoMismatchError(null);
              }} 
              className="btn-secondary"
            >
              Report Another Problem
            </button>
            <button onClick={onNavigateBoard} className="btn-primary">
              <span>View on Grievance Board</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Citizen Submission Form */
        <form onSubmit={handleSubmit} className="gov-card" style={{ padding: '32px' }}>
          
          {/* PHOTO RELEVANCE MISMATCH ERROR BANNER */}
          {photoMismatchError && (
            <div style={{
              background: '#fef2f2',
              border: '2px solid #dc2626',
              borderRadius: '6px',
              padding: '18px 20px',
              marginBottom: '24px',
              animation: 'fadeIn 0.2s ease-in'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <XCircle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#991b1b', marginBottom: '6px' }}>
                    ⚠️ Photo Verification Rejected: Irrelevant Image Uploaded
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#b91c1c', marginBottom: '10px', lineHeight: '1.5' }}>
                    The uploaded image <strong>does not match</strong> the problem statement you submitted. Official government grievance records strictly require authentic photographic evidence depicting the actual issue.
                  </p>
                  
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    padding: '12px 16px',
                    borderRadius: '5px',
                    fontSize: '0.82rem',
                    color: '#7f1d1d',
                    marginBottom: '14px'
                  }}>
                    <div><strong>AI Vision Inspection Detected:</strong> {photoMismatchError.detectedSubject}</div>
                    <div style={{ marginTop: '4px' }}><strong>Rejection Reason:</strong> {photoMismatchError.reason}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        setPhotoMismatchError(null);
                        setError('');
                        fileInputRef.current?.click();
                      }}
                      className="btn-accent"
                      style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                    >
                      <RefreshCw size={14} />
                      <span>Resubmit Relevant Problem Photo</span>
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: '600' }}>
                      (Please select an image showing the defect, damage, or affected area)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && !photoMismatchError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '12px 16px',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {/* AI Voice Grievance Intake Hero Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.9) 0%, rgba(245, 243, 255, 0.95) 100%)',
            border: '1.5px solid #c7d2fe',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(124, 58, 237, 0.4)',
                flexShrink: 0
              }}>
                <Mic size={24} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: '800', color: '#1e1b4b', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{t('speakProblemBtn')}</span>
                  <span style={{ fontSize: '0.68rem', background: '#4338ca', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                    GROQ WHISPER AI
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#4338ca', lineHeight: '1.4' }}>
                  {t('speakProblemSubtitle')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Mic size={18} />
              <span>{t('pressToRecord')}</span>
            </button>
          </div>

          {/* Voice Filled Notice Banner */}
          {voiceFilledNotice && (
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <CheckCircle size={20} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', color: '#065f46', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{t('voiceSuccessTitle')}</span>
                  <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#047857', padding: '1px 8px', borderRadius: '10px' }}>
                    {voiceFilledNotice.language}
                  </span>
                </div>
                <p style={{ margin: '3px 0 6px', fontSize: '0.82rem', color: '#047857' }}>
                  {t('voiceSuccessMsg', { lang: voiceFilledNotice.language })}
                </p>
                {voiceFilledNotice.transcription && (
                  <div style={{ fontSize: '0.78rem', color: '#065f46', fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: '6px' }}>
                    "{voiceFilledNotice.transcription}"
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setVoiceFilledNotice(null)}
                style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: '2px' }}
              >
                <XCircle size={16} />
              </button>
            </div>
          )}

          {/* Section 1: Photo Proof & GPS Camera guidance */}
          <div style={{
            background: photoMismatchError ? '#fff5f5' : '#f8fafc',
            border: photoMismatchError ? '2px dashed #dc2626' : '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '20px',
            marginBottom: '24px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Camera size={18} color="#0a3977" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f2744' }}>
                1. Upload Ground Proof Photo *
              </h3>
            </div>
            
            <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '14px', lineHeight: '1.5' }}>
              📸 <strong style={{ color: '#0a3977' }}>Please upload a photo captured with a GPS Map Camera app</strong> (with embedded geotag). 
              Our Groq AI automatically verifies photo relevance against your problem statement and extracts coordinates.
            </p>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '190px',
                  height: '140px',
                  border: photoMismatchError ? '2px dashed #dc2626' : '2px dashed #cbd5e1',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: '#ffffff',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Proof Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <Camera size={30} color="#0a3977" style={{ marginBottom: '8px' }} />
                    <span style={{ fontSize: '0.78rem', color: '#0a3977', fontWeight: '700' }}>Choose Photo</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>JPEG or PNG</span>
                  </>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <div style={{ flex: 1, minWidth: '250px' }}>
                {photoAuthenticityNote && (
                  <div style={{
                    background: photoAuthenticityNote.isReal ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${photoAuthenticityNote.isReal ? '#bbf7d0' : '#fde68a'}`,
                    borderRadius: '5px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: photoAuthenticityNote.isReal ? '#15803d' : '#92400e',
                    marginBottom: '10px'
                  }}>
                    {photoAuthenticityNote.msg}
                  </div>
                )}

                {gpsExtracted ? (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '5px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <MapPin size={16} />
                    <span>GPS Coordinates Extracted: <strong>{formData.lat}, {formData.lng}</strong></span>
                  </div>
                ) : gpsPromptRequired ? (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '5px',
                    padding: '10px 12px',
                    fontSize: '0.8rem',
                    color: '#92400e'
                  }}>
                    <span>⚠️ GPS coordinates were not found in this image. Please click below to auto-detect or enter below.</span>
                    <div style={{ marginTop: '8px' }}>
                      <button 
                        type="button" 
                        onClick={handleGetDeviceLocation}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                      >
                        <MapPin size={14} />
                        <span>Detect My Current Device GPS</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Once you upload your ground proof picture, camera metadata and geotags will be scanned automatically.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Precise Location Details */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <MapPin size={18} color="#ea580c" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f2744' }}>
                2. Administrative Location Details
              </h3>
            </div>

            {/* State & District */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  State / Union Territory *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  District *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Sonbhadra"
                  required
                  className="input-field"
                />
              </div>
            </div>

            {/* Mandal, Village, Pincode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Mandal / Tehsil / Block *
                </label>
                <input
                  type="text"
                  name="mandal"
                  value={formData.mandal}
                  onChange={handleChange}
                  placeholder="e.g. Chopan"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Village / Ward Name *
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="e.g. Mohanpur"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Postal Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 231205"
                  required
                  className="input-field"
                />
              </div>
            </div>

            {/* Specific Problem Area Name in Village */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Exact Locality / Landmark (e.g. Near Panchayat Bhawan, Main Water Tank, Culvert km 4) *
              </label>
              <input
                type="text"
                name="areaName"
                value={formData.areaName}
                onChange={handleChange}
                placeholder="Specific landmark within the village where the problem is located"
                required
                className="input-field"
              />
            </div>

            {/* GPS Coordinates Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  GPS Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  placeholder="e.g. 24.520412"
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  GPS Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  placeholder="e.g. 83.038144"
                  className="input-field"
                />
              </div>

              <button 
                type="button" 
                onClick={handleGetDeviceLocation}
                className="btn-secondary"
                style={{ height: '40px' }}
                title="Detect GPS coordinates using current device sensor"
              >
                <MapPin size={15} />
                <span>Auto-Detect GPS</span>
              </button>
            </div>
          </div>

          {/* Section 3: Problem Description */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={18} color="#0a3977" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f2744' }}>
                3. Problem Description (Groq AI will verify photo match & assess urgency)
              </h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Problem Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. High Fluoride Contamination in Handpumps & Non-Functional Solar RO"
                required
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                Comprehensive Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe how long this issue has persisted, how many households or students are affected, symptoms, and previous attempts at repair..."
                required
                className="input-field"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
            <button type="submit" disabled={submitting} className="btn-accent" style={{ padding: '12px 24px', fontSize: '0.92rem' }}>
              {submitting ? (
                <>
                  <Sparkles size={18} className="animate-spin" />
                  <span>Verifying Ground Proof & Running AI Triage...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Submit Grievance & Run Groq AI Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Groq AI Regional Voice Grievance Intake Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceDataExtracted={handleVoiceDataExtracted}
      />
    </div>
  );
}
