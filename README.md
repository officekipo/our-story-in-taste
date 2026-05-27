# 🍴 우리의 맛지도 (Our Taste)

커플 전용 맛집 기록 PWA — **OUR STORY IN TASTE**

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://our-story-in-taste-mauve.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black?logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20FCM-orange?logo=firebase)](https://firebase.google.com)

---

## 기술 스택

Next.js 16 (App Router · Turbopack) · TypeScript · Zustand · Firebase · Leaflet · Vercel

---

## 로컬 실행

```bash
git clone https://github.com/officekipo/our-story-in-taste.git
cd our-story-in-taste
npm install
cp .env.example .env.local   # 환경변수 입력
npm run dev                  # http://localhost:3000
```

### 환경변수 (.env.local)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_KAKAO_REST_KEY=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

---

## 빌드 & 배포

```bash
# 로컬 빌드 테스트 (Vercel 배포 전 필수)
npm run build
npm run start

# Vercel — main 브랜치 push 시 자동 배포
git push origin main

# Cloud Functions (변경 시에만)
firebase deploy --only functions
```

---

## Android TWA 빌드

> 웹 코드(디자인·기능) 변경은 git push만으로 자동 반영됩니다.  
> 아이콘·앱 이름·테마 색상 변경 시에만 아래 절차가 필요합니다.

```bash
# our-taste-twa/ 폴더에서 (PowerShell)

# 1. twa-manifest.json 버전 업데이트
#    appVersionCode: N+1  /  appVersionName: "1.0.x"

# 2. 빌드
bubblewrap build
# → keystore 비밀번호 입력 → app-release-bundle.aab 생성

# 3. Play Console 업로드
# 테스트 및 출시 → 내부 테스트 → 새 버전 만들기 → .aab 업로드
```

| 항목 | 값 |
|---|---|
| 패키지명 | `com.kipo.ourtaste` |
| Keystore | `our-taste-twa/android.keystore` |
| 트랙 | 내부 테스트 |
