"use client";
interface ConfirmDialogProps {
  message: string; // 확인 메시지 (예: '"온지음 맞춤관" 기록을 삭제할까요?')
  onConfirm: () => void; // 삭제 버튼 클릭
  onCancel: () => void; // 취소 버튼 or 배경 클릭
}
export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    /* dim 레이어: viewport 전체를 덮어 헤더·바텀탭도 dim 처리 */
    <div
      onClick={onCancel}
      className="fixed inset-0 bg-black/55 z-[800] flex items-center justifycenter p-5"
    >
      {/* 카드: 클릭 이벤트가 배경으로 전파되지 않도록 stopPropagation */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-7 max-w-xs w-full text-center animate-scale-in"
      >
        <div className="text-4xl mb-3"> </div>
        <h3 className="text-base font-bold text-ink mb-2">정말 삭제할까요?</h3>
        <p className="text-sm text-muted mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-warm border border-muted-light text-muted text-sm cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold cursor-pointer"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
