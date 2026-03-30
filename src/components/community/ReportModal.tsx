// src/components/community/ReportModal.tsx
"use client";

import { useState }      from "react";
import { REPORT_REASONS } from "@/types";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

interface ReportModalProps {
  onClose:  () => void;
  onReport: () => void;
}

export function ReportModal({ onClose, onReport }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [done,   setDone]   = useState(false);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 24px calc(24px + 64px)", maxHeight: "80vh", overflowY: "auto", animation: "slideUp 0.28s cubic-bezier(0.32,1,0.4,1) both" }}>
        <div style={{ width: 36, height: 4, background: BORDER, borderRadius: 2, margin: "0 auto 16px" }} />

        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>신고가 접수됐어요</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>검토 후 조치 예정입니다.</p>
            <button onClick={onClose} style={{ padding: "12px 36px", background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>확인</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 16 }}>신고 사유를 선택해주세요</p>
            {REPORT_REASONS.map(r => (
              <div key={r} onClick={() => setReason(r)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", marginBottom: 6, background: reason === r ? "#F2D5CC" : WARM, border: `1px solid ${reason === r ? ROSE : BORDER}`, borderRadius: 12, cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${reason === r ? ROSE : "#C0B8B0"}`, background: reason === r ? ROSE : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {reason === r && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <span style={{ fontSize: 13, color: INK }}>{r}</span>
              </div>
            ))}
            <textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="추가 설명 (선택)" rows={3} style={{ width: "100%", marginTop: 12, padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
              <button onClick={() => { if (!reason) return; onReport(); setDone(true); }} disabled={!reason} style={{ flex: 2, padding: 13, background: reason ? "#EF4444" : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: reason ? "pointer" : "default", fontFamily: "inherit" }}>신고 제출</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
