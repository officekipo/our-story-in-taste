// src/app/settings/privacy/page.tsx
// 개인정보 처리방침
"use client";
import { useRouter } from "next/navigation";

const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const ROSE   = "#C96B52";
const WARM   = "#FAF7F3";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>{title}</p>
      <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit" }}>
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>개인정보 처리방침</p>
      </div>

      <div style={{ padding: "24px 20px 48px", background: "#fff", margin: "12px 0" }}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 24, lineHeight: 1.7, background: WARM, padding: "12px 14px", borderRadius: 10 }}>
          Our Taste Inc.(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령을 준수하며, 이용자의 개인정보를 소중히 여깁니다.
          본 방침은 <strong>2024년 1월 1일</strong>부터 시행됩니다.
        </p>

        <Section title="제1조 (수집하는 개인정보 항목)">
          <p>회사는 서비스 제공을 위해 다음 항목을 수집합니다.</p>
          <p style={{ marginTop: 8 }}><strong>필수 항목</strong><br />
          • 이메일 주소 (회원가입·로그인 식별용)<br />
          • 닉네임 (서비스 내 표시명)<br />
          • 기기 식별자 (푸시 알림 발송용, 이용자 동의 시)</p>
          <p style={{ marginTop: 8 }}><strong>서비스 이용 중 자동 생성·수집</strong><br />
          • 방문 기록, 위시리스트, 작성 메모, 사진 파일<br />
          • 접속 일시, 서비스 이용 기록<br />
          • 위치 정보 (지도 기능 이용 시, 이용자 선택)</p>
        </Section>

        <Section title="제2조 (개인정보 수집 방법)">
          <p>• 앱 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력<br />
          • Firebase Authentication을 통한 이메일 로그인 처리<br />
          • 서비스 이용 중 자동 수집</p>
        </Section>

        <Section title="제3조 (개인정보 이용 목적)">
          <p>• 회원 식별 및 서비스 제공<br />
          • 커플 연동 및 데이터 공유 기능<br />
          • 방문 기록·위시리스트 저장 및 조회<br />
          • 푸시 알림 발송 (동의한 경우)<br />
          • 서비스 개선 및 신규 기능 개발<br />
          • 고객 문의 처리</p>
        </Section>

        <Section title="제4조 (개인정보 보유 및 이용 기간)">
          <p>• 회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 삭제합니다.<br />
          • 단, 관계 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.</p>
          <p style={{ marginTop: 8 }}><strong>관련 법령에 따른 보존 항목</strong><br />
          • 계약 또는 청약 철회 기록: 5년 (전자상거래법)<br />
          • 소비자 불만·분쟁 처리 기록: 3년 (전자상거래법)<br />
          • 접속 로그: 3개월 (통신비밀보호법)</p>
        </Section>

        <Section title="제5조 (개인정보의 제3자 제공)">
          <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다.</p>
          <p style={{ marginTop: 8 }}>
          • 이용자가 사전에 동의한 경우<br />
          • 법령에 의거하거나 수사 목적으로 관계 기관의 적법한 요청이 있는 경우</p>
        </Section>

        <Section title="제6조 (개인정보 처리 위탁)">
          <p>회사는 서비스 제공을 위해 다음 업체에 개인정보 처리를 위탁합니다.</p>
          <p style={{ marginTop: 8 }}>
          • <strong>Google Firebase</strong> — 인증, 데이터베이스, 스토리지, 푸시 알림<br />
          • <strong>Vercel Inc.</strong> — 서버 호스팅 및 배포</p>
          <p style={{ marginTop: 8 }}>수탁 업체는 위탁받은 업무 수행 목적 외 개인정보를 처리하지 않습니다.</p>
        </Section>

        <Section title="제7조 (이용자 권리)">
          <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
          <p style={{ marginTop: 8 }}>
          • 개인정보 조회·수정: 앱 내 설정 → 내 프로필에서 직접 변경<br />
          • 개인정보 삭제(회원 탈퇴): 설정 → 회원 탈퇴<br />
          • 처리 정지 요청: 고객센터 이메일로 문의</p>
        </Section>

        <Section title="제8조 (개인정보 보호 책임자)">
          <p>
          • 책임자: Our Taste Inc. 개인정보 보호 담당<br />
          • 이메일: privacy@ourtaste.app<br />
          • 개인정보 침해 신고: 개인정보보호위원회 (privacy.go.kr, 국번없이 182)
          </p>
        </Section>

        <Section title="제9조 (쿠키 운용)">
          <p>회사는 서비스 개선을 위해 쿠키를 사용할 수 있습니다. 이용자는 기기 설정에서 쿠키 저장을 거부할 수 있으나 일부 서비스 이용에 제한이 있을 수 있습니다.</p>
        </Section>

        <p style={{ fontSize: 11, color: "#C0B8B0", textAlign: "center", marginTop: 8 }}>
          공고일: 2024년 1월 1일 · 시행일: 2024년 1월 1일
        </p>
      </div>
    </div>
  );
}
