import React from "react";
import { FileText } from "lucide-react";

export function AttachedFiles() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
        <h3 className="text-[0.9rem] font-heading font-bold m-0 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--primary)]" /> Attached Files
        </h3>
        <button className="text-[var(--primary)] hover:text-[var(--accent-foreground)] font-semibold text-[0.75rem] transition-colors">Upload</button>
      </div>
      <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center mb-2">
          <FileText className="w-5 h-5 text-[var(--primary)] opacity-80" />
        </div>
        <span className="text-[0.85rem] font-semibold text-[var(--foreground)]">No files added yet</span>
        <span className="text-[0.75rem] text-[var(--muted-foreground)]">Upload documents, contracts or notes.</span>
      </div>
    </div>
  );
}
