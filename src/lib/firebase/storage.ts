// ============================================================
//  storage.ts
//  적용 경로: src/lib/firebase/storage.ts
//
//  uploadImages 시그니처를 AddEditModal 호출 방식에 맞춤:
//    uploadImages(coupleId, files, onProgress?)
// ============================================================

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import "./config";

const storage = getStorage();

// ──────────────────────────────────────────────────────────
// 이미지 압축 (Canvas API)
// ──────────────────────────────────────────────────────────
export async function compressImage(
  file: File,
  maxSize = 1280,
  quality = 0.75
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"));

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

// ──────────────────────────────────────────────────────────
// 단일 이미지 업로드 (진행률 콜백 포함)
// ──────────────────────────────────────────────────────────
export async function uploadImage(
  file: File,
  storagePath: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const compressed = await compressImage(file);

  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(
      storageRef,
      compressed,
      { contentType: "image/jpeg" }
    );

    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// ──────────────────────────────────────────────────────────
// Blob 직접 업로드 (내부 공통 함수)
// ──────────────────────────────────────────────────────────
async function uploadBlob(
  blob: Blob,
  storagePath: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageReference = ref(storage, storagePath);
    const task = uploadBytesResumable(storageReference, blob, { contentType: "image/jpeg" });
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

// ──────────────────────────────────────────────────────────
// 여러 이미지 업로드 + 썸네일 동시 생성
//   full  : 1280px, quality 0.75  → lightbox / 상세 뷰용
//   thumb :  400px, quality 0.70  → 카드 목록 썸네일용 (~5~10× 작음)
//
//   반환: { imgUrls, thumbUrls }
//   Firestore에 두 배열 모두 저장 → 카드는 thumbUrls 사용
// ──────────────────────────────────────────────────────────
export async function uploadImagesWithThumbs(
  coupleId: string,
  files: File[],
  onProgress?: (pct: number) => void,
  folder: "visited" | "wishlist" = "visited"
): Promise<{ imgUrls: string[]; thumbUrls: string[] }> {
  const total = files.length;
  let completed = 0;

  const results = await Promise.all(
    files.map(async (file) => {
      const id       = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const fullPath  = `couples/${coupleId}/${folder}/${id}.jpg`;
      const thumbPath = `couples/${coupleId}/${folder}/thumb_${id}.jpg`;

      // 두 사이즈 압축을 병렬로 실행
      const [fullBlob, thumbBlob] = await Promise.all([
        compressImage(file, 1280, 0.75),
        compressImage(file,  400, 0.70),
      ]);

      // 두 파일 업로드를 병렬로 실행
      const [imgUrl, thumbUrl] = await Promise.all([
        uploadBlob(fullBlob,  fullPath),
        uploadBlob(thumbBlob, thumbPath),
      ]);

      completed++;
      onProgress?.(Math.round((completed / total) * 100));
      return { imgUrl, thumbUrl };
    })
  );

  return {
    imgUrls:   results.map((r) => r.imgUrl),
    thumbUrls: results.map((r) => r.thumbUrl),
  };
}

// ──────────────────────────────────────────────────────────
// 기존 uploadImages — 하위호환 유지 (thumbUrls 불필요한 경우)
// ──────────────────────────────────────────────────────────
export async function uploadImages(
  coupleId: string,
  files: File[],
  onProgress?: (pct: number) => void,
  folder: "visited" | "wishlist" = "visited"
): Promise<string[]> {
  const { imgUrls } = await uploadImagesWithThumbs(coupleId, files, onProgress, folder);
  return imgUrls;
}

// ──────────────────────────────────────────────────────────
// 이미지 삭제
// ──────────────────────────────────────────────────────────
export async function deleteImage(url: string): Promise<void> {
  try {
    // ★ 전체 URL에서 Storage 경로 추출 후 ref() 사용
    // URL 형식: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
    let fileRef;
    if (url.startsWith("https://firebasestorage.googleapis.com")) {
      const urlObj  = new URL(url);
      const encoded = urlObj.pathname.split("/o/")[1];
      if (!encoded) throw new Error("잘못된 Storage URL");
      const path = decodeURIComponent(encoded);
      fileRef = ref(storage, path);
    } else {
      fileRef = ref(storage, url);
    }
    await deleteObject(fileRef);
  } catch (err) {
    console.warn("deleteImage: 파일 없음 또는 삭제 실패", err);
  }
}

export async function deleteImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(deleteImage));
}
