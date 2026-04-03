// src/components/common/Modal.tsx
// 앱 전체 공통 팝업 래퍼
// 화면 중앙 카드, 내용 많으면 스크롤, 디바이스 높이 초과 안 함

interface ModalProps {
  onClose:    () => void;
  children:   React.ReactNode;
  maxWidth?:  number;   // 기본 400
  noPadding?: boolean;  // 내부 패딩 제거 (슬라이더 등 가득 채울 때)
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
          /* 최대 높이: 뷰포트 - 위아래 여백 40px */
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

/* 모달 내부에서 자주 쓰는 헤더 */
export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1412" }}>{title}</p>
      <button
        onClick={onClose}
        style={{ width: 28, height: 28, borderRadius: "50%", background: "#F5F0EB", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#8A8078" }}
      >✕</button>
    </div>
  );
}
