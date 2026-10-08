"use client";

import React, { useState } from "react";
import { Ticket, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";

// Mock tickets data
const mockTickets = [
  { id: "TCK-9901", customerName: "Obiora", summary: "Unable to process payment", queue: "Billing", queueType: "Dispute", priority: "High", reportedBy: "Adeola Adesina", createdTime: "22-10-2026 14:30", status: "Open" },
  { id: "TCK-9902", customerName: "Obiora", summary: "Account locked out", queue: "Support", queueType: "Access", priority: "Critical", reportedBy: "System", createdTime: "21-10-2026 09:15", status: "Resolved" }
];

export function TicketsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    toast.success("Ticket created successfully!");
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Header with Add Button */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
          <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[var(--primary)]" /> Tickets
          </h3>
          <Button 
            className="h-8 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-semibold text-[0.8rem] rounded-full px-5 shadow-sm border-none"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Ticket
          </Button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Ticket ID</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Summary</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Queue</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Queue Type</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Priority</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Reported By</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Created Time</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {mockTickets.length > 0 ? mockTickets.map((t, idx) => (
                <tr key={idx} className="hover:bg-[var(--muted)]/30 transition-colors">
                  <td className="px-6 py-4 text-[0.85rem] font-semibold text-[var(--primary)] hover:underline cursor-pointer whitespace-nowrap">{t.id}</td>
                  <td className="px-6 py-4 text-[0.85rem] font-medium text-[var(--foreground)] whitespace-nowrap">{t.customerName}</td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--foreground)] truncate max-w-[200px]" title={t.summary}>{t.summary}</td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">{t.queue}</td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">{t.queueType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[0.75rem] font-bold uppercase tracking-wider ${
                      t.priority === 'Critical' ? 'text-[var(--destructive)]' : 'text-[#F59E0B]'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">{t.reportedBy}</td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">{t.createdTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={t.status === 'Open' ? 'success' : 'secondary'} className="px-2.5 py-0.5 rounded-full font-bold shadow-none text-[0.75rem]">
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[0.85rem] text-[var(--muted-foreground)]">
                    No record available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
          <span className="text-[0.85rem] text-[var(--muted-foreground)]">Showing 1 to 2 of 2 records</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--muted-foreground)] font-medium" disabled>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-[var(--border)] bg-[var(--card)] text-[var(--primary)] font-bold shadow-sm">
              1
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--muted-foreground)] font-medium" disabled>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Improved Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm modal-backdrop-enter">
          <div className="bg-[var(--card)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden modal-dialog-enter">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
              <h2 className="text-[1.1rem] font-heading font-bold text-[var(--foreground)] flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[var(--primary)]" /> Add Ticket
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreate}>
              <div className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Customer Name</label>
                  <input type="text" value="Obiora" disabled className="h-10 px-3 rounded-md border border-[var(--input)] bg-[var(--muted)]/50 text-[0.9rem] text-[var(--muted-foreground)] cursor-not-allowed" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Customer Number</label>
                  <input type="text" value="ng9078520406" disabled className="h-10 px-3 rounded-md border border-[var(--input)] bg-[var(--muted)]/50 text-[0.9rem] text-[var(--muted-foreground)] cursor-not-allowed" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Queue <span className="text-[var(--destructive)]">*</span></label>
                  <Select options={["Billing", "Support", "Technical", "Sales"]} placeholder="Select Queue" className="h-10 w-full" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Queue Type <span className="text-[var(--destructive)]">*</span></label>
                  <Select options={["Dispute", "Inquiry", "Request", "Issue"]} placeholder="Select Type" className="h-10 w-full" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Priority <span className="text-[var(--destructive)]">*</span></label>
                  <Select options={["Low", "Medium", "High", "Critical"]} placeholder="Select Priority" className="h-10 w-full" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Complaint Source <span className="text-[var(--destructive)]">*</span></label>
                  <Select options={["Email", "Phone", "Portal", "Chat"]} placeholder="Select Source" className="h-10 w-full" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Reported By</label>
                  <input type="text" defaultValue="Adeola Adesina" className="h-10 px-3 rounded-md border border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Summary <span className="text-[var(--destructive)]">*</span></label>
                  <input type="text" required placeholder="Enter brief summary of the issue" className="h-10 px-3 rounded-md border border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]" />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[0.8rem] font-bold text-[var(--foreground)]">Description</label>
                  <textarea 
                    rows={4} 
                    placeholder="Provide detailed description of the ticket..."
                    className="p-3 rounded-md border border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] resize-none" 
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 font-semibold border-[var(--input)]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-8 font-semibold border-none"
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
