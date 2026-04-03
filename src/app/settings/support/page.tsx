// src/app/settings/support/page.tsx
// 고객센터 / 문의하기
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const ROSE   = "#C96B52";
const ROSE_LT = "#F2D5CC";
const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";
const CREAM  = "#F0EBE3";

const SUPPORT_EMAIL = "support@ourtaste.app";
const APP_VERSION   = "1.0.0";

const FAQ = [
  {
    q: "파트너와 어떻게 연동하나요?",
    a: "설정 → 커플 연동 / 초대 코드에서 코드를 만들어 파트너에게 전달하세요. 파트너가 코드를 입력하면 연동됩니다.",
  },
  {
    q: "기록한 데이터를 삭제하면 복구할 수 있나요?",
    a: "삭제된 기록은 복구할 수 없습니다. 삭제 전 한 번 더 확인해주세요.",
  },
  {
    q: "회원 탈퇴 시 데이터는 어떻게 되나요?",
    a: "탈퇴 즉시 모든 방문 기록, 위시리스트, 사진이 영구 삭제됩니다. 커플 연동도 해제됩니다.",
  },
  {
    q: "알림이 오지 않아요.",
    a: "설정 → 알림 설정에서 알림이 켜져 있는지 확인하고, 기기 설정에서 앱 알림 허용 여부를 확인해주세요.",
  },
  {
    q: "지도에 위치가 잘못 표시돼요.",
    a: "기록 수정에서 위치 정보를 다시 입력해주세요. 자동 위치 기능은 GPS 정확도에 따라 오차가 있을 수 있습니다.",
  },
  {
    q: "사진이 업로드되지 않아요.",
    a: "인터넷 연결 상태를 확인하고, 파일 크기가 5MB 이하인지 확인해주세요. 지속되면 고객센터로 문의해주세요.",
  },
];

export default function SupportPage() {
  const router       = useRouter();
  const { myName }   = useAuthStore();
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [content,  setContent]  = useState("");
  const [sent,     setSent]     = useState(false);

  const handleSend = () => {
    if (!category || !content.trim()) return;
    // 실제 구현: 이메일 전송 API 또는 Firestore에 문의 저장
    setSent(true);
  };

  const cats = ["앱 오류/버그", "기능 문의", "계정 문제", "결제 문의", "기타"];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit", paddingBottom: 48 }}>

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>고객센터</p>
      </div>

      {/* 상단 카드 */}
      <div style={{ margin: "16px 16px 0", background: `linear-gradient(135deg, ${ROSE_LT}, ${CREAM})`, borderRadius: 20, padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
        <p style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 4 }}>무엇이 궁금하세요?</p>
        <p style={{ fontSize: 13, color: MUTED }}>자주 묻는 질문을 먼저 확인하거나<br />이메일로 문의해주세요</p>
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.7)", borderRadius: 12, padding: "10px 16px", display: "inline-block" }}>
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>이메일 문의</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: ROSE }}>{SUPPORT_EMAIL}</p>
        </div>
      </div>

      {/* 앱 버전 */}
      <div style={{ margin: "12px 16px 0", background: "#fff", borderRadius: 14, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 13, color: MUTED }}>앱 버전</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>v{APP_VERSION}</p>
      </div>

      {/* FAQ */}
      <div style={{ margin: "20px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>자주 묻는 질문</p>
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              >
                <p style={{ fontSize: 14, fontWeight: 500, color: INK, flex: 1, marginRight: 12 }}>Q. {item.q}</p>
                <span style={{ fontSize: 16, color: openFaq === i ? ROSE : "#C0B8B0", transition: "transform 0.2s", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, display: "block" }}>▾</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 16px 14px" }}>
                  <div style={{ background: WARM, borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>A. {item.a}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 1:1 문의 폼 */}
      <div style={{ margin: "20px 16px 0" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>1:1 문의하기</p>

        {sent ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 20px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>문의가 접수됐어요</p>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>영업일 기준 1~3일 내에<br />{SUPPORT_EMAIL}로 답변 드릴게요.</p>
            <button onClick={() => { setSent(false); setCategory(""); setContent(""); }} style={{ marginTop: 20, padding: "10px 24px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>새 문의하기</button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>

            {/* 문의 유형 */}
            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 10 }}>문의 유형 *</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {cats.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${category === c ? ROSE : BORDER}`, background: category === c ? ROSE_LT : WARM, color: category === c ? ROSE : MUTED, fontSize: 13, fontWeight: category === c ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  {c}
                </button>
              ))}
            </div>

            {/* 문의 내용 */}
            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8 }}>문의 내용 *</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`불편하신 점이나 문의 사항을 자세히 작성해주세요.\n\n앱 버전: v${APP_VERSION}\n닉네임: ${myName}`}
              rows={6}
              style={{ width: "100%", padding: "12px 14px", background: WARM, border: `1px solid ${BORDER}`, borderRadius: 12, color: INK, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6, marginBottom: 16 }}
            />

            <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
              답변은 <strong>{SUPPORT_EMAIL}</strong>로 발송됩니다.<br />
              영업일 기준 1~3일 내 답변 드려요.
            </p>

            <button
              onClick={handleSend}
              disabled={!category || !content.trim()}
              style={{ width: "100%", padding: 14, background: category && content.trim() ? ROSE : "#C0B8B0", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: category && content.trim() ? "pointer" : "default", fontFamily: "inherit" }}
            >
              문의 보내기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
