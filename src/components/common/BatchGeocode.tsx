// ============================================================
//  BatchGeocode.tsx
//  적용 경로: src/app/admin/page.tsx 또는 settings/page.tsx 에 임시 추가
//
//  기존 visited/wishlist 데이터에 lat/lng 일괄 주입 도구
//  카카오 REST API 로 식당 이름 검색 → Firestore 업데이트
// ============================================================
"use client";

import { useState }          from "react";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db }                from "@/lib/firebase/config";
import { useAuthStore }      from "@/store/authStore";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_KEY ?? "";
const ROSE  = "#C96B52";
const MUTED = "#8A8078";
const WARM  = "#FAF7F3";
const BORDER= "#E2DDD8";

async function kakaoGeo(name: string, sido: string) {
  try {
    const q   = encodeURIComponent(`${sido} ${name}`);
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${q}&size=1`,
      { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
    );
    const data = await res.json();
    const d    = data.documents?.[0];
    if (!d) return null;
    return { lat: parseFloat(d.y), lng: parseFloat(d.x) };
  } catch { return null; }
}

export function BatchGeocode() {
  const { coupleId } = useAuthStore();
  const [running, setRunning] = useState(false);
  const [logs,    setLogs]    = useState<string[]>([]);
  const [done,    setDone]    = useState(false);

  const log = (msg: string) => setLogs(p => [...p, msg]);

  const run = async () => {
    if (!coupleId) { alert("커플 연동 필요"); return; }
    setRunning(true);
    setLogs([]);
    setDone(false);

    for (const col of ["visited", "wishlist"] as const) {
      const q    = query(collection(db, col), where("coupleId", "==", coupleId));
      const snap = await getDocs(q);
      const noPins = snap.docs.filter(d => d.data().lat == null);
      log(`[${col}] 전체 ${snap.size}개, 위치 없는 것 ${noPins.length}개`);

      for (const d of noPins) {
        const { name, sido } = d.data();
        const geo = await kakaoGeo(name, sido ?? "");
        if (geo) {
          await updateDoc(doc(db, col, d.id), geo);
          log(`  ✅ ${name} → (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})`);
        } else {
          log(`  ⚠️ ${name} → 검색 결과 없음`);
        }
        await new Promise(r => setTimeout(r, 200)); // 카카오 API rate limit 방지
      }
    }

    log("✅ 완료!");
    setRunning(false);
    setDone(true);
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>📍 기존 기록 위치 자동 입력</h3>
      <p style={{ fontSize: 12, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
        저장된 기록의 식당 이름으로 카카오 API 검색 후<br/>
        위도/경도를 자동으로 채워 지도 핀을 생성합니다.
      </p>

      <button
        onClick={run}
        disabled={running}
        style={{ padding: "12px 20px", background: running ? "#C0B8B0" : ROSE, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: running ? "default" : "pointer", fontFamily: "inherit" }}
      >
        {running ? "처리 중..." : "🗺️ 위치 일괄 입력 시작"}
      </button>

      {logs.length > 0 && (
        <div style={{ marginTop: 16, background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, maxHeight: 300, overflowY: "auto" }}>
          {logs.map((l, i) => (
            <p key={i} style={{ fontSize: 11, color: l.includes("✅") ? "#6B9E7E" : l.includes("⚠️") ? "#D4956A" : MUTED, margin: "2px 0", fontFamily: "monospace" }}>{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}
