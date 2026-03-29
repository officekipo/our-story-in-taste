"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/firebase/auth";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/"); // 메인 페이지로 이동
    } catch (err: any) {
      // Firebase 오류 메시지를 사용자 친화적으로 변환
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrongpassword"
      ) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (err.code === "auth/invalid-email") {
        setError("올바른 이메일 형식을 입력해주세요.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };
  const inp =
    "w-full px-4 py-3 bg-warm border border-muted-light rounded-xl text-sm text-ink mb-3";
  return (
    <form onSubmit={handleLogin}>
      <h2 className="text-xl font-bold text-ink mb-6">로그인</h2>
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
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inp}
        required
      />
      {/* 오류 메시지 */}
      {error && <p className="text-xs text-red-500 mb-3 -mt-1">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-rose text-white rounded-xl font-bold textsm
          disabled:bg-muted-light disabled:cursor-not-allowed
          transition-colors"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <p className="text-center text-sm text-muted mt-4">
        계정이 없으신가요?{" "}
        <a href="/signup" className="text-rose font-semibold">
          회원가입
        </a>
      </p>
    </form>
  );
}
