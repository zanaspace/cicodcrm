"use client";

import * as React from "react";
import {
  FlaskConical, CheckCircle2, XCircle, Clock, ShieldCheck, AlertTriangle,
  Search, Filter, Copy, Check, RotateCcw, Download, Sparkles, ChevronDown,
  ChevronRight, Layers, UserCheck, Target, ArrowRight, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { TestCaseItem, TestCaseCategory, TestCaseSeverity, TestCaseStatus } from "../data/testCasesData";

export interface TestCasesViewerProps {
  sprintNum: number;
  sprintTitle: string;
  testCases: TestCaseItem[];
}

export function TestCasesViewer({ sprintNum, sprintTitle, testCases }: TestCasesViewerProps) {
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterSeverity, setFilterSeverity] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [expandedTestIds, setExpandedTestIds] = React.useState<Record<string, boolean>>({});
  const [copiedReport, setCopiedReport] = React.useState<boolean>(false);

  // LocalStorage-persisted test execution statuses: { [testId]: "Pass" | "Fail" | "Pending" }
  const [testStatuses, setTestStatuses] = React.useState<Record<string, TestCaseStatus>>({});

  // Load from localStorage for this specific sprint
  React.useEffect(() => {
    try {
      const storageKey = `cicod_crm_qa_tests_sprint_${sprintNum}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setTestStatuses(parsed);
          return;
        }
      }
      // Default to "Pending" or initial status
      const initial: Record<string, TestCaseStatus> = {};
      testCases.forEach((tc) => {
        initial[tc.id] = tc.status || "Pending";
      });
      setTestStatuses(initial);
    } catch {
      setTestStatuses({});
    }
  }, [sprintNum, testCases]);

  const setStatus = (testId: string, status: TestCaseStatus) => {
    setTestStatuses((prev) => {
      const next = { ...prev, [testId]: status };
      try {
        const storageKey = `cicod_crm_qa_tests_sprint_${sprintNum}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Could not save QA status to localStorage:", e);
      }

      if (status === "Pass") {
        toast.success(`Marked ${testId} as PASS (Saved to localStorage)`);
      } else if (status === "Fail") {
        toast.error(`Marked ${testId} as FAIL (Saved to localStorage)`);
      } else {
        toast.info(`Marked ${testId} as Pending`);
      }
      return next;
    });
  };

  const toggleExpand = (testId: string) => {
    setExpandedTestIds((prev) => ({ ...prev, [testId]: !prev[testId] }));
  };

  const resetAllStatuses = () => {
    const initial: Record<string, TestCaseStatus> = {};
    testCases.forEach((tc) => {
      initial[tc.id] = "Pending";
    });
    setTestStatuses(initial);
    try {
      localStorage.removeItem(`cicod_crm_qa_tests_sprint_${sprintNum}`);
    } catch {}
    toast.success(`Reset all ${testCases.length} test cases for Sprint ${sprintNum}`);
  };

  // Compute QA Metrics
  const totalCount = testCases.length;
  const passCount = testCases.filter((tc) => (testStatuses[tc.id] || tc.status) === "Pass").length;
  const failCount = testCases.filter((tc) => (testStatuses[tc.id] || tc.status) === "Fail").length;
  const pendingCount = totalCount - passCount - failCount;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  // Filter test cases
  const filteredCases = testCases.filter((tc) => {
    const currentStatus = testStatuses[tc.id] || tc.status || "Pending";
    const matchCategory = filterCategory === "all" || tc.category === filterCategory;
    const matchStatus = filterStatus === "all" || currentStatus === filterStatus;
    const matchSeverity = filterSeverity === "all" || tc.severity === filterSeverity;
    const matchSearch =
      searchQuery === "" ||
      tc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.targetPersona.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.userStoryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tc.expectedResult.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchStatus && matchSeverity && matchSearch;
  });

  const exportQAReport = () => {
    let report = `# QA Validation & Test Execution Sign-off Report\n`;
    report += `**Sprint ${sprintNum}:** ${sprintTitle}\n`;
    report += `**Execution Date:** ${new Date().toISOString().split("T")[0]}\n`;
    report += `**QA Pass Rate:** ${passRate}% (${passCount} Passed, ${failCount} Failed, ${pendingCount} Pending)\n\n`;
    report += `| Test ID | Category | Severity | User Story | Target Persona | Test Summary | QA Status |\n`;
    report += `|---|---|---|---|---|---|---|\n`;

    testCases.forEach((tc) => {
      const status = testStatuses[tc.id] || tc.status || "Pending";
      const icon = status === "Pass" ? "PASSED" : status === "Fail" ? "FAILED" : "PENDING";
      report += `| \`${tc.id}\` | ${tc.category} | ${tc.severity} | \`${tc.userStoryId}\` | ${tc.targetPersona} | ${tc.title} | **${icon}** |\n`;
    });

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    toast.success("Copied QA Validation Markdown Report to clipboard!");
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const categories: { id: string; label: string }[] = [
    { id: "all", label: "All Categories" },
    { id: "Happy Path", label: "Happy Path" },
    { id: "Edge Case", label: "Edge Case" },
    { id: "Security / RBAC", label: "Security & RBAC" },
    { id: "Performance & Scale", label: "Performance & Scale" },
    { id: "UX & A11y", label: "UX & A11y" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top QA Dashboard Summary Card */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[0.72rem] font-extrabold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              PM & QA Acceptance Harness
            </span>
            <span className="text-[0.78rem] text-[var(--muted-foreground)]">
              Sprint {sprintNum} · Verification Matrix
            </span>
          </div>
          <h3 className="text-xl font-heading font-extrabold text-[var(--foreground)] m-0">
            Implementation Validation & Use Case Scenarios
          </h3>
          <p className="text-[0.85rem] text-[var(--muted-foreground)] m-0 max-w-2xl leading-relaxed">
            Standardized functional test procedures, preconditions, and expected outcomes designed for Product Managers and QA Engineers to validate engineering deliverables before production release.
          </p>
        </div>

        {/* Metrics Ring / Progress Summary */}
        <div className="flex items-center gap-4 shrink-0 bg-[var(--background)] p-4 rounded-xl border border-[var(--border)]">
          <div className="flex flex-col items-center justify-center">
            <div className={cn(
              "text-2xl font-heading font-extrabold",
              passRate === 100 ? "text-emerald-500" : passRate > 50 ? "text-[var(--primary)]" : "text-[var(--foreground)]"
            )}>
              {passRate}%
            </div>
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              QA Ready
            </span>
          </div>

          <div className="w-[1px] h-10 bg-[var(--border)]" />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col">
              <span className="text-emerald-500 font-extrabold text-[0.95rem]">{passCount}</span>
              <span className="text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase">Passed</span>
            </div>
            <div className="flex flex-col">
              <span className="text-red-500 font-extrabold text-[0.95rem]">{failCount}</span>
              <span className="text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase">Failed</span>
            </div>
            <div className="flex flex-col">
              <span className="text-amber-500 font-extrabold text-[0.95rem]">{pendingCount}</span>
              <span className="text-[0.65rem] font-bold text-[var(--muted-foreground)] uppercase">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Export */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto py-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[0.76rem] font-bold transition-all whitespace-nowrap",
                  filterCategory === cat.id
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
                    : "bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportQAReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]/10 text-[0.78rem] font-bold text-[var(--foreground)] transition-colors"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--primary)]" />}
              <span>{copiedReport ? "Copied Report" : "Copy QA Report"}</span>
            </button>

            <button
              type="button"
              onClick={resetAllStatuses}
              title="Reset all test statuses to baseline pending state"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:text-[var(--destructive)] text-[0.76rem] font-semibold text-[var(--muted-foreground)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[0.72rem] font-bold text-[var(--muted-foreground)] uppercase">Status:</span>
              <div className="flex gap-1">
                {["all", "Pass", "Fail", "Pending"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[0.72rem] font-bold transition-colors",
                      filterStatus === st
                        ? "bg-[var(--secondary)] text-[var(--secondary-foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {st === "all" ? "All" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[0.72rem] font-bold text-[var(--muted-foreground)] uppercase">Severity:</span>
              <div className="flex gap-1">
                {["all", "Critical", "High", "Medium"].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFilterSeverity(sev)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[0.72rem] font-bold transition-colors",
                      filterSeverity === sev
                        ? "bg-[var(--secondary)] text-[var(--secondary-foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {sev === "all" ? "All" : sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder="Search tests, steps, expected..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[0.8rem] w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* Test Scenarios List */}
      <div className="flex flex-col gap-4">
        {filteredCases.length === 0 ? (
          <div className="p-12 text-center text-[0.88rem] text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-2xl bg-[var(--card)]">
            No test cases matching the active filters or search query.
          </div>
        ) : (
          filteredCases.map((tc) => {
            const currentStatus = testStatuses[tc.id] || tc.status || "Pending";
            const isExpanded = expandedTestIds[tc.id] !== false; // default open

            return (
              <div
                key={tc.id}
                className={cn(
                  "rounded-2xl border transition-all bg-[var(--card)] overflow-hidden shadow-xs",
                  currentStatus === "Pass"
                    ? "border-emerald-500/30 ring-1 ring-emerald-500/10"
                    : currentStatus === "Fail"
                    ? "border-red-500/30 ring-1 ring-red-500/10"
                    : "border-[var(--border)] hover:border-[var(--primary)]/40"
                )}
              >
                {/* Header Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--card)]">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleExpand(tc.id)}
                      className="mt-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0"
                      title={isExpanded ? "Collapse test details" : "Expand test details"}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-[0.78rem] px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]">
                          {tc.id}
                        </span>

                        <span className={cn(
                          "px-2 py-0.5 rounded text-[0.68rem] font-bold uppercase tracking-wider",
                          tc.severity === "Critical"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            : tc.severity === "High"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        )}>
                          {tc.severity}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[0.68rem] font-bold bg-[var(--accent)] text-[var(--accent-foreground)]">
                          {tc.category}
                        </span>

                        <span className="font-mono text-[0.68rem] text-[var(--muted-foreground)]">
                          Link: {tc.userStoryId}
                        </span>

                        <span className="text-[0.72rem] text-[var(--muted-foreground)] flex items-center gap-1 ml-auto md:ml-0">
                          <UserCheck className="w-3 h-3 text-[var(--primary)]" />
                          <span className="font-medium">{tc.targetPersona}</span>
                        </span>
                      </div>

                      <h4 className="text-[0.95rem] font-heading font-extrabold text-[var(--foreground)] m-0 mt-0.5">
                        {tc.title}
                      </h4>
                    </div>
                  </div>

                  {/* Execution Status Controller */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => setStatus(tc.id, "Pass")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] font-extrabold transition-all border",
                        currentStatus === "Pass"
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                          : "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-emerald-500 hover:border-emerald-500/50"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pass</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(tc.id, "Fail")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] font-extrabold transition-all border",
                        currentStatus === "Fail"
                          ? "bg-red-500 text-white border-red-600 shadow-sm"
                          : "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-red-500 hover:border-red-500/50"
                      )}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Fail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus(tc.id, "Pending")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.78rem] font-semibold transition-all border",
                        currentStatus === "Pending"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-amber-500"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Test Details Body */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-[var(--border)] bg-[var(--surface-2,var(--background))]/50 flex flex-col gap-4 text-[0.84rem]">
                    {/* Preconditions */}
                    <div className="mt-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] flex flex-col gap-1">
                      <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Execution Preconditions
                      </span>
                      <p className="text-[0.82rem] text-[var(--foreground)] m-0 leading-relaxed font-medium">
                        {tc.preconditions}
                      </p>
                    </div>

                    {/* Step-by-Step Test Execution Procedure */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Step-by-Step Test Procedure
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {tc.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[0.83rem] text-[var(--foreground)] font-mono flex items-start gap-2.5"
                          >
                            <span className="text-[var(--primary)] font-bold">{sIdx + 1}.</span>
                            <span className="flex-1 font-sans">{step.replace(/^\d+\.\s*/, "")}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expected Outcome & Acceptance Criteria */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-1">
                      <span className="text-[0.72rem] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Expected Result & Acceptance Standard
                      </span>
                      <p className="text-[0.83rem] text-[var(--foreground)] m-0 leading-relaxed font-medium">
                        {tc.expectedResult}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
