"use client";

import React, { useState } from "react";
import { StickyNote, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

// Mock note history
const mockNotes = [
  { id: 1, title: "Initial Consultation", content: "Customer requested a premium setup with all features enabled. Will follow up next week to finalize requirements.", date: "Oct 21, 2026 - 10:30 AM", author: "Adeola Adesina" },
  { id: 2, title: "Billing Inquiry", content: "Discussed the new pricing model. Customer agreed to upgrade to the enterprise plan.", date: "Oct 15, 2026 - 02:15 PM", author: "System" }
];

export function NoteTab() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setTitle("");
      setContent("");
      toast.success("Note saved successfully!");
    }, 2000);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Note History */}
        <div className="col-span-1 flex flex-col">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col h-[550px]">
            <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--background)]">
              <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--primary)]" /> Note History
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {mockNotes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50 transition-colors cursor-pointer group">
                  <h4 className="font-bold text-[0.85rem] text-[var(--foreground)] mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1">{note.title}</h4>
                  <p className="text-[0.8rem] text-[var(--muted-foreground)] line-clamp-2 mb-3 leading-relaxed">{note.content}</p>
                  <div className="flex items-center justify-between text-[0.7rem] text-[var(--muted-foreground)] font-bold uppercase tracking-wider">
                    <span>{note.author}</span>
                    <span>{note.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: New Note Form */}
        <div className="col-span-1 md:col-span-2 flex flex-col">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col h-[550px]">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
              <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[var(--primary)]" /> Add New Note
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-5">
              <input 
                type="text" 
                placeholder="Enter a title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-11 px-4 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] font-medium focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all"
              />
              
              <textarea 
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="flex-1 p-4 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] leading-relaxed focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all resize-none"
              />
              
              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !title || !content}
                  className="px-8 shadow-sm h-10"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Submit
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
