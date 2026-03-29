"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCouple, joinCouple } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils/cn";
type Mode = "create" | "join";
export default function CouplePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<Mode>("create");
  const [dDayStart, setDDayStart] = useState(""); // 교제 시작일
  const [inviteCode, setInviteCode] = useState(""); // 생성된 코드
  const [inputCode, setInputCode] = useState(""); // 입력한 코드
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  /* 커플 방 생성 */
  const handleCreate = async () => {
    if (!user) return;
    if (!dDayStart) {
      setError("교제 시작일을 선택해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { inviteCode: code } = await createCouple(user.uid, dDayStart);
      setInviteCode(code); // 생성된 코드 표시
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  /* 코드 입력해서 연결 */
  const handleJoin = async () => {
    if (!user) return;
    if (!inputCode.trim()) {
      setError("초대 코드를 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await joinCouple(inputCode.trim().toUpperCase(), user.uid);
      router.push("/"); // 메인으로 이동
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  const inp =
    "w-full px-4 py-3 bg-warm border border-muted-light rounded-xl text-sm text-ink";
  return (
    <div>
      <h2 className="text-xl font-bold text-ink mb-2">커플 연동</h2>
      <p className="text-sm text-muted mb-6">
        파트너와 연동해야 함께 기록을 볼 수 있어요{" "}
      </p>
      {/* 탭 */}
      <div className="flex bg-warm rounded-xl p-0.5 border border-muted-light mb-6">
        {(["create", "join"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError("");
              setInviteCode("");
            }}
            className={cn(
              "flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all",
              mode === m
                ? "bg-white text-rose font-bold shadow-sm"
                : "textmuted",
            )}
          >
            {m === "create" ? "코드 만들기" : "코드 입력하기"}
          </button>
        ))}
      </div>
      {mode === "create" ? (
        <div className="space-y-4">
          {inviteCode ? (
            /* 코드 생성 완료 */
            <div className="text-center">
              <p className="text-sm text-muted mb-3">
                파트너에게 아래 코드를 전달하세요
              </p>
              {/* 초대 코드 복사 박스 */}
              <div className="bg-rose-light rounded-2xl p-5 mb-4">
                <p className="text-2xl font-extrabold text-rose trackingwidest">
                  {inviteCode}
                </p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(inviteCode)}
                className="text-sm text-rose font-semibold"
              >
                코드 복사
              </button>
              <p className="text-xs text-muted mt-4">
                파트너가 코드를 입력하면 자동으로 연동됩니다.
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full mt-6 py-3.5 bg-rose text-white rounded-xl font-bold text-sm"
              >
                나중에 연동하기
              </button>
            </div>
          ) : (
            /* 교제 시작일 입력 */
            <>
              <div>
                <label className="text-xs font-semibold text-muted mb-1.5 block">
                  교제 시작일 (D-Day 기준)
                </label>
                <input
                  type="date"
                  value={dDayStart}
                  onChange={(e) => setDDayStart(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className={inp}
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3.5 bg-rose text-white rounded-xl fontbold text-sm"
              >
                {loading ? "생성 중..." : "초대 코드 만들기"}
              </button>
            </>
          )}
        </div>
      ) : (
        /* 코드 입력 탭 */
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted mb-1.5 block">
              파트너의 초대 코드 입력
            </label>
            <input
              placeholder="TASTE-XXXXXX"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className={cn(
                inp,
                "tracking-widest font-semibold text-center text-lg",
              )}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3.5 bg-rose text-white rounded-xl font-bold text-sm"
          >
            {loading ? "연동 중..." : "커플 연동하기"}
          </button>
        </div>
      )}
    </div>
  );
}
