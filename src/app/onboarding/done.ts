// src/app/onboarding/done.ts
// 온보딩 완료 처리 유틸
// localStorage + 쿠키 동시에 저장 (localStorage: 클라이언트, 쿠키: middleware)

export function markOnboardingDone() {
  if (typeof window === "undefined") return;

  // 클라이언트에서 직접 읽을 때
  localStorage.setItem("onboarding_done", "1");

  // middleware에서 읽을 때 (1년 유효)
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `onboarding_done=1; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("onboarding_done");
}
