'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/verify/${code.trim()}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'var(--font-quicksand), sans-serif',
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '40px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px',
          }}>🔍</div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>
            Document Verification
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
            Verify the authenticity of an official internship letter
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7K92HJS"
              maxLength={10}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '3px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Document'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div style={{
            marginTop: '24px',
            padding: '20px',
            borderRadius: '12px',
            background: result.valid
              ? 'rgba(34,197,94,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.valid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>{result.valid ? '✅' : '❌'}</span>
              <span style={{
                color: result.valid ? '#22c55e' : '#ef4444',
                fontSize: '16px', fontWeight: '700',
              }}>
                {result.valid ? 'Document Verified' : 'Document Not Found'}
              </span>
            </div>

            {result.valid && result.document && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ['Student Name', result.document.studentName],
                  ['Organisation', result.document.organisationName],
                  ['Date Issued', result.document.dateIssued],
                  ['Reference', result.document.referenceNumber],
                  ['Status', result.document.status],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{label}</span>
                    <span style={{
                      color: label === 'Status'
                        ? (value === 'Valid' ? '#22c55e' : '#ef4444')
                        : 'white',
                      fontSize: '13px', fontWeight: '600',
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {!result.valid && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
                {result.message || 'No document matches this verification code.'}
              </p>
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '24px' }}>
          Regional Maritime University — Document Authentication System
        </p>
      </div>
    </div>
  );
}
