// src/components/common/Modal.tsx

interface ModalProps {
  onClose:    () => void;
  children:   React.ReactNode;
  maxWidth?:  number;
  noPadding?: boolean;
}

export function Modal({ onClose, children, maxWidth = 400, noPadding = false }: ModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 750,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "calc(100dvh - 40px)",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          overflowY: "auto",
          overflowX: "hidden",
          animation: "scaleIn 0.18s ease both",
          padding: noPadding ? 0 : "24px 24px 28px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1412" }}>{title}</p>
      <button
        onClick={onClose}
        className="tap"
        style={{ width: 28, height: 28, borderRadius: "50%", background: "#F5F0EB", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#8A8078" }}
      >✕</button>
    </div>
  );
}
