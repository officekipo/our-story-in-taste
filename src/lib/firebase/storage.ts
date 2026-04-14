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
// 여러 이미지 업로드
//   AddEditModal 호출: uploadImages(coupleId, files, onProgress)
//   folder 는 내부적으로 "visited" 기본값 사용
//   WishModal 에서도 동일 시그니처로 호출 가능
// ──────────────────────────────────────────────────────────
export async function uploadImages(
  coupleId: string,
  files: File[],
  onProgress?: (pct: number) => void,
  folder: "visited" | "wishlist" = "visited"
): Promise<string[]> {
  const total = files.length;
  let completedCount = 0;

  const uploads = files.map(async (file) => {
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const path = `couples/${coupleId}/${folder}/${filename}`;

    const url = await uploadImage(file, path, (pct) => {
      // 전체 진행률 = 완료된 파일 + 현재 파일 진행률 / 총 파일 수
      const overall = Math.round(
        ((completedCount + pct / 100) / total) * 100
      );
      onProgress?.(overall);
    });

    completedCount++;
    onProgress?.(Math.round((completedCount / total) * 100));
    return url;
  });

  return Promise.all(uploads);
}

// ──────────────────────────────────────────────────────────
// 이미지 삭제
// ──────────────────────────────────────────────────────────
export async function deleteImage(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch (err) {
    console.warn("deleteImage: 파일 없음 또는 삭제 실패", err);
  }
}

export async function deleteImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(deleteImage));
}
