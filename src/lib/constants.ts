// ============================================================
//  constants.ts  적용 경로: src/lib/constants.ts
//
//  앱 전역 상수 정의
//  - APP_VERSION: 배포 시 수동으로 업데이트하거나
//    Firestore config 컬렉션에서 관리자가 동적으로 변경 가능
// ============================================================

/** 현재 앱 버전 — 배포 시 수동 수정 또는 관리자 페이지에서 Firestore로 관리 */
export const APP_VERSION = "1.0.0";

/** 앱 이름 */
export const APP_NAME = "우리의 맛지도";

/** 고객센터 기본 이메일 — 관리자 페이지에서 Firestore config로 동적 변경 가능 */
export const DEFAULT_SUPPORT_EMAIL = "support@example.com";

/** 신고 수 임계값 — 이 수 이상 신고 시 커뮤니티에서 숨김 */
export const REPORT_HIDE_THRESHOLD = 3;
