// src/lib/firebase/storage.ts
// Firebase Storage 이미지 업로드/삭제 함수

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";

// ── 이미지 1장 업로드 → 다운로드 URL 반환 ─────────────────
export function uploadImage(
  coupleId:    string,
  file:        File,
  folder:      "visited" | "profile" | "community" = "visited",
  onProgress?: (pct: number) => void,
): Promise<string> {
  const safeName   = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const path       = `couples/${coupleId}/${folder}/${safeName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      },
    );
  });
}

// ── 여러 장 동시 업로드 ───────────────────────────────────
export async function uploadImages(
  coupleId:    string,
  files:       File[],
  onProgress?: (pct: number) => void,
): Promise<string[]> {
  return Promise.all(files.map(f => uploadImage(coupleId, f, "visited", onProgress)));
}

// ── 이미지 삭제 (오류는 무시) ─────────────────────────────
export async function deleteImage(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch (e) {
    console.warn("이미지 삭제 실패 (무시):", e);
  }
}

export async function deleteImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(deleteImage));
}
