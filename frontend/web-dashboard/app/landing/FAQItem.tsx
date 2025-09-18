"use client";

import { useState } from "react";

export interface FAQItemProps {
  question: string;
  answer?: string;
  defaultOpen?: boolean;
}

export default function FAQItem({ question, answer, defaultOpen = false }: FAQItemProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const hasAnswer = Boolean(answer);
  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0px_2px_8px_rgba(36,102,208,0.15),0px_8px_24px_rgba(36,102,208,0.25)] w-full">
      <button
        type="button"
        className="w-full flex items-center gap-2 text-left py-2 min-h-[48px]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-black font-bold text-lg leading-none flex items-center justify-center h-5">{open ? "—" : "+"}</span>
        <h3 className="text-[#01253F] font-semibold text-sm md:text-base leading-none m-0">{question}</h3>
      </button>
      {hasAnswer && open && (
        <p className="text-[#01253F] text-xs md:text-sm mt-2 pl-6">{answer}</p>
      )}
    </div>
  );
}


