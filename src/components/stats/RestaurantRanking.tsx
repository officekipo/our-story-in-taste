import type { VisitedRecord } from "@/types";
const RANK_EMOJI = [" ", " ", " ", "4위", "5위"];
const RANK_BG = ["#FDE8E5", "#FBF0E8", "#F5F0EB", "#F5F0EB", "#F5F0EB"];
const RANK_COLOR = ["#C96B52", "#D4956A", "#8A8078", "#8A8078", "#8A8078"];
export function RestaurantRanking({ visited }: { visited: VisitedRecord[] }) {
  const counts = visited.reduce(
    (acc, r) => {
      acc[r.name] = (acc[r.name] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  return (
    <div
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm animate-fade-up"
      style={{ animationDelay: "0.3s" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg"> </span>
        <span className="text-[15px] font-bold text-ink">자주 간 식당</span>
      </div>
      {top.length > 0 ? (
        top.map(([name, cnt], i) => (
          <div
            key={name}
            className="flex items-center gap-3 py-2.5"
            style={{
              borderBottom: i < top.length - 1 ? "1px solid #E2DDD8" : "none",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[13px] font-extrabold"
              style={{ background: RANK_BG[i], color: RANK_COLOR[i] }}
            >
              {RANK_EMOJI[i]}
            </div>
            <span
              className="flex-1 text-sm text-ink"
              style={{ fontWeight: i < 2 ? 600 : 400 }}
            >
              {name}
            </span>
            <span className="text-sm font-semibold text-muted">{cnt}회</span>
          </div>
        ))
      ) : (
        <div className="text-center py-7 text-muted-mid text-sm">
          기록을 추가해보세요
        </div>
      )}
    </div>
  );
}
