"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type VerificationDocument = {
  studentName: string;
  organisationName: string;
  dateIssued: string;
  referenceNumber: string;
  status: string;
  studentId?: string;
  program?: string;
  department?: string;
};

export type VerificationResult = {
  valid: boolean;
  message?: string;
  documentType?: string;
  document?: VerificationDocument;
};

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  fontFamily: "var(--font-quicksand), sans-serif",
};

const cardStyle: React.CSSProperties = {
  maxWidth: "520px",
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px)",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "40px",
  boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
};

async function fetchVerification(code: string): Promise<VerificationResult> {
  const res = await fetch(`${API_BASE_URL}/verify/${encodeURIComponent(code.trim())}`);
  return res.json();
}

function ResultCard({ result }: { result: VerificationResult }) {
  return (
    <div
      style={{
        marginTop: "24px",
        padding: "20px",
        borderRadius: "12px",
        background: result.valid ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${result.valid ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {result.valid ? (
          <ShieldCheck className="h-6 w-6 text-green-500" />
        ) : (
          <ShieldX className="h-6 w-6 text-red-500" />
        )}
        <span
          style={{
            color: result.valid ? "#22c55e" : "#ef4444",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          {result.valid
            ? "Document verified"
            : result.document
              ? "Document not valid"
              : "Document not found"}
        </span>
      </div>

      {result.valid && result.document && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {result.documentType && (
            <Row label="Document type" value={result.documentType} />
          )}
          <Row label="Student name" value={result.document.studentName} />
          {result.document.studentId && (
            <Row label="Student ID" value={result.document.studentId} />
          )}
          {result.document.program && <Row label="Programme" value={result.document.program} />}
          {result.document.department && (
            <Row label="Department" value={result.document.department} />
          )}
          <Row label="Organisation" value={result.document.organisationName} />
          <Row label="Date issued" value={result.document.dateIssued} />
          <Row label="Reference" value={result.document.referenceNumber} />
          <Row
            label="Status"
            value={result.document.status}
            valueColor={result.document.status === "Valid" ? "#22c55e" : "#ef4444"}
          />
        </div>
      )}

      {!result.valid && (
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
          {result.message || "No document matches this verification code."}
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueColor = "white",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>{label}</span>
      <span
        style={{
          color: valueColor,
          fontSize: "13px",
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function DocumentVerificationView({
  initialCode = "",
  autoVerify = false,
}: {
  initialCode?: string;
  autoVerify?: boolean;
}) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(autoVerify && !!initialCode);
  const [result, setResult] = useState<VerificationResult | null>(null);

  React.useEffect(() => {
    if (!autoVerify || !initialCode.trim()) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchVerification(initialCode);
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) toast.error("Verification failed. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoVerify, initialCode]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a verification code");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await fetchVerification(code);
      setResult(data);
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: 700, margin: "0 0 8px" }}>
            Document verification
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>
            {autoVerify
              ? "Letter details from the Regional Maritime University internship portal"
              : "Enter the code from an approved internship or placement letter"}
          </p>
        </div>

        {!autoVerify && (
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Verification code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="6-digit or 7-character code"
                maxLength={12}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "3px",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: loading
                  ? "rgba(59,130,246,0.5)"
                  : "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verifying…" : "Verify document"}
            </button>
          </form>
        )}

        {loading && autoVerify && (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          </div>
        )}

        {result && !loading && <ResultCard result={result} />}

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: "12px",
            marginTop: "24px",
          }}
        >
          Regional Maritime University — Document authentication
        </p>
      </div>
    </div>
  );
}
