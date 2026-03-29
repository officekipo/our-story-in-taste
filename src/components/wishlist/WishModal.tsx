"use client";
import { useState } from "react";
import { SIDO, CUISINES } from "@/types";
import { cn } from "@/lib/utils/cn";
interface WishModalProps {
  onClose: () => void;
  onSave: (data: {
    name: string;
    sido: string;
    district: string;
    cuisine: string;
    note: string;
  }) => void;
}
export function WishModal({ onClose, onSave }: WishModalProps) {
  const [name, setName] = useState("");
  const [sido, setSido] = useState("서울");
  const [district, setDistrict] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [note, setNote] = useState("");
  const inp =
    "w-full px-3.5 py-3 bg-warm border border-muted-light rounded-xl text-sm text-ink mb-3";
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 z-[700] flex items-end justifycenter"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-app bg-white rounded-t-2xl px-6 pt-6 pb-[calc(24px+64px)] animate-slide-up"
      >
        <div className="w-9 h-1 bg-muted-light rounded-full mx-auto mb-4" />
        <h2 className="text-base font-bold text-ink mb-4">가고 싶은 곳 추가</h2>
        <input
          placeholder="식당 이름 *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inp}
        />
        {/* 지역 */}
        <div className="flex gap-2 mb-3">
          <div className="relative shrink-0">
            <select
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              className={cn(inp, "mb-0 pr-7 w-auto cursor-pointer")}
            >
              {SIDO.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
              ▾
            </span>
          </div>
          <input
            placeholder="상세 지역"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={cn(inp, "mb-0 flex-1")}
          />
        </div>
        {/* 음식 종류 */}
        <div className="relative mb-3">
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className={cn(inp, "mb-0 pr-7 cursor-pointer")}
          >
            <option value="">음식 종류 선택</option>
            {CUISINES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">
            ▾
          </span>
        </div>
        <textarea
          placeholder="가고 싶은 이유"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className={cn(inp, "resize-none")}
        />
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-warm border border-muted-light rounded-xl text-muted text-sm"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (!name) return;
              onSave({ name, sido, district, cuisine, note });
              onClose();
            }}
            className="flex-[2] py-3 bg-sage text-white rounded-xl text-sm font-bold"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
