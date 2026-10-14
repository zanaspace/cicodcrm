"use client";

import * as React from "react";
import {
  FileText, Download, Copy, Check, ExternalLink, Code2, BookOpen,
  Sparkles, CheckCircle2, ShieldCheck, AlertTriangle, Layers, Eye,
  ChevronRight, RefreshCw, Hash, ListFilter, RotateCcw, CheckSquare, Square,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { PRD_EMBEDDED_DOCS } from "../data/prdDocs";
import { TestCasesViewer } from "./TestCasesViewer";
import { SPRINT_TEST_CASES } from "../data/testCasesData";

export interface PRDViewerProps {
  docFileName: string;
  sprintNum: number;
  sprintTitle: string;
  fallbackSummary?: string;
  onOpenTestCases?: () => void;
}

export type ParsedSection = {
  num: number;
  title: string;
  rawText: string;
};

const SECTION_HEADERS_CONFIG: { num: number; title: string; short: string; icon: any }[] = [
  { num: 1, title: "Document Control & Metadata", short: "Metadata", icon: FileText },
  { num: 2, title: "Executive Summary & Core Deliverables", short: "Summary", icon: Sparkles },
  { num: 3, title: "Product Vision & Strategic Objectives", short: "Vision", icon: BookOpen },
  { num: 4, title: "Target Audience & User Personas", short: "Personas", icon: Layers },
  { num: 5, title: "Scope Boundaries", short: "Scope", icon: ListFilter },
  { num: 6, title: "Comprehensive User Flow & Journey Maps", short: "User Flows", icon: Code2 },
  { num: 7, title: "Functional Requirements (FRs)", short: "Functional FRs", icon: CheckCircle2 },
  { num: 8, title: "Non-Functional Requirements (NFRs)", short: "NFRs", icon: ShieldCheck },
  { num: 9, title: "Detailed User Stories & Sprint Tasks", short: "User Stories", icon: CheckCircle2 },
  { num: 10, title: "Technical Architecture, Data Models & API Contracts", short: "Architecture", icon: Code2 },
  { num: 11, title: "Edge Cases & Error Handling Strategies", short: "Edge Cases", icon: AlertTriangle },
  { num: 12, title: "Success Metrics & Key Performance Indicators (KPIs)", short: "KPIs", icon: Sparkles },
  { num: 13, title: "Release Plan, Milestones & Definition of Done (DoD)", short: "Release Plan", icon: Layers },
  { num: 14, title: "Architectural Risks, Mitigations & Dependencies", short: "Risks & Deps", icon: AlertTriangle },
  { num: 15, title: "Open Questions, Decisions & Next Steps", short: "Open Questions", icon: BookOpen },
  { num: 16, title: "Test Cases, Use Cases & QA Acceptance Scenarios", short: "Test Cases", icon: FlaskConical }
];

export function PRDViewer({ docFileName, sprintNum, sprintTitle, fallbackSummary, onOpenTestCases }: PRDViewerProps) {
  const [markdown, setMarkdown] = React.useState<string>(() => PRD_EMBEDDED_DOCS[docFileName] || "");
  const [loading, setLoading] = React.useState<boolean>(() => !PRD_EMBEDDED_DOCS[docFileName]);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<number | "all">("all");
  const [viewMode, setViewMode] = React.useState<"interactive" | "raw">("interactive");
  const [copied, setCopied] = React.useState<boolean>(false);

  // LocalStorage-persisted checkbox state
  const [checkedCheckboxes, setCheckedCheckboxes] = React.useState<Record<string, boolean>>({});

  // Load checkboxes from localStorage for this specific docFileName
  React.useEffect(() => {
    if (!docFileName) return;
    try {
      const storageKey = `cicod_crm_prd_checks_${docFileName}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setCheckedCheckboxes(parsed);
          return;
        }
      }
      setCheckedCheckboxes({});
    } catch (e) {
      console.warn("Could not load PRD checkboxes from localStorage:", e);
      setCheckedCheckboxes({});
    }
  }, [docFileName]);

  const toggleCheckbox = (itemKey: string, initialDefault = false) => {
    setCheckedCheckboxes((prev) => {
      const current = prev[itemKey] !== undefined ? prev[itemKey] : initialDefault;
      const next = { ...prev, [itemKey]: !current };
      try {
        const storageKey = `cicod_crm_prd_checks_${docFileName}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save PRD checkboxes to localStorage:", e);
      }
      toast.success(next[itemKey] ? "Criteria completed (saved to localStorage)" : "Criteria reopened (saved to localStorage)");
      return next;
    });
  };

  const resetDocCheckboxes = () => {
    setCheckedCheckboxes({});
    try {
      localStorage.removeItem(`cicod_crm_prd_checks_${docFileName}`);
    } catch {}
    toast.success("Reset all checkboxes for this PRD");
  };

  // Handle URL hash routing to smoothly scroll or activate specific sections
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("prd-section-")) {
        const secNum = parseInt(hash.replace("prd-section-", ""), 10);
        if (!isNaN(secNum) && secNum >= 1 && secNum <= 16) {
          setActiveSection(secNum);
          setTimeout(() => {
            document.getElementById(`prd-section-${secNum}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      } else if (hash === "testcases" || hash === "test-cases" || hash === "qa" || hash === "tests") {
        setActiveSection(16);
        setTimeout(() => {
          document.getElementById("prd-section-16")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleSectionClick = (num: number) => {
    setActiveSection(num);
    try {
      const url = new URL(window.location.href);
      url.hash = `prd-section-${num}`;
      window.history.replaceState(null, "", url.toString());
    } catch {}

    setTimeout(() => {
      const el = document.getElementById(`prd-section-${num}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const handleViewAll = () => {
    setActiveSection("all");
    try {
      const url = new URL(window.location.href);
      url.hash = "prd-all";
      window.history.replaceState(null, "", url.toString());
    } catch {}
  };

  React.useEffect(() => {
    let isMounted = true;
    if (PRD_EMBEDDED_DOCS[docFileName]) {
      setMarkdown(PRD_EMBEDDED_DOCS[docFileName]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/prds/${docFileName}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load PRD file (HTTP ${res.status})`);
        }
        return res.text();
      })
      .then((text) => {
        if (isMounted) {
          setMarkdown(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [docFileName]);

  // Compute total and completed PRD criteria checkboxes
  const { totalPrdCheckboxes, completedPrdCheckboxes } = React.useMemo(() => {
    if (!markdown) return { totalPrdCheckboxes: 0, completedPrdCheckboxes: 0 };
    const lines = markdown.split("\n");
    let total = 0;
    let completed = 0;
    let currentSec = 0;

    lines.forEach((line, idx) => {
      const secMatch = line.match(/^###\s+(\d+)\./);
      if (secMatch) currentSec = parseInt(secMatch[1], 10);

      const chkMatch = line.match(/^(\s*-\s*\[)([ xX])\]\s*(.*)$/);
      if (chkMatch) {
        total++;
        const initialDefault = chkMatch[2].toLowerCase() === "x";
        const text = chkMatch[3];
        const itemKey = `sec${currentSec}_line${idx}_${text.trim().replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}`;
        const isChecked = checkedCheckboxes[itemKey] !== undefined ? checkedCheckboxes[itemKey] : initialDefault;
        if (isChecked) completed++;
      }
    });

    return { totalPrdCheckboxes: total, completedPrdCheckboxes: completed };
  }, [markdown, checkedCheckboxes]);

  const handleCopyMarkdown = () => {
    if (!markdown) return;

    // Substitute current checked checkboxes into the copied markdown
    const lines = markdown.split("\n");
    let currentSec = 0;
    const updatedLines = lines.map((line, idx) => {
      const secMatch = line.match(/^###\s+(\d+)\./);
      if (secMatch) {
        currentSec = parseInt(secMatch[1], 10);
      }
      const chkMatch = line.match(/^(\s*-\s*\[)([ xX])(\]\s*)(.*)$/);
      if (chkMatch) {
        const text = chkMatch[4];
        const itemKey = `sec${currentSec}_line${idx}_${text.trim().replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}`;
        const initialDefault = chkMatch[2].toLowerCase() === "x";
        const isChecked = checkedCheckboxes[itemKey] !== undefined ? checkedCheckboxes[itemKey] : initialDefault;
        if (isChecked) {
          return `${chkMatch[1]}x${chkMatch[3]}${text}`;
        } else {
          return `${chkMatch[1]} ${chkMatch[3]}${text}`;
        }
      }
      return line;
    });

    const finalMarkdown = updatedLines.join("\n");
    navigator.clipboard.writeText(finalMarkdown);
    setCopied(true);
    toast.success(`Copied Sprint ${sprintNum} PRD to clipboard with your saved criteria!`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse markdown dynamically into distinct sections based on headers "### X. "
  const parsedSections = React.useMemo<ParsedSection[]>(() => {
    if (!markdown) return [];
    const list: ParsedSection[] = [];

    // Match all headers of pattern: ### N. Title
    const headerRegex = /###\s+(\d+)\.\s+([^\n]+)/g;
    const matches: { num: number; title: string; index: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = headerRegex.exec(markdown)) !== null) {
      matches.push({
        num: parseInt(m[1], 10),
        title: m[2].trim(),
        index: m.index
      });
    }

    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const startIndex = cur.index;
      const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : markdown.length;
      const rawText = markdown.slice(startIndex, endIndex).trim();
      list.push({ num: cur.num, title: cur.title, rawText });
    }

    return list;
  }, [markdown]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 border border-[var(--border)] rounded-2xl bg-[var(--card)] text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <p className="text-[0.9rem] font-medium text-[var(--muted-foreground)] m-0">
          Loading 15-Section PRD Specification for Sprint {sprintNum}...
        </p>
      </div>
    );
  }

  if (error || !markdown) {
    return (
      <div className="p-8 border border-red-500/20 rounded-2xl bg-red-500/5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
          <AlertTriangle className="w-5 h-5" />
          <span>Error loading {docFileName}</span>
        </div>
        <p className="text-[0.85rem] text-[var(--muted-foreground)] m-0">
          {error || "PRD document not found. Ensure public/prds directory contains the file."}
        </p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <a
            href={`/prds/${docFileName}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[0.85rem] font-semibold text-[var(--primary)] hover:underline"
          >
            Direct File Link <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  const sectionsToRender = activeSection === "all"
    ? parsedSections
    : parsedSections.filter((s) => s.num === activeSection);

  return (
    <div className="flex flex-col gap-5">
      {/* Top PRD Document Header Ribbon */}
      <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md text-[0.72rem] font-extrabold uppercase tracking-wider bg-[var(--primary)] text-[var(--primary-foreground)]">
              Sprint {sprintNum} PRD
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[0.72rem] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              16 Sections Verified
            </span>
            <button
              type="button"
              onClick={() => {
                if (onOpenTestCases) {
                  onOpenTestCases();
                } else {
                  setActiveSection(16);
                }
              }}
              className="px-2.5 py-0.5 rounded-md text-[0.72rem] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Jump to Section 16 QA & PM Test Scenarios"
            >
              <FlaskConical className="w-3 h-3 text-purple-500" />
              {(SPRINT_TEST_CASES[sprintNum] || []).length} QA Scenarios
            </button>
            {totalPrdCheckboxes > 0 && (
              <span className="px-2.5 py-0.5 rounded-md text-[0.72rem] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                {completedPrdCheckboxes} / {totalPrdCheckboxes} Criteria Checked (Saved to LocalStorage)
              </span>
            )}
            <span className="text-[0.78rem] font-mono text-[var(--muted-foreground)]">
              {docFileName}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-heading font-extrabold text-[var(--foreground)] m-0">
            {sprintTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode switch */}
          <div className="p-1 rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("interactive")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[0.75rem] font-bold transition-colors flex items-center gap-1.5",
                viewMode === "interactive"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--primary)]" /> Formatted View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[0.75rem] font-bold transition-colors flex items-center gap-1.5",
                viewMode === "raw"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Code2 className="w-3.5 h-3.5 text-[var(--primary)]" /> Raw Markdown
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]/10 text-[0.8rem] font-bold text-[var(--foreground)] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--primary)]" />}
            {copied ? "Copied" : "Copy .md"}
          </button>

          {completedPrdCheckboxes > 0 && (
            <button
              type="button"
              onClick={resetDocCheckboxes}
              title="Reset all criteria checkboxes for this document"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:text-[var(--destructive)] text-[0.76rem] font-semibold text-[var(--muted-foreground)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset Checks
            </button>
          )}

          <a
            href={`/prds/${docFileName}`}
            download={docFileName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]/10 text-[0.8rem] font-bold text-[var(--foreground)] transition-colors no-underline"
          >
            <Download className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            Download
          </a>
        </div>
      </div>

      {/* 16-Section Quick Navigation Bar */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2,var(--background))] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.75rem] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-[var(--primary)]" />
            Standard 16-Section Table of Contents
          </span>
          <button
            type="button"
            onClick={handleViewAll}
            className={cn(
              "text-[0.75rem] font-bold px-2.5 py-1 rounded-md transition-colors",
              activeSection === "all"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/20"
            )}
          >
            View All 16 Sections
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto py-1">
          {SECTION_HEADERS_CONFIG.map((cfg) => {
            const isSelected = activeSection === cfg.num;
            const isQA = cfg.num === 16;
            return (
              <button
                key={cfg.num}
                type="button"
                onClick={() => handleSectionClick(cfg.num)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[0.74rem] font-bold transition-all flex items-center gap-1.5 border cursor-pointer",
                  isSelected
                    ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] border-transparent shadow-xs"
                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)]"
                )}
                title={`Jump to Section ${cfg.num}: ${cfg.title}`}
              >
                <span className="w-4 h-4 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-[0.65rem] flex items-center justify-center font-extrabold">
                  {cfg.num}
                </span>
                <span>{cfg.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main PRD Content Body */}
      {viewMode === "raw" ? (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[#0B132B] text-slate-100 font-mono text-[0.82rem] leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
          {markdown}
        </div>
      ) : activeSection === 16 ? (
        <div id="prd-section-16" className="scroll-mt-24 flex flex-col gap-4">
          <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-5 h-5 text-purple-500" />
              <div>
                <h4 className="font-heading font-extrabold text-[1.05rem] text-[var(--foreground)] m-0">
                  Section 16: Acceptance Test Cases & Use Case Scenarios
                </h4>
                <p className="text-[0.82rem] text-[var(--muted-foreground)] m-0">
                  Dedicated test matrix for Product Managers and QA Engineers to validate Sprint {sprintNum} deliverables.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleViewAll}
              className="text-[0.75rem] font-bold text-[var(--primary)] hover:underline"
            >
              Back to All Sections
            </button>
          </div>
          <TestCasesViewer
            sprintNum={sprintNum}
            sprintTitle={sprintTitle}
            testCases={SPRINT_TEST_CASES[sprintNum] || []}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {sectionsToRender.map((sec) => (
            <SectionCard
              key={sec.num}
              section={sec}
              docFileName={docFileName}
              checkedCheckboxes={checkedCheckboxes}
              onToggleCheckbox={toggleCheckbox}
            />
          ))}

          {/* If viewing all sections, render Section 16 at the bottom */}
          {activeSection === "all" && (
            <div id="prd-section-16" className="scroll-mt-24 p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-[0.85rem] shrink-0">
                    16
                  </div>
                  <div>
                    <h4 className="text-[1rem] font-heading font-extrabold text-[var(--foreground)] m-0 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-purple-500" />
                      Section 16: Test Cases, Use Cases & QA Acceptance Scenarios
                    </h4>
                    <span className="text-[0.72rem] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Validation Suite for PMs & QA · {(SPRINT_TEST_CASES[sprintNum] || []).length} Scenarios Defined
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSectionClick(16)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[0.75rem] font-bold shadow-xs hover:bg-purple-700 transition-colors"
                >
                  Focus QA Matrix
                </button>
              </div>

              <TestCasesViewer
                sprintNum={sprintNum}
                sprintTitle={sprintTitle}
                testCases={SPRINT_TEST_CASES[sprintNum] || []}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  docFileName,
  checkedCheckboxes,
  onToggleCheckbox
}: {
  section: ParsedSection;
  docFileName: string;
  checkedCheckboxes: Record<string, boolean>;
  onToggleCheckbox: (key: string) => void;
}) {
  const [collapsed, setCollapsed] = React.useState<boolean>(false);

  // Extract body lines (exclude the header itself)
  const lines = section.rawText.split("\n");
  const bodyContent = lines.slice(1).join("\n").trim();

  return (
    <div
      id={`prd-section-${section.num}`}
      className="scroll-mt-24 p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs transition-shadow hover:shadow-sm flex flex-col gap-4"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-extrabold text-[0.85rem] shrink-0">
            {section.num}
          </div>
          <div>
            <h4 className="text-[1rem] font-heading font-extrabold text-[var(--foreground)] m-0">
              {section.title}
            </h4>
            <span className="text-[0.72rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              PRD Header {section.num} of 15 · Standard Enterprise Architecture
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background)] text-[var(--muted-foreground)] text-[0.75rem] font-semibold"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {/* Section Content */}
      {!collapsed && (
        <div className="prose prose-sm max-w-none text-[var(--foreground)] leading-relaxed flex flex-col gap-3">
          <RenderFormattedMarkdown
            content={bodyContent}
            sectionNum={section.num}
            docFileName={docFileName}
            checkedCheckboxes={checkedCheckboxes}
            onToggleCheckbox={onToggleCheckbox}
          />
        </div>
      )}
    </div>
  );
}

function RenderFormattedMarkdown({
  content,
  sectionNum,
  docFileName,
  checkedCheckboxes,
  onToggleCheckbox
}: {
  content: string;
  sectionNum: number;
  docFileName: string;
  checkedCheckboxes: Record<string, boolean>;
  onToggleCheckbox: (key: string, initialDefault?: boolean) => void;
}) {
  const parts: React.ReactNode[] = [];
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBuffer: string[] = [];
  let tableBuffer: string[] = [];

  const flushTable = (key: number) => {
    if (tableBuffer.length === 0) return null;
    const rows = tableBuffer.filter((l) => !l.match(/^\|?\s*[-:]+[-| :]*$/));
    const headerRow = rows[0]?.split("|").map((c) => c.trim()).filter(Boolean);
    const bodyRows = rows.slice(1).map((r) => r.split("|").map((c) => c.trim()).filter(Boolean));

    tableBuffer = [];
    return (
      <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-[0.82rem]">
          {headerRow && (
            <thead className="bg-[var(--background)] border-b border-[var(--border)] text-[0.72rem] font-heading font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              <tr>
                {headerRow.map((h, i) => (
                  <th key={i} className="py-2.5 px-3.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
            {bodyRows.map((cols, rIdx) => (
              <tr key={rIdx} className="hover:bg-[var(--background)]/50 transition-colors">
                {cols.map((col, cIdx) => (
                  <td key={cIdx} className="py-2.5 px-3.5 text-[var(--foreground)] font-medium">
                    {col.startsWith("`") && col.endsWith("`") ? (
                      <code className="px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] font-mono text-[0.75rem]">
                        {col.slice(1, -1)}
                      </code>
                    ) : (
                      col
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const flushCode = (key: number) => {
    const code = codeBuffer.join("\n");
    const lang = codeBlockLang;
    codeBuffer = [];
    codeBlockLang = "";

    return (
      <div key={`code-${key}`} className="my-3 rounded-xl border border-[var(--border)] bg-[#0C1322] text-slate-100 overflow-hidden font-mono text-[0.8rem]">
        <div className="px-3.5 py-1.5 border-b border-slate-800 bg-[#080D1A] flex items-center justify-between text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider">
          <span>{lang || "Code"}</span>
          <span className="text-[0.65rem]">UTF-8</span>
        </div>
        <pre className="p-4 m-0 overflow-x-auto leading-relaxed">{code}</pre>
      </div>
    );
  };

  lines.forEach((line, idx) => {
    // Code block delimiters
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        parts.push(flushCode(idx));
        inCodeBlock = false;
      } else {
        if (tableBuffer.length > 0) parts.push(flushTable(idx));
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Markdown Table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      tableBuffer.push(line);
      return;
    } else if (tableBuffer.length > 0) {
      parts.push(flushTable(idx));
    }

    // Headings
    if (line.startsWith("#### ")) {
      parts.push(
        <h5 key={idx} className="text-[0.92rem] font-heading font-extrabold text-[var(--foreground)] mt-3 mb-1">
          {line.replace("#### ", "")}
        </h5>
      );
      return;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      parts.push(<hr key={idx} className="my-3 border-[var(--border)]" />);
      return;
    }

    // Interactive Checkboxes [ ] or [x] with LocalStorage caching
    if (line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/)) {
      const match = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
      if (match) {
        const initialChecked = match[2].toLowerCase() === "x";
        const text = match[3];
        const itemKey = `sec${sectionNum}_line${idx}_${text.trim().replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}`;
        const isChecked = checkedCheckboxes[itemKey] !== undefined ? checkedCheckboxes[itemKey] : initialChecked;

        parts.push(
          <div
            key={idx}
            onClick={() => onToggleCheckbox(itemKey, initialChecked)}
            className={cn(
              "flex items-start gap-2.5 text-[0.83rem] my-1.5 p-3 rounded-xl border transition-all cursor-pointer select-none",
              isChecked
                ? "bg-emerald-500/10 border-emerald-500/30 text-[var(--foreground)]"
                : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50"
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCheckbox(itemKey, initialChecked);
              }}
              className="mt-0.5 text-[var(--primary)] shrink-0 focus:outline-none"
              aria-label={isChecked ? "Uncheck item" : "Check item"}
            >
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-[var(--muted-foreground)]" />
              )}
            </button>
            <span className={cn("leading-relaxed flex-1 font-medium", isChecked && "line-through text-[var(--muted-foreground)]")}>
              {parseInlineTokens(text)}
            </span>
            {isChecked && (
              <span className="text-[0.68rem] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                ✓ Done (Cached)
              </span>
            )}
          </div>
        );
        return;
      }
    }

    // Bullet points
    if (line.match(/^(\s*)-\s+(.*)$/)) {
      const match = line.match(/^(\s*)-\s+(.*)$/);
      if (match) {
        const text = match[2];
        parts.push(
          <div key={idx} className="flex items-start gap-2 text-[0.84rem] my-0.5">
            <span className="text-[var(--primary)] font-bold shrink-0 mt-0.5">▸</span>
            <span className="leading-relaxed">{parseInlineTokens(text)}</span>
          </div>
        );
        return;
      }
    }

    // Numbered lists
    if (line.match(/^(\s*)\d+\.\s+(.*)$/)) {
      const match = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (match) {
        const num = match[2];
        const text = match[3];
        parts.push(
          <div key={idx} className="flex items-start gap-2 text-[0.84rem] my-0.5">
            <span className="font-extrabold text-[var(--primary)] shrink-0">{num}.</span>
            <span className="leading-relaxed">{parseInlineTokens(text)}</span>
          </div>
        );
        return;
      }
    }

    // Normal paragraph line
    if (line.trim().length > 0) {
      parts.push(
        <p key={idx} className="text-[0.85rem] text-[var(--foreground)] m-0 leading-relaxed">
          {parseInlineTokens(line)}
        </p>
      );
    }
  });

  if (tableBuffer.length > 0) {
    parts.push(flushTable(9999));
  }
  if (inCodeBlock && codeBuffer.length > 0) {
    parts.push(flushCode(99999));
  }

  return <>{parts}</>;
}

function parseInlineTokens(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-[var(--foreground)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] font-mono text-[0.76rem] text-[var(--primary)]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--primary)] font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
