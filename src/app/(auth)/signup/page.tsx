"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/firebase/auth";
export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // 클라이언트 유효성 검사
    if (!name.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      router.push("/couple"); // 커플 연동 페이지로 이동
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (err.code === "auth/invalid-email") {
        setError("올바른 이메일 형식을 입력해주세요.");
      } else {
        setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };
  const inp =
    "w-full px-4 py-3 bg-warm border border-muted-light rounded-xl text-sm text-ink mb-3";
  return (
    <form onSubmit={handleSignup}>
      <h2 className="text-xl font-bold text-ink mb-6">회원가입</h2>
      <input
        placeholder="닉네임 (예: 치즈)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inp}
        required
      />
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inp}
        required
      />
      <input
        type="password"
        placeholder="비밀번호 (8자 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inp}
        required
      />
      <input
        type="password"
        placeholder="비밀번호 확인"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={inp}
        required
      />
      {error && <p className="text-xs text-red-500 mb-3 -mt-1">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-rose text-white rounded-xl font-bold textsm disabled:bg-muted-light disabled:cursor-not-allowed"
      >
        {loading ? "가입 중..." : "가입하기"}
      </button>
      <p className="text-center text-sm text-muted mt-4">
        이미 계정이 있으신가요?{" "}
        <a href="/login" className="text-rose font-semibold">
          로그인
        </a>
      </p>
    </form>
  );
}
