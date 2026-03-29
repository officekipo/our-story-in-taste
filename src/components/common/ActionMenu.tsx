"use client";
interface ActionMenuProps {
  onEdit: () => void; // 수정하기 클릭
  onDelete: () => void; // 삭제하기 클릭
  onClose: () => void; // 배경 클릭 or 닫기
}
export function ActionMenu({ onEdit, onDelete, onClose }: ActionMenuProps) {
  return (
    /* dim 레이어 — 클릭 시 메뉴 닫힘 */
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-[700] flex items-end justifycenter"
    >
      {/* 바텀 시트 — 클릭 이벤트 전파 차단 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-app bg-white rounded-t-2xl px-4 pt-4 pb-[calc(32px+64px)] /* 64px = 바텀탭 높이 */ animate-slide-up"
      >
        {/* 드래그 핸들 */}
        <div className="w-9 h-1 bg-muted-light rounded-full mx-auto mb-5" />
        {/* 수정하기 */}
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-4 mb-2.5 bg-warm border border-muted-light rounded-[14px] text-ink text-[15px] font-semibold cursor-pointer"
        >
          <span className="text-xl">✏</span> 수정하기
        </button>
        {/* 삭제하기 */}
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-4 bg-[#FFF0F0] border border-red-200 rounded-[14px] text-red-500 text-[15px] font-semibold cursor-pointer"
        >
          <span className="text-xl"> </span> 삭제하기
        </button>
      </div>
    </div>
  );
}
