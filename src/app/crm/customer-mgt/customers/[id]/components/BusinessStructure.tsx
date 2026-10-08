"use client";

import React, { useState } from "react";
import { Shield, Plus, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";

export function BusinessStructure() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [bank, setBank] = useState("");

  const handleSave = () => {
    setIsModalOpen(false);
    toast.success("Business Structure created successfully!");
  };

  return (
    <>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
          <h3 className="text-[0.9rem] font-heading font-bold m-0 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--primary)]" /> Business Structure
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[var(--primary)] hover:text-[var(--accent-foreground)] font-semibold text-[0.75rem] transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="p-3 border border-[var(--border)] rounded-lg bg-[var(--background)]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[0.85rem]">Main Location</span>
              <span className="text-[0.7rem] text-[var(--muted-foreground)]">Lagos</span>
            </div>
            <span className="text-[0.8rem] text-[var(--muted-foreground)] block">127, crown, Abernethy</span>
          </div>
          
          <div className="p-3 border border-[var(--border)] rounded-lg bg-[var(--background)]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-[0.85rem]">Self-Service</span>
              <span className="text-[0.7rem] text-[var(--muted-foreground)]">SELF-SERVICE</span>
            </div>
            <span className="text-[0.8rem] text-[var(--muted-foreground)] block">SELF-SERVICE</span>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create Business Structure"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 border-none"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Top Fields */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-[0.85rem] font-bold text-[var(--foreground)]">Country<span className="text-red-500">*</span></label>
              <Select 
                value={country} 
                onChange={setCountry}
                options={["Nigeria", "United States", "United Kingdom"]}
                placeholder="Select Country"
                className="w-full h-10"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-[0.85rem] font-bold text-[var(--foreground)]">State/County<span className="text-red-500">*</span></label>
              <Select 
                value={state} 
                onChange={setState}
                options={["Lagos", "Abuja", "Rivers"]}
                placeholder="Select State"
                className="w-full h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[0.85rem] font-bold text-[var(--foreground)]">Location<span className="text-red-500">*</span></label>
              <input type="text" placeholder="Enter business location" className="w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]" />
            </div>
          </div>

          {/* Bank Accounts Section */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col border-b-2 border-[#1E3A8A]">
              <h4 className="text-[1.1rem] font-heading font-bold text-[#8B0000] pb-2">Bank Accounts</h4>
            </div>

            <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 bg-[var(--muted)]/30 flex flex-col gap-5 relative mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-bold text-[var(--foreground)]">Bank Name<span className="text-red-500">*</span></label>
                <Select 
                  value={bank} 
                  onChange={setBank}
                  options={["Access Bank", "GTBank", "Zenith Bank", "First Bank"]}
                  placeholder="Select Bank"
                  className="w-full h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[0.85rem] font-bold text-[var(--foreground)]">Account Name<span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter account name" className="w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]" />
                </div>
                
                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[0.85rem] font-bold text-[var(--foreground)]">Account Number<span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter account number" className="w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] focus:outline-none focus:border-[var(--ring)]" />
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <Button 
                  className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-semibold shadow-none rounded-full px-5 h-9"
                  onClick={() => toast.success("Bank Account Added Successfully!")}
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
