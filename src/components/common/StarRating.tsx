interface StarRatingProps {
  value: number; // 현재 별점 (1~5)
  onChange?: (v: number) => void; // 없으면 읽기 전용
  size?: number; // 폰트 사이즈(px), 기본 16
}
export function StarRating({ value, onChange, size = 16 }: StarRatingProps) {
  const interactive = !!onChange;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => interactive && onChange!(star)}
          style={{
            fontSize: size,
            color: star <= value ? "#E8A020" : "#E2DDD8",
            cursor: interactive ? "pointer" : "default",
            letterSpacing: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
/* ── 사용 예시 ── */
// 읽기 전용 (카드에서 별점 표시)
// <StarRating value={record.rating} size={16} />
// 입력 모드 (글쓰기 모달에서 별점 선택)
// <StarRating value={rating} onChange={setRating} size={32} />
