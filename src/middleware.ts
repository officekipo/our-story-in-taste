import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
/**
 * 보호할 경로 패턴 목록
 * /login, /signup, /couple 은 로그인 없이 접근 가능
 * 나머지는 로그인 필요
 */
const PUBLIC_PATHS = ["/login", "/signup", "/couple"];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // 공개 경로면 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  /**
   * Firebase Auth 세션 쿠키 확인
   * 실제 프로덕션에서는 Firebase Admin SDK로 검증해야 하지만
   * 프로토타입 단계에서는 클라이언트 측에서 authStore.initialized로
   * 리디렉션을 처리하는 방식을 사용합니다.
   * 아래는 추후 완성을 위한 구조만 작성합니다.
   */
  return NextResponse.next();
}
// middleware가 실행될 경로 패턴
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
