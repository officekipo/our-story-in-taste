// src/components/common/ActionMenu.tsx

interface ActionMenuProps {
  onEdit:   () => void;
  onDelete: () => void;
  onClose:  () => void;
}

export function ActionMenu({ onEdit, onDelete, onClose }: ActionMenuProps) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "16px 16px calc(32px + 64px)", animation: "slideUp 0.28s cubic-bezier(0.32,1,0.4,1) both" }}>
        <div style={{ width: 36, height: 4, background: "#E2DDD8", borderRadius: 2, margin: "0 auto 20px" }} />
        <button onClick={() => { onEdit(); onClose(); }} style={{ width: "100%", padding: 16, marginBottom: 10, background: "#FAF7F3", border: "1px solid #E2DDD8", borderRadius: 14, color: "#1A1412", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>✏️</span>수정하기
        </button>
        <button onClick={() => { onDelete(); onClose(); }} style={{ width: "100%", padding: 16, background: "#FFF0F0", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, color: "#EF4444", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🗑️</span>삭제하기
        </button>
      </div>
    </div>
  );
}
