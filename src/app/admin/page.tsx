// src/app/admin/page.tsx
// 관리자 전용 페이지 — role === "admin" 인 유저만 접근 가능
"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { useAuthStore }        from "@/store/authStore";
import { SAMPLE_COMMUNITY }    from "@/lib/sample-data";
import type { CommunityRecord } from "@/types";

const ROSE   = "#C96B52";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

type Tab = "reports" | "posts" | "users";

export default function AdminPage() {
  const router            = useRouter();
  const { role, myName }  = useAuthStore();
  const [tab,  setTab]    = useState<Tab>("reports");
  const [posts, setPosts] = useState<CommunityRecord[]>(SAMPLE_COMMUNITY);
  const [toast, setToast] = useState<string | null>(null);

  // 관리자가 아니면 메인으로 리디렉션
  useEffect(() => {
    if (role !== "admin") router.replace("/");
  }, [role]);

  if (role !== "admin") return null;

  const handleDelete = (id: string, name: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    setToast(`"${name}" 게시물을 삭제했습니다.`);
    setTimeout(() => setToast(null), 2200);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "reports", label: "신고 관리", icon: "🚨" },
    { id: "posts",   label: "게시물 관리", icon: "📋" },
    { id: "users",   label: "회원 관리", icon: "👥" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit" }}>

      {/* 헤더 */}
      <div style={{ background: "#1A1412", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#fff", lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", flex: 1 }}>관리자 페이지</p>
        <div style={{ background: "#7B6BAE", borderRadius: 20, padding: "3px 10px" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{myName} · ADMIN</span>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "12px 4px", border: "none", borderBottom: `2px solid ${tab === id ? ROSE : "transparent"}`, background: "none", color: tab === id ? ROSE : MUTED, fontSize: 12, fontWeight: tab === id ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* 신고 관리 탭 */}
      {tab === "reports" && (
        <div style={{ padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>처리 대기 중인 신고가 없어요</p>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>신고가 들어오면 여기에 표시됩니다</p>
          </div>
        </div>
      )}

      {/* 게시물 관리 탭 */}
      {tab === "posts" && (
        <div style={{ padding: "12px 16px" }}>
          {posts.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.coupleLabel} · 좋아요 {p.likes}</p>
              </div>
              <button
                onClick={() => handleDelete(p.id, p.name)}
                style={{ padding: "6px 12px", background: "#FFF0F0", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
              >삭제</button>
            </div>
          ))}
          {posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#C0B8B0" }}>
              <p style={{ fontSize: 14 }}>게시물이 없어요</p>
            </div>
          )}
        </div>
      )}

      {/* 회원 관리 탭 */}
      {tab === "users" && (
        <div style={{ padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 4 }}>Firebase 콘솔에서 관리</p>
            <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 16 }}>회원 정보 조회 및 등급 변경은 Firebase 콘솔 → Firestore → users 컬렉션에서 직접 관리합니다.</p>
            <p style={{ fontSize: 11, color: MUTED, background: WARM, padding: "10px 14px", borderRadius: 10, fontFamily: "monospace" }}>
              users/{"{"}{"{"}uid{"}"}{"}"}/<br />
              &nbsp;&nbsp;role: "admin" | "user"
            </p>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 1.6 }}>
              특정 유저를 관리자로 지정하려면<br />
              해당 uid 문서의 <strong>role</strong> 필드를 <strong>"admin"</strong> 으로 변경하세요.
            </p>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.9)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 900, whiteSpace: "nowrap", animation: "fadeUp 0.3s ease both" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
