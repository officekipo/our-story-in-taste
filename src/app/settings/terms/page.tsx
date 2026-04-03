// src/app/settings/terms/page.tsx
// 서비스 이용약관
"use client";
import { useRouter } from "next/navigation";

const INK    = "#1A1412";
const MUTED  = "#8A8078";
const BORDER = "#E2DDD8";
const WARM   = "#FAF7F3";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>{title}</p>
      <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

export default function TermsPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit" }}>
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>서비스 이용약관</p>
      </div>

      <div style={{ padding: "24px 20px 48px", background: "#fff", margin: "12px 0" }}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 24, lineHeight: 1.7, background: WARM, padding: "12px 14px", borderRadius: 10 }}>
          본 약관은 Our Taste Inc.(이하 "회사")가 운영하는 <strong>우리의 맛지도</strong> 서비스 이용에 관한 조건 및 절차를 규정합니다.
          본 약관은 <strong>2024년 1월 1일</strong>부터 적용됩니다.
        </p>

        <Section title="제1조 (목적)">
          <p>이 약관은 회사가 제공하는 우리의 맛지도 모바일 앱 및 관련 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무, 책임 사항을 규정함을 목적으로 합니다.</p>
        </Section>

        <Section title="제2조 (용어 정의)">
          <p>• <strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 자<br />
          • <strong>커플 계정</strong>: 두 명의 이용자가 초대 코드를 통해 연결한 계정 쌍<br />
          • <strong>콘텐츠</strong>: 이용자가 서비스 내에 게시한 방문 기록, 사진, 메모, 리뷰 등 일체의 정보</p>
        </Section>

        <Section title="제3조 (약관의 게시 및 변경)">
          <p>① 회사는 본 약관을 앱 내 설정 화면에 게시합니다.<br />
          ② 회사는 필요 시 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 최소 7일 전에 앱 내 공지를 통해 알립니다.<br />
          ③ 이용자가 변경 후에도 서비스를 계속 이용하면 변경 약관에 동의한 것으로 간주합니다.</p>
        </Section>

        <Section title="제4조 (서비스 이용 계약)">
          <p>① 이용 계약은 이용자가 회원가입 시 약관에 동의하고 회사가 승인함으로써 성립됩니다.<br />
          ② 회사는 다음의 경우 가입을 제한할 수 있습니다.<br />
          • 타인의 정보를 도용하거나 허위 정보를 기재한 경우<br />
          • 만 14세 미만인 경우<br />
          • 이전에 서비스 이용이 제한된 이력이 있는 경우</p>
        </Section>

        <Section title="제5조 (서비스 제공)">
          <p>회사가 제공하는 서비스는 다음과 같습니다.<br />
          • 커플 맛집 방문 기록 저장 및 조회<br />
          • 가고 싶은 맛집 위시리스트 기능<br />
          • 맛집 위치 지도 시각화<br />
          • 데이트 통계 분석<br />
          • 커플 간 맛집 추천 공유 커뮤니티<br />
          • 기념일 알림 (FCM 동의 이용자 한정)</p>
        </Section>

        <Section title="제6조 (서비스 이용 시간)">
          <p>서비스는 연중무휴 24시간 제공을 원칙으로 합니다. 단, 시스템 점검 등 불가피한 사유로 일시 중단될 수 있으며 사전 공지합니다.</p>
        </Section>

        <Section title="제7조 (이용자 의무)">
          <p>이용자는 다음 행위를 해서는 안 됩니다.<br />
          • 타인의 개인정보 도용 또는 허위 정보 등록<br />
          • 서비스의 정상적인 운영을 방해하는 행위<br />
          • 음란, 폭력, 혐오 콘텐츠 게시<br />
          • 타인의 저작권, 명예권 등 권리를 침해하는 행위<br />
          • 회사의 동의 없는 상업적 목적의 서비스 이용<br />
          • 관련 법령을 위반하는 일체의 행위</p>
        </Section>

        <Section title="제8조 (콘텐츠 권리)">
          <p>① 이용자가 서비스 내에 게시한 콘텐츠의 저작권은 이용자에게 있습니다.<br />
          ② 커뮤니티에 공유한 콘텐츠는 다른 이용자가 앱 내에서 열람할 수 있습니다.<br />
          ③ 회사는 서비스 개선 및 홍보를 위해 이용자 콘텐츠를 활용할 수 있으며, 이 경우 사전에 동의를 구합니다.</p>
        </Section>

        <Section title="제9조 (서비스 중단 및 해지)">
          <p>① 회사는 이용자가 본 약관을 위반할 경우 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.<br />
          ② 이용자는 언제든지 앱 설정에서 회원 탈퇴를 통해 서비스를 해지할 수 있습니다.<br />
          ③ 탈퇴 시 모든 콘텐츠 및 개인정보는 즉시 삭제되며 복구할 수 없습니다.</p>
        </Section>

        <Section title="제10조 (책임 제한)">
          <p>① 회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.<br />
          ② 회사는 이용자 간의 분쟁에 개입하지 않으며, 이로 인한 손해를 배상할 책임이 없습니다.<br />
          ③ 이용자가 직접 작성·게시한 콘텐츠에 대한 책임은 이용자에게 있습니다.</p>
        </Section>

        <Section title="제11조 (분쟁 해결)">
          <p>① 서비스 이용과 관련한 분쟁은 회사와 이용자 간 협의를 통해 해결합니다.<br />
          ② 협의가 이루어지지 않을 경우 관련 법령에 따른 관할 법원에서 해결합니다.<br />
          ③ 회사의 소재지: 대한민국</p>
        </Section>

        <p style={{ fontSize: 11, color: "#C0B8B0", textAlign: "center", marginTop: 8 }}>
          공고일: 2024년 1월 1일 · 시행일: 2024년 1월 1일
        </p>
      </div>
    </div>
  );
}
