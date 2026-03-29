"use client";
import { useState } from "react";
import { REPORT_R } from "@/types";
import { cn } from "@/lib/utils/cn";
interface ReportModalProps {
  onClose: () => void;
  onReport: () => void;
}
export function ReportModal({ onClose, onReport }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 z-[700] flex items-end justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-app bg-white rounded-t-2xl px-6 pt-6 pb-[calc(24px+64px)] max-h-[80vh] overflow-y-auto animate-slide-up"
      >
        <div className="w-9 h-1 bg-muted-light rounded-full mx-auto mb-4" />
        {done ? (
          <div className="text-center py-5">
            <div className="text-5xl mb-3"></div>
            <h3 className="text-base font-bold text-ink mb-2">
              신고가 접수됐어요
            </h3>
            <p className="text-sm text-muted mb-5">검토 후 조치 예정입니다.</p>
            <button
              onClick={onClose}
              className="px-9 py-3 bg-rose text-white rounded-xl text-sm font-bold"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-[15px] font-bold text-ink mb-4">
              신고 사유를 선택해주세요
            </h2>
            {REPORT_R.map((r) => (
              <div
                key={r}
                onClick={() => setReason(r)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 mb-1.5 rounded-xl cursor-pointer border",
                  reason === r
                    ? "bg-rose-light border-rose"
                    : "bg-warm bordermuted-light",
                )}
              >
                <div
                  className={cn(
                    "w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0",
                    reason === r ? "border-rose bg-rose" : "border-muted-mid",
                  )}
                >
                  {reason === r && (
                    <div className="w-1.5 h-1.5 rounded-full bgwhite" />
                  )}
                </div>
                <span className="text-sm text-ink">{r}</span>
              </div>
            ))}
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="추가 설명 (선택)"
              rows={3}
              className="w-full mt-3 px-3.5 py-3 bg-warm border border-mutedlight rounded-xl text-sm resize-none"
            />
            <div className="flex gap-2.5 mt-3.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-warm border border-muted-light rounded-xl text-muted text-sm"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!reason) return;
                  onReport();
                  setDone(true);
                }}
                disabled={!reason}
                className={cn(
                  "flex-[2] py-3 rounded-xl text-white text-sm font-bold",
                  reason ? "bg-red-500" : "bg-muted-light cursor-not-allowed",
                )}
              >
                신고 제출
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
