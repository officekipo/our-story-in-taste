"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SIDO, CUISINES, TAGS } from "@/types";
import type { VisitedRecord } from "@/types";
import { useUIStore } from "@/store/uiStore";
import { CalendarPicker } from "./CalendarPicker";
import { StarRating } from "@/components/common/StarRating";
import { cn } from "@/lib/utils/cn";
import { todayStr } from "@/lib/utils/date";
/* ── zod 스키마: 필수 필드 검사 ── */
const schema = z.object({
  name: z.string().min(1, "식당 이름을 입력해주세요"),
  sido: z.string(),
  district: z.string(),
  cuisine: z.string().min(1, "음식 종류를 선택해주세요"),
  rating: z.number().min(1).max(5),
  date: z.string().min(1, "날짜를 선택해주세요"),
  memo: z.string(),
  tags: z.array(z.string()),
  revisit: z.boolean().nullable(),
  shareToComm: z.boolean(),
});
type FormValues = z.infer<typeof schema>;
interface AddEditModalProps {
  /* Step 07 Firebase 연동 후 onSave에 실제 저장 로직 연결 */
  onSave?: (values: FormValues, imgUrls: string[]) => void;
}
export function AddEditModal({ onSave }: AddEditModalProps) {
  const { addModalOpen, editTarget, closeModal } = useUIStore();
  const [showCal, setShowCal] = useState(false);
  const [imgUrls, setImgUrls] = useState<string[]>(editTarget?.imgUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editTarget?.name ?? "",
      sido: editTarget?.sido ?? "서울",
      district: editTarget?.district ?? "",
      cuisine: editTarget?.cuisine ?? "",
      rating: editTarget?.rating ?? 5,
      date: editTarget?.date ?? todayStr(),
      memo: editTarget?.memo ?? "",
      tags: editTarget?.tags ?? [],
      revisit: editTarget?.revisit ?? null,
      shareToComm: editTarget?.shareToComm ?? false,
    },
  });
  const rating = watch("rating");
  const tags = watch("tags");
  const revisit = watch("revisit");
  const shareToComm = watch("shareToComm");
  const date = watch("date");
  if (!addModalOpen) return null;
  /* 파일 선택 → 로컬 미리보기 (Step 08에서 Storage 업로드로 교체) */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imgUrls.length);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImgUrls((prev) =>
          [...prev, ev.target!.result as string].slice(0, 5),
        );
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };
  /* 태그 토글 */
  const toggleTag = (t: string) => {
    const current = tags ?? [];
    setValue(
      "tags",
      current.includes(t) ? current.filter((x) => x !== t) : [...current, t],
    );
  };
  const onSubmit = (data: FormValues) => {
    onSave?.(data, imgUrls);
    closeModal();
  };
  /* 공통 인풋 스타일 */
  const inp =
    "w-full px-4 py-3 bg-warm border border-muted-light rounded-xl text-sm text-ink";
  const errMsg = (msg?: string) =>
    msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;
  return (
    /* dim 레이어 */
    <div
      onClick={() => {
        setShowCal(false);
        closeModal();
      }}
      className="fixed inset-0 bg-black/55 z-[750] flex items-center justifycenter p-4"
    >
      {/* 팝업 카드 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
            w-full max-w-[440px] bg-white rounded-2xl
            max-h-[92vh] overflow-y-auto
            shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-scale-in
        "
      >
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <h2 className="text-[17px] font-bold text-ink">
            {editTarget ? "맛집 기록 수정" : "새로운 맛집 기록하기"}
          </h2>
          <button
            onClick={closeModal}
            className="text-muted text-2xl leading-none p-1"
          >
            ×
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-5 pb-6 pt-4 space-y-4"
        >
          {/* ── 1. 사진 ── */}
          <div>
            <label className="text-xs font-semibold text-muted mb-2 flex itemscenter gap-1.5">
              <span> </span> 음식 사진 (최대 5장)
            </label>
            <div className="flex gap-2 flex-wrap">
              {imgUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img
                    src={url}
                    className="w-20 h-20 object-cover rounded-xl"
                    alt=""
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImgUrls((p) => p.filter((_, j) => j !== i))
                    }
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imgUrls.length === 0 && (
                <label
                  className="w-[120px] h-[120px] border-2 border-dashed
                    border-muted-mid rounded-xl flex flex-col items-center justify-center gap-1.5
                    cursor-pointer bg-warm"
                >
                  <span className="text-3xl text-muted-mid">+</span>
                  <span className="text-xs text-muted">사진 추가</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFile}
                  />
                </label>
              )}
              {imgUrls.length > 0 && imgUrls.length < 5 && (
                <label
                  className="w-20 h-20 border-2 border-dashed border-muted-mid rounded-xl flex items-center justify-center cursor-pointer bg-warm"
                >
                  <span className="text-2xl text-muted-mid">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFile}
                  />
                </label>
              )}
            </div>
          </div>
          {/* ── 2. 식당 이름 ── */}
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">
              식당 이름 *
            </label>
            <input
              {...register("name")}
              placeholder="예: 을지로 이자카야"
              className={inp}
            />
            {errMsg(errors.name?.message)}
          </div>
          {/* ── 3. 위치 ── */}
          <div>
            <label
              className="text-xs font-semibold text-muted mb-1.5 flex items-center gap-1"
            >
              <span> </span> 위치
            </label>
            <div className="flex gap-2">
              {/* 시/도 셀렉트 */}
              <div className="relative shrink-0">
                <select
                  {...register("sido")}
                  className={cn(inp, "pr-7 w-auto cursor-pointer")}
                >
                  {SIDO.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                  ▾
                </span>
              </div>
              {/* 상세 지역 */}
              <input
                {...register("district")}
                placeholder="상세 지역 (예:종로구)"
                className={cn(inp, "flex-1")}
              />
            </div>
          </div>
          {/* ── 4. 음식 종류 ── */}
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 flex items-center gap-1">
              <span> </span> 음식 종류 *
            </label>
            <div className="relative">
              <select
                {...register("cuisine")}
                className={cn(inp, "pr-7 cursorpointer")}
              >
                <option value="">선택하세요</option>
                {CUISINES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
                ▾
              </span>
            </div>
            {errMsg(errors.cuisine?.message)}
          </div>
          {/* ── 5. 날짜 ── */}
          <div className="relative">
            <label className="text-xs font-semibold text-muted mb-1.5 flex items-center gap-1">
              <span> </span> 방문 날짜 *
            </label>
            <div
              onClick={() => setShowCal(!showCal)}
              className={cn(
                inp,
                "cursor-pointer",
                date ? "text-ink" : "textmuted",
              )}
            >
              {date || "날짜를 선택하세요"}
            </div>
            {showCal && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-[900]">
                <CalendarPicker
                  value={date}
                  onChange={(v) => {
                    setValue("date", v);
                    setShowCal(false);
                  }}
                  onClose={() => setShowCal(false)}
                />
              </div>
            )}
            {errMsg(errors.date?.message)}
          </div>
          {/* ── 6. 별점 ── */}
          <div>
            <label className="text-xs font-semibold text-muted mb-2 flex itemscenter gap-1">
              <span>☆</span> 평점
            </label>
            <StarRating
              value={rating}
              onChange={(v) => setValue("rating", v)}
              size={32}
            />
          </div>
          {/* ── 7. 메모 ── */}
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">
              이 순간 기록하기
            </label>
            <textarea
              {...register("memo")}
              placeholder="이 순간을 기억하고 싶어요..."
              rows={4}
              className={cn(inp, "resize-none leading-relaxed")}
            />
          </div>
          {/* ── 8. 태그 ── */}
          <div>
            <label
              className="text-xs font-semibold text-muted mb-2 block"
            >
              태그
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => {
                const on = (tags ?? []).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs border-[1.5px] transition-all",
                      on
                        ? "bg-rose-light text-rose border-rose font-semibold"
                        : "bg-warm text-muted border-muted-light",
                    )}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>
          {/* ── 9. 재방문 의향 ── */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted block">
              재방문 의향
            </label>
            <button
              type="button"
              onClick={() => setValue("revisit", true)}
              className={cn(
                "w-full py-3 rounded-xl border-[1.5px] text-sm transition-all",
                revisit === true
                  ? "bg-[#FDE8E5] border-rose text-rose font-bold"
                  : "bg-warm border-muted-light text-muted",
              )}
            >
              또 가고 싶어요!
            </button>
            <button
              type="button"
              onClick={() => setValue("revisit", false)}
              className={cn(
                "w-full py-3 rounded-xl border-[1.5px] text-sm transition-all",
                revisit === false
                  ? "bg-cream border-muted-mid text-muted"
                  : "bg-warm border-muted-light text-muted-mid",
              )}
            >
              한 번이면 충분해요
            </button>
          </div>
          {/* ── 10. 커뮤니티 공유 ── */}
          <div className="bg-warm border border-muted-light rounded-xl p-3.5">
            <div
              onClick={() => setValue("shareToComm", !shareToComm)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0",
                  shareToComm
                    ? "bg-rose border-rose"
                    : "bg-white border-mutedmid",
                )}
              >
                {shareToComm && (
                  <span className="text-white text-xs fontbold">✓</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">
                  커플들에게 추천하기
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  추천 탭에 공유됩니다
                </p>
                우리의 맛지도 개발 가이드 | Step 04. 다녀온 곳 탭 전체 구현 - 19
                -
              </div>
            </div>
          </div>
          {/* ── 11. 저장 버튼 ── */}
          <button
            type="submit"
            className="
                w-full py-4 rounded-xl
                bg-rose text-white text-[15px] font-bold
                disabled:bg-muted-light disabled:cursor-not-allowed
                transition-colors
            "
          >
            {editTarget ? "수정 완료" : "기록 저장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
