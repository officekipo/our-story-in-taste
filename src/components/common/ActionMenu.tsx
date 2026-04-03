// src/components/common/ActionMenu.tsx
// ⋮ 버튼 클릭 시 나타나는 수정/삭제 선택 팝업
import { Modal } from "./Modal";

interface ActionMenuProps {
  onEdit:   () => void;
  onDelete: () => void;
  onClose:  () => void;
}

const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

export function ActionMenu({ onEdit, onDelete, onClose }: ActionMenuProps) {
  return (
    <Modal onClose={onClose} maxWidth={320}>
      <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 14, textAlign: "center" }}>어떻게 할까요?</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => { onEdit(); onClose(); }}
          style={{ width: "100%", padding: "14px 16px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 14, color: "#1A1412", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12 }}
        >
          <span style={{ fontSize: 20 }}>✏️</span>수정하기
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          style={{ width: "100%", padding: "14px 16px", background: "#FFF5F5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, color: "#EF4444", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12 }}
        >
          <span style={{ fontSize: 20 }}>🗑️</span>삭제하기
        </button>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "#8A8078", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >취소</button>
      </div>
    </Modal>
  );
}
