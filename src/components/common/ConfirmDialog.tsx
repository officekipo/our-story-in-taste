// src/components/common/ConfirmDialog.tsx

interface ConfirmDialogProps {
  message:   string;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 300, width: "100%", textAlign: "center", animation: "scaleIn 0.18s ease both" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#1A1412", marginBottom: 8 }}>정말 삭제할까요?</p>
        <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, background: "#FAF7F3", border: "1px solid #E2DDD8", borderRadius: 12, color: "#8A8078", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 12, background: "#EF4444", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
        </div>
      </div>
    </div>
  );
}
