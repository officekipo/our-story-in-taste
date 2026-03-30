// src/components/common/StarRating.tsx

interface StarRatingProps {
  value:     number;
  onChange?: (v: number) => void;
  size?:     number;
}

export function StarRating({ value, onChange, size = 16 }: StarRatingProps) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange?.(star)}
          style={{ fontSize: size, color: star <= value ? "#E8A020" : "#E2DDD8", cursor: onChange ? "pointer" : "default", lineHeight: 1 }}
        >★</span>
      ))}
    </span>
  );
}
