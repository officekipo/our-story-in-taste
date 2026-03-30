// src/components/stats/RevisitBar.tsx
"use client";
import { useState, useEffect } from "react";
import type { VisitedRecord }  from "@/types";

export function RevisitBar({ visited }: { visited: VisitedRecord[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, []);

  const total = visited.length;
  const rv    = visited.filter(r => r.revisit === true).length;
  const pct   = total > 0 ? Math.round((rv / total) * 100) : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>💝</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1412" }}>재방문 의향</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "#8A8078" }}>또 가고 싶은 곳</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#C96B52" }}>{rv}곳</span>
      </div>
      <div style={{ height: 16, background: "#F0EBE3", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", width: ready ? `${pct}%` : "0%", background: "linear-gradient(90deg,#C96B52,#E8897A)", borderRadius: 8, transition: "width 1.1s cubic-bezier(.34,1,.64,1)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
          {pct >= 20 && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{pct}%</span>}
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#8A8078", textAlign: "center" }}>
        방문한 곳 중 <span style={{ fontWeight: 700, color: "#C96B52" }}>{pct}%</span>가 또 가고 싶은 맛집!
      </p>
    </div>
  );
}
