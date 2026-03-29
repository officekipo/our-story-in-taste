interface StatCardsProps {
  total: number; // 총 방문
  monthAvg: string; // 월평균 방문
  revisitPct: number; // 재방문 의향 %
}
export function StatCards({ total, monthAvg, revisitPct }: StatCardsProps) {
  const cards = [
    { icon: " ", value: total, label: "총 방문", color: "#1A1412" },
    { icon: " ", value: monthAvg, label: "월평균 방문", color: "#6B9E7E" },
    {
      icon: " ",
      value: `${revisitPct}%`,
      label: "재방문 의향",
      color: "#C96B52",
    },
  ];
  return (
    <div className="flex gap-2.5 mb-3.5">
      {cards.map(({ icon, value, label, color }, i) => (
        <div
          key={label}
          className="flex-1 bg-white rounded-2xl p-4 text-center shadow-sm animate-fade-up"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="text-2xl mb-1.5">{icon}</div>
          <div
            className="text-[22px] font-extrabold"
            style={{
              color,
            }}
          >
            {value}
          </div>
          <div className="text-[10px] text-muted mt-0.5 leadingtight">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
