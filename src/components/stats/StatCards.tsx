// src/components/stats/StatCards.tsx
//
//  Fix / Add:
//    ★ props: total → places(장소 수) + totalVisits(재방문 포함 총 방문 횟수)
//    ★ "총 방문" 카드: totalVisits 표시, 재방문 있으면 "(N곳)" 서브텍스트
interface StatCardsProps {
  places:      number;  // 맛집 레코드 수
  totalVisits: number;  // 재방문 포함 총 방문 횟수
  monthAvg:    string;
  revisitPct:  number;
}

export function StatCards({ places, totalVisits, monthAvg, revisitPct }: StatCardsProps) {
  const hasRevisit = totalVisits > places;

  const cards = [
    {
      icon:     "📍",
      value:    totalVisits,
      sub:      hasRevisit ? `${places}곳` : null,
      label:    "총 방문",
      color:    "#1A1412",
      delay:    0,
    },
    {
      icon:     "📅",
      value:    monthAvg,
      sub:      null,
      label:    "월평균 방문",
      color:    "#6B9E7E",
      delay:    0.05,
    },
    {
      icon:     "💗",
      value:    `${revisitPct}%`,
      sub:      null,
      label:    "재방문 의향",
      color:    "#C96B52",
      delay:    0.1,
    },
  ];

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      {cards.map(({ icon, value, sub, label, color, delay }) => (
        <div
          key={label}
          style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "16px 8px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", animationDelay: `${delay}s` }}
        >
          <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
          {/* ★ 재방문 있을 때 장소 수 서브텍스트 */}
          {sub && (
            <div style={{ fontSize: 9, color: "#C96B52", marginTop: 2, fontWeight: 700 }}>
              🔁 {sub}
            </div>
          )}
          <div style={{ fontSize: 10, color: "#8A8078", marginTop: sub ? 2 : 4, lineHeight: 1.3 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
