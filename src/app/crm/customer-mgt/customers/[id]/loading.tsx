import React from "react";

export default function LoadingCustomerDetails() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="w-56 h-8 bg-[var(--muted)] rounded-md"></div>
          <div className="w-96 h-4 bg-[var(--muted)] rounded-md"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-9 bg-[var(--muted)] rounded-full"></div>
          <div className="w-24 h-9 bg-[var(--muted)] rounded-full"></div>
          <div className="w-9 h-9 bg-[var(--muted)] rounded-full"></div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-[var(--muted)] rounded-xl opacity-60"></div>)}
      </div>
      <div className="flex items-center bg-[var(--muted)] p-1.5 rounded-lg w-full gap-1">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="w-32 h-9 bg-[var(--background)] rounded-md opacity-50"></div>)}
      </div>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm h-[420px]"></div>
    </div>
  );
}
