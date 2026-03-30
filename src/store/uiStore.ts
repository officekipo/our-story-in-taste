// src/store/uiStore.ts
// 모달 열림 여부, 토스트, 삭제 확인 등 UI 상태 전역 관리

import { create } from "zustand";
import type { VisitedRecord } from "@/types";

interface UIState {
  // 글쓰기 / 수정 모달
  addModalOpen: boolean;
  editTarget:   VisitedRecord | null;  // null=글쓰기, 값 있음=수정
  openAddModal:  ()                    => void;
  openEditModal: (r: VisitedRecord)    => void;
  closeModal:    ()                    => void;

  // 상세 보기 모달
  detailRecord: VisitedRecord | null;
  openDetail:   (r: VisitedRecord) => void;
  closeDetail:  ()                 => void;

  // 토스트 알림
  toastMsg:   string | null;
  showToast:  (msg: string) => void;
  clearToast: ()            => void;

  // 삭제 확인 다이얼로그
  confirmTarget: { id: string; type: "visited" | "wish" | "comm"; msg: string } | null;
  openConfirm:   (id: string, type: "visited" | "wish" | "comm", msg: string) => void;
  closeConfirm:  () => void;
}

export const useUIStore = create<UIState>((set) => ({
  addModalOpen:  false,
  editTarget:    null,
  openAddModal:  () => set({ addModalOpen: true, editTarget: null }),
  openEditModal: (r) => set({ addModalOpen: true, editTarget: r }),
  closeModal:    () => set({ addModalOpen: false, editTarget: null }),

  detailRecord: null,
  openDetail:   (r) => set({ detailRecord: r }),
  closeDetail:  ()  => set({ detailRecord: null }),

  toastMsg:   null,
  showToast:  (toastMsg) => set({ toastMsg }),
  clearToast: ()         => set({ toastMsg: null }),

  confirmTarget: null,
  openConfirm:  (id, type, msg) => set({ confirmTarget: { id, type, msg } }),
  closeConfirm: ()              => set({ confirmTarget: null }),
}));
