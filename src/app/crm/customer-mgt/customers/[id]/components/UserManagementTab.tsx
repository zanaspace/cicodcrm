"use client";

import React, { useState } from "react";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

// Mock data for User Management table
const users = [
  { id: 1, name: "Obiora Lebechukwu", email: "obiora.lebechukwu@cicod.com", phone: "ng9078520406", role: "SUPERADMIN", createdBy: "Cicod -", createdTime: "21-09-2026 12:37:26 PM", status: "Active" },
];

export function UserManagementTab() {
  const [filter, setFilter] = useState("");
  const [records, setRecords] = useState("All");

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
          <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--primary)]" /> User Management
          </h3>
        </div>

        {/* Toolbar */}
        <div className="p-6 flex flex-wrap gap-6 items-end justify-between border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Filter By</label>
            <div className="flex items-center gap-3">
              <Select 
                value={filter} 
                onChange={setFilter}
                options={["Name", "Email", "Role"]}
                placeholder="Select Filter"
                className="w-[180px] h-[2.8rem]"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-[240px] h-[2.8rem] pl-9 pr-4 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.85rem] focus:outline-none focus:border-[var(--ring)] transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Show records</label>
            <Select 
              value={records} 
              onChange={setRecords}
              options={["All", "10", "50", "100"]}
              placeholder="All"
              className="w-[120px] h-[2.8rem]"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">#</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Email Address</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Phone Number</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Created By</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Created Time</th>
                <th className="px-6 py-3.5 text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((u, idx) => (
                <tr key={idx} className="hover:bg-[var(--muted)]/30 transition-colors">
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">
                    {u.id}
                  </td>
                  <td className="px-6 py-4 text-[0.85rem] font-medium text-[var(--foreground)] whitespace-nowrap">
                    {u.name}
                  </td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">
                    {u.phone}
                  </td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">
                    {u.role}
                  </td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">
                    {u.createdBy}
                  </td>
                  <td className="px-6 py-4 text-[0.85rem] text-[var(--muted-foreground)] whitespace-nowrap">
                    {u.createdTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="success" className="px-3 py-1 font-bold shadow-none tracking-wider text-[0.75rem] uppercase">
                      {u.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
          <span className="text-[0.85rem] text-[var(--muted-foreground)]">Showing 1 to 1 of 1 records</span>
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
    </div>
  );
}
