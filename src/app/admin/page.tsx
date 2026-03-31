// src/app/admin/page.tsx
// 관리자 전용 페이지 — role === "admin" 인 유저만 접근
// role !== "admin" 이면 메인으로 자동 리디렉션
"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { useAuthStore }        from "@/store/authStore";
import { SAMPLE_COMMUNITY }    from "@/lib/sample-data";
import type { CommunityRecord } from "@/types";

/* ── 색상 ── */
const ROSE    = "#C96B52";
const ROSE_LT = "#F2D5CC";
const SAGE    = "#6B9E7E";
const INK     = "#1A1412";
const MUTED   = "#8A8078";
const BORDER  = "#E2DDD8";
const WARM    = "#FAF7F3";
const PURPLE  = "#7B6BAE";
const RED     = "#EF4444";

/* ── 탭 타입 ── */
type Tab = "reports" | "posts" | "users";

/* ── 토스트 ── */
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(26,20,18,0.9)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 900, whiteSpace: "nowrap", animation: "fadeUp 0.3s ease both", pointerEvents: "none" }}>
      {msg}
    </div>
  );
}

/* ── 신고 카드 ── */
interface ReportItem {
  id: string;
  type: string;
  targetName: string;
  reason: string;
  reportedAt: string;
  status: "pending" | "resolved";
}

const DUMMY_REPORTS: ReportItem[] = [
  { id: "r1", type: "게시물", targetName: "한남동 파스타집", reason: "스팸/광고성 게시물", reportedAt: "2026-03-29", status: "pending" },
  { id: "r2", type: "게시물", targetName: "북촌 전통 찻집",  reason: "부적절한 사진",     reportedAt: "2026-03-28", status: "pending" },
];

/* ── 유저 행 ── */
interface UserItem {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

const DUMMY_USERS: UserItem[] = [
  { uid: "uid-me",      name: "치즈", email: "cheese@example.com", role: "admin", createdAt: "2023-03-28" },
  { uid: "uid-partner", name: "민준", email: "minjun@example.com", role: "user",  createdAt: "2023-03-28" },
];

/* ── 메인 컴포넌트 ── */
export default function AdminPage() {
  const router           = useRouter();
  const { role, myName } = useAuthStore();
  const [tab,     setTab]     = useState<Tab>("reports");
  const [posts,   setPosts]   = useState<CommunityRecord[]>(SAMPLE_COMMUNITY);
  const [reports, setReports] = useState<ReportItem[]>(DUMMY_REPORTS);
  const [users]               = useState<UserItem[]>(DUMMY_USERS);
  const [toast,   setToast]   = useState<string | null>(null);

  /* role 체크 — admin 아니면 메인으로 */
  useEffect(() => {
    if (role !== "admin") router.replace("/");
  }, [role]);
  if (role !== "admin") return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /* 게시물 삭제 */
  const deletePost = (id: string, name: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    showToast(`"${name}" 게시물을 삭제했어요`);
  };

  /* 신고 처리 */
  const resolveReport = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" as const } : r));
    showToast("신고를 처리 완료했어요");
  };

  const pendingCount = reports.filter(r => r.status === "pending").length;

  const TABS: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: "reports", icon: "🚨", label: "신고",    count: pendingCount },
    { id: "posts",   icon: "📋", label: "게시물",  count: posts.length },
    { id: "users",   icon: "👥", label: "회원",    count: users.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit", paddingBottom: 40 }}>

      {/* ── 헤더 ── */}
      <div style={{ background: INK, padding: "14px 20px 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#fff", lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", flex: 1 }}>관리자 페이지</p>
          <div style={{ background: PURPLE, borderRadius: 20, padding: "3px 10px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{myName} · ADMIN</span>
          </div>
        </div>

        {/* 탭 바 */}
        <div style={{ display: "flex" }}>
          {TABS.map(({ id, icon, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ flex: 1, padding: "10px 4px 12px", border: "none", borderBottom: `2px solid ${tab === id ? ROSE : "transparent"}`, background: "none", color: tab === id ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: tab === id ? 700 : 400, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span>{label} {count !== undefined && `(${count})`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ 신고 탭 ══ */}
      {tab === "reports" && (
        <div style={{ padding: "16px 16px 0" }}>
          {reports.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>처리 대기 중인 신고가 없어요</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ background: r.status === "pending" ? "#FFF0F0" : WARM, borderRadius: 20, padding: "2px 8px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: r.status === "pending" ? RED : SAGE }}>
                          {r.status === "pending" ? "처리 대기" : "처리 완료"}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: MUTED }}>{r.type}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{r.targetName}</p>
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>사유: {r.reason}</p>
                    <p style={{ fontSize: 11, color: "#C0B8B0", marginTop: 2 }}>{r.reportedAt}</p>
                  </div>
                  {r.status === "pending" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button
                        onClick={() => resolveReport(r.id)}
                        style={{ padding: "6px 12px", background: SAGE, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      >처리 완료</button>
                      <button
                        onClick={() => { setPosts(prev => prev.filter(p => p.name !== r.targetName)); resolveReport(r.id); showToast(`"${r.targetName}" 삭제 처리됐어요`); }}
                        style={{ padding: "6px 12px", background: "#FFF0F0", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 10, color: RED, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                      >게시물 삭제</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══ 게시물 탭 ══ */}
      {tab === "posts" && (
        <div style={{ padding: "16px 16px 0" }}>
          {posts.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: "40px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: MUTED }}>게시물이 없어요</p>
            </div>
          ) : posts.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 30, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.coupleLabel} · ❤️ {p.likes}</p>
              </div>
              <button
                onClick={() => deletePost(p.id, p.name)}
                style={{ padding: "6px 12px", background: "#FFF0F0", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 10, color: RED, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
              >삭제</button>
            </div>
          ))}
        </div>
      )}

      {/* ══ 회원 탭 ══ */}
      {tab === "users" && (
        <div style={{ padding: "16px 16px 0" }}>
          {/* 안내 박스 */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 6 }}>회원 등급 변경 방법</p>
            <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 10 }}>Firebase 콘솔 → Firestore → users → 해당 uid 문서의 <strong>role</strong> 필드를 변경하세요.</p>
            <div style={{ background: WARM, borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: MUTED }}>
              role: "user" → "admin" 으로 변경
            </div>
          </div>

          {/* 유저 목록 (더미) */}
          {users.map(u => (
            <div key={u.uid} style={{ background: "#fff", borderRadius: 14, marginBottom: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
              {/* 아바타 */}
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: u.role === "admin" ? PURPLE : ROSE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                {u.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>{u.name}</p>
                  <div style={{ background: u.role === "admin" ? PURPLE : WARM, borderRadius: 20, padding: "1px 6px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: u.role === "admin" ? "#fff" : MUTED }}>{u.role === "admin" ? "관리자" : "일반"}</span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                <p style={{ fontSize: 10, color: "#C0B8B0", marginTop: 1 }}>가입일 {u.createdAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}
