'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const RATING_CATEGORIES = [
  { key: 'workEthicRating', label: 'Work Ethic', description: 'Dedication, initiative, and consistency' },
  { key: 'communicationRating', label: 'Communication', description: 'Written and verbal skills' },
  { key: 'technicalSkillsRating', label: 'Technical Skills', description: 'Job-specific knowledge and abilities' },
  { key: 'teamworkRating', label: 'Teamwork', description: 'Collaboration and interpersonal skills' },
  { key: 'punctualityRating', label: 'Punctuality', description: 'Timeliness and attendance' },
  { key: 'problemSolvingRating', label: 'Problem Solving', description: 'Critical thinking and resourcefulness' },
];

const RECOMMENDATIONS = ['Excellent', 'Good', 'Average', 'Needs Improvement'];

export default function EvaluatePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const [form, setForm] = useState({
    supervisorName: '',
    supervisorPosition: '',
    supervisorDepartment: '',
    workEthicRating: 0,
    communicationRating: 0,
    technicalSkillsRating: 0,
    teamworkRating: 0,
    punctualityRating: 0,
    problemSolvingRating: 0,
    supervisorComments: '',
    finalRecommendation: '',
  });

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`${API_BASE_URL}/evaluate/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Invalid evaluation link');
        } else {
          setFormData(data);
        }
      } catch {
        setError('Failed to load evaluation form. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadForm();
  }, [token]);

  function setRating(key: string, value: number) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    const allRated = RATING_CATEGORIES.every(c => form[c.key as keyof typeof form] > 0);
    if (!form.supervisorName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!allRated) {
      toast.error('Please rate all categories');
      return;
    }
    if (!form.finalRecommendation) {
      toast.error('Please select a final recommendation');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/evaluate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Submission failed');
      } else {
        setSuccess(true);
        toast.success('Evaluation submitted successfully!');
      }
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Star rating component
  function StarRating({ category }: { category: string }) {
    const currentRating = form[category as keyof typeof form] as number;
    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(category, n)}
            style={{
              width: '40px', height: '40px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', fontSize: '18px',
              background: n <= currentRating
                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                : 'rgba(255,255,255,0.08)',
              color: n <= currentRating ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.2s',
              fontWeight: '700',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
    padding: '40px 20px',
    fontFamily: 'var(--font-quicksand), sans-serif',
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '700px', width: '100%', margin: '0 auto',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '40px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={cardStyle}>
          <p style={{ color: 'white', textAlign: 'center' }}>Loading evaluation form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '48px' }}>⚠️</span>
            <h2 style={{ color: 'white', marginTop: '16px' }}>{error}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              If you believe this is an error, please contact the university for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '48px' }}>🎉</span>
            <h2 style={{ color: '#22c55e', marginTop: '16px' }}>Evaluation Submitted Successfully!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
              Thank you for taking the time to evaluate the student&apos;s performance.
              Your feedback is invaluable to their academic development.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '20px' }}>
              You may close this page now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600',
    display: 'block', marginBottom: '6px',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px',
          }}>📋</div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
            Internship Evaluation Form
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
            Regional Maritime University — Supervisor Assessment
          </p>
        </div>

        {/* Student info banner */}
        {formData?.student && (
          <div style={{
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '12px', padding: '16px', marginBottom: '24px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Evaluating Student
            </p>
            <p style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
              {formData.student.firstName} {formData.student.lastName}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0' }}>
              {formData.student.program} — {formData.placement?.organizationName}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Supervisor Info */}
          <div style={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '24px', marginBottom: '24px',
          }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>
              Supervisor Information
            </h3>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Your Name *</label>
                <input
                  type="text" value={form.supervisorName}
                  onChange={e => setForm(p => ({ ...p, supervisorName: e.target.value }))}
                  style={inputStyle} placeholder="e.g. John Mensah" required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Position</label>
                  <input
                    type="text" value={form.supervisorPosition}
                    onChange={e => setForm(p => ({ ...p, supervisorPosition: e.target.value }))}
                    style={inputStyle} placeholder="e.g. Senior Engineer"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input
                    type="text" value={form.supervisorDepartment}
                    onChange={e => setForm(p => ({ ...p, supervisorDepartment: e.target.value }))}
                    style={inputStyle} placeholder="e.g. Engineering"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ratings */}
          <div style={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '24px', marginBottom: '24px',
          }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>
              Performance Ratings
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 16px' }}>
              Rate each category from 1 (Poor) to 5 (Excellent)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {RATING_CATEGORIES.map(cat => (
                <div key={cat.key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <div>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>
                      {cat.label}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                      {cat.description}
                    </p>
                  </div>
                  <StarRating category={cat.key} />
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Comments</label>
            <textarea
              value={form.supervisorComments}
              onChange={e => setForm(p => ({ ...p, supervisorComments: e.target.value }))}
              placeholder="Please share additional observations about the student's performance..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>

          {/* Final Recommendation */}
          <div style={{ marginBottom: '30px' }}>
            <label style={labelStyle}>Final Recommendation *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {RECOMMENDATIONS.map(rec => (
                <button
                  key={rec} type="button"
                  onClick={() => setForm(p => ({ ...p, finalRecommendation: rec }))}
                  style={{
                    padding: '12px', borderRadius: '10px', cursor: 'pointer',
                    border: form.finalRecommendation === rec
                      ? '2px solid #3b82f6'
                      : '1px solid rgba(255,255,255,0.15)',
                    background: form.finalRecommendation === rec
                      ? 'rgba(59,130,246,0.15)'
                      : 'rgba(255,255,255,0.05)',
                    color: form.finalRecommendation === rec ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                    fontSize: '13px', fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={submitting}
            style={{
              width: '100%', padding: '16px',
              background: submitting ? 'rgba(34,197,94,0.5)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '20px' }}>
          This is a secure evaluation form. Your response will be recorded and shared with the university.
        </p>
      </div>
    </div>
  );
}
