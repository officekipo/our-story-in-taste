// src/components/community/ReportModal.tsx
"use client";

import { useState }          from "react";
import { REPORT_REASONS }    from "@/types";
import { Modal, ModalHeader } from "@/components/common/Modal";

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
    <Modal onClose={onClose} maxWidth={400}>
      {done ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>신고가 접수됐어요</p>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>검토 후 조치 예정입니다.</p>
          <button onClick={onClose} style={{ padding: "12px 36px", background: ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>확인</button>
        </div>
      ) : (
        <>
          <ModalHeader title="신고 사유 선택" onClose={onClose} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {REPORT_REASONS.map((r) => (
              <div
                key={r}
                onClick={() => setReason(r)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: reason === r ? "#F2D5CC" : WARM, border: `1px solid ${reason === r ? ROSE : BORDER}`, borderRadius: 12, cursor: "pointer" }}
              >
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${reason === r ? ROSE : "#C0B8B0"}`, background: reason === r ? ROSE : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {reason === r && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <span style={{ fontSize: 13, color: INK }}>{r}</span>
              </div>
            ))}
          </div>
          <textarea
            value={detail} onChange={(e) => setDetail(e.target.value)}
            placeholder="추가 설명 (선택)" rows={2}
            style={{ width: "100%", padding: "11px 13px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 10, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
            <button
              onClick={() => { if (!reason) return; onReport(); setDone(true); }}
              disabled={!reason}
              style={{ flex: 2, padding: 13, background: reason ? "#EF4444" : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: reason ? "pointer" : "default", fontFamily: "inherit" }}
            >신고 제출</button>
          </div>
        </>
      )}
    </Modal>
  );
}
