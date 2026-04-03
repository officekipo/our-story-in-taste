// src/components/common/ConfirmDialog.tsx
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  message:   string;
  onConfirm: () => void;
  onCancel:  () => void;
}

const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel} maxWidth={300}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", marginBottom: 8 }}>정말 삭제할까요?</p>
        <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}  style={{ flex: 1, padding: 13, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: "#8A8078", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 13, background: "#EF4444", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
        </div>
      </div>
    </Modal>
  );
}
