// src/app/settings/location-terms/page.tsx
// 위치기반 서비스 이용약관
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

export default function LocationTermsPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: "100vh", background: "#F5F0EB", maxWidth: 480, margin: "0 auto", fontFamily: "inherit" }}>
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: MUTED, lineHeight: 1, padding: "0 4px 0 0" }}>‹</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: INK }}>위치기반 서비스 이용약관</p>
      </div>

      <div style={{ padding: "24px 20px 48px", background: "#fff", margin: "12px 0" }}>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 24, lineHeight: 1.7, background: WARM, padding: "12px 14px", borderRadius: 10 }}>
          Our Taste Inc.(이하 "회사")는 <strong>위치정보의 보호 및 이용 등에 관한 법률</strong>에 따라 위치기반 서비스 이용약관을 다음과 같이 정합니다.
          본 약관은 <strong>2024년 1월 1일</strong>부터 적용됩니다.
        </p>

        <Section title="제1조 (목적)">
          <p>본 약관은 회사가 제공하는 위치기반 서비스(이하 "위치서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
        </Section>

        <Section title="제2조 (위치서비스 내용)">
          <p>회사는 이용자의 위치 정보를 이용하여 다음의 서비스를 제공합니다.<br />
          • 방문한 맛집 위치를 지도에 핀으로 표시<br />
          • 위시리스트 장소의 위치 시각화<br />
          • 식당 기록 시 현재 위치 자동 입력 (선택 기능)</p>
        </Section>

        <Section title="제3조 (위치 정보 수집 방법)">
          <p>① 이용자가 맛집 기록 시 위치 정보를 직접 입력하는 방식으로 수집합니다.<br />
          ② GPS 등 기기의 위치 정보 수집 기능을 이용하는 경우, 이용자의 명시적 동의를 받은 후 수집합니다.<br />
          ③ 위치 정보 수집 동의를 거부해도 서비스의 기본 기능은 이용 가능합니다.</p>
        </Section>

        <Section title="제4조 (위치 정보 이용·보유 기간)">
          <p>• 위치 정보는 서비스 제공 목적 내에서 이용됩니다.<br />
          • 이용자가 작성한 맛집 기록에 포함된 위치 정보는 해당 기록 삭제 또는 회원 탈퇴 시까지 보관됩니다.<br />
          • 일시적 서비스 제공 목적의 위치 정보는 서비스 제공 완료 즉시 삭제됩니다.</p>
        </Section>

        <Section title="제5조 (위치 정보 제3자 제공)">
          <p>회사는 이용자의 위치 정보를 원칙적으로 제3자에게 제공하지 않습니다. 단, 이용자가 커뮤니티에 맛집을 공유하는 경우 해당 위치 정보가 다른 이용자에게 공개될 수 있습니다.</p>
        </Section>

        <Section title="제6조 (이용자 권리)">
          <p>이용자는 언제든지 위치 정보 이용에 대한 동의를 철회하거나, 제공 중단을 요청할 수 있습니다.<br />
          • 기기 설정 → 앱 권한 → 위치 접근 거부<br />
          • 기록 삭제: 앱 내 해당 기록에서 직접 삭제<br />
          • 탈퇴: 설정 → 회원 탈퇴</p>
        </Section>

        <Section title="제7조 (위치 정보 관리 책임자)">
          <p>• 책임자: Our Taste Inc. 개인정보 보호 담당<br />
          • 이메일: privacy@ourtaste.app</p>
        </Section>

        <Section title="제8조 (손해배상 및 면책)">
          <p>① 회사는 위치서비스 제공과 관련하여 이용자에게 발생한 손해에 대해 관련 법령에 따라 책임을 집니다.<br />
          ② 이용자가 직접 입력한 부정확한 위치 정보로 인한 불이익에 대해서는 회사의 책임이 없습니다.</p>
        </Section>

        <p style={{ fontSize: 11, color: "#C0B8B0", textAlign: "center", marginTop: 8 }}>
          공고일: 2024년 1월 1일 · 시행일: 2024년 1월 1일
        </p>
      </div>
    </div>
  );
}
