// src/components/stats/StatCards.tsx
interface StatCardsProps {
  total:       number;
  monthAvg:    string;
  revisitPct:  number;
}
export function StatCards({ total, monthAvg, revisitPct }: StatCardsProps) {
  const cards = [
    { icon: "📍", value: total,          label: "총 방문",    color: "#1A1412", delay: 0    },
    { icon: "📅", value: monthAvg,       label: "월평균 방문", color: "#6B9E7E", delay: 0.05 },
    { icon: "💗", value: `${revisitPct}%`, label: "재방문 의향", color: "#C96B52", delay: 0.1  },
  ];
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      {cards.map(({ icon, value, label, color, delay }) => (
        <div key={label} style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "18px 10px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", animationDelay: `${delay}s` }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          <div style={{ fontSize: 10, color: "#8A8078", marginTop: 3, lineHeight: 1.3 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
