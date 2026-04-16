// ============================================================
//  validation.ts
//  적용 경로: src/lib/utils/validation.ts
//
//  로그인/회원가입/닉네임 변경에서 공통 사용
// ============================================================

// 이메일: 표준 형식
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호: 8~20자, 영문+숫자+특수문자 각 1개 이상
export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;

// 닉네임: 2~10자, 한글/영문/숫자/밑줄
export const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]{2,10}$/;

export function validateEmail(email: string): string {
  if (!email.trim())            return "이메일을 입력해주세요.";
  if (!EMAIL_REGEX.test(email)) return "올바른 이메일 형식이 아닙니다.";
  return "";
}

export function validatePassword(pw: string): string {
  if (!pw)                         return "비밀번호를 입력해주세요.";
  if (pw.length < 8)               return "비밀번호는 8자 이상이어야 합니다.";
  if (pw.length > 20)              return "비밀번호는 20자 이하여야 합니다.";
  if (!PASSWORD_REGEX.test(pw))    return "영문, 숫자, 특수문자를 각 1개 이상 포함해야 합니다.";
  return "";
}

export function validatePasswordConfirm(pw: string, confirm: string): string {
  if (!confirm)       return "비밀번호 확인을 입력해주세요.";
  if (pw !== confirm) return "비밀번호가 일치하지 않습니다.";
  return "";
}

export function validateNickname(name: string): string {
  if (!name.trim())                   return "닉네임을 입력해주세요.";
  if (!NICKNAME_REGEX.test(name.trim())) return "2~10자, 한글/영문/숫자/밑줄만 사용 가능합니다.";
  return "";
}
