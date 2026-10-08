"use client";

import * as React from "react";
import { Check, AlertTriangle, Circle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/format";
import {
  CURRENCIES, PERIODS, PERIOD_LABEL, BILLING_MODEL_LABEL, unitLabel,
  type BillingModel, type Currency, type Period, type Price,
} from "@/lib/mock/catalogue";

export const inputClass =
  "w-full h-10 px-3 rounded-md border-[1.5px] border-[var(--input)] bg-[var(--background)] text-[0.9rem] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-60";

/* ---------------- Stepper ---------------- */

export function Stepper({ steps, current, maxReached, onGo }: { steps: string[]; current: number; maxReached: number; onGo: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm px-5 py-4">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const reachable = i <= maxReached;
        return (
          <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onGo(i)}
              aria-current={state === "current" ? "step" : undefined}
              className="flex items-center gap-2.5 disabled:cursor-not-allowed group"
            >
              <span className={cn(
                "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[0.75rem] font-bold transition-colors",
                state === "done" && "bg-[var(--primary)] text-[var(--primary-foreground)]",
                state === "current" && "border-2 border-[var(--primary)] text-[var(--primary)]",
                state === "todo" && "bg-[var(--muted)] text-[var(--muted-foreground)]",
              )}>
                {state === "done" ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span className={cn("text-[0.85rem] font-heading font-semibold whitespace-nowrap", state === "todo" ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]", reachable && "group-hover:text-[var(--primary)]")}>
                {label}
              </span>
            </button>
            {i < steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full min-w-6", i < current ? "bg-[var(--primary)]" : "bg-[var(--muted)]")} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Layout pieces ---------------- */

export function Card({ title, icon: Icon, actions, children, className }: { title: string; icon?: React.ElementType; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm", className)}>
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background)] rounded-t-[11px] flex items-center justify-between gap-4">
        <h3 className="text-[0.95rem] font-heading font-bold m-0 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[var(--primary)]" />} {title}
        </h3>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function Field({ label, required, error, hint, children, className, group }: { label: string; required?: boolean; error?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string; /** Use for radio/chip groups: a <label> would forward clicks to the first option. */ group?: boolean }) {
  const Wrapper = group ? "div" : "label";
  return (
    <Wrapper role={group ? "group" : undefined} aria-label={group ? label : undefined} className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[0.85rem] font-bold text-[var(--foreground)]">{label}{required && <span className="text-[var(--destructive)]"> *</span>}</span>
      {children}
      {error ? <span role="alert" className="text-[0.78rem] text-[var(--destructive)]">{error}</span> : hint ? <span className="text-[0.78rem] text-[var(--muted-foreground)]">{hint}</span> : null}
    </Wrapper>
  );
}

/** Style guide §10 switch row: title + description + switch. */
export function SwitchRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6 p-4 rounded-lg border border-[var(--border)]">
      <div>
        <div className="font-heading font-bold text-[0.95rem]">{title}</div>
        <div className="text-[0.8rem] text-[var(--muted-foreground)]">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn("relative w-11 h-6 shrink-0 rounded-full transition-colors", checked ? "bg-[var(--primary)]" : "bg-[var(--input)]")}
      >
        <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}

export function BillingModelPicker({ value, onChange, disabled }: { value: BillingModel; onChange: (v: BillingModel) => void; disabled?: boolean }) {
  const hints: Record<BillingModel, string> = {
    PER_USER: "Price × number of users",
    PER_TRANSACTION: "Charged on each transaction",
    PERIODIC: "One flat fee per period",
  };
  return (
    <div role="radiogroup" className="grid grid-cols-3 gap-3">
      {(Object.keys(BILLING_MODEL_LABEL) as BillingModel[]).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={value === m} disabled={disabled} onClick={() => onChange(m)}
          className={cn("text-left p-4 rounded-xl border-[1.5px] transition-colors disabled:opacity-60", value === m ? "border-[var(--primary)] bg-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--primary)]/50")}>
          <div className="font-heading font-bold text-[0.9rem]">{BILLING_MODEL_LABEL[m]}</div>
          <div className="text-[0.78rem] text-[var(--muted-foreground)] mt-0.5">{hints[m]}</div>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Pricing matrix ---------------- */

const amountOf = (prices: Price[], c: Currency, p: Period) => prices.find((x) => x.currency === c && x.period === p)?.amount;

export function PricingMatrix({ prices, onChange, model }: { prices: Price[]; onChange: (p: Price[]) => void; model: BillingModel }) {
  const set = (c: Currency, p: Period, raw: string) => {
    const amount = raw === "" ? undefined : Math.max(0, Number(raw.replace(/,/g, "")));
    const rest = prices.filter((x) => !(x.currency === c && x.period === p));
    onChange(amount === undefined || Number.isNaN(amount) ? rest : [...rest, { currency: c, period: p, amount }]);
  };

  const fillAnnual = () => {
    let next = [...prices];
    for (const c of CURRENCIES) {
      const m = amountOf(prices, c, "MONTHLY");
      if (m && !amountOf(prices, c, "ANNUALLY")) next = [...next, { currency: c, period: "ANNUALLY", amount: m * 10 }];
    }
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <table className="w-full text-[0.9rem]">
          <thead className="bg-[var(--background)]">
            <tr>
              <th className="h-11 px-4 text-left font-heading text-[0.75rem] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Currency</th>
              {PERIODS.map((p) => (
                <th key={p} className="h-11 px-4 text-left font-heading text-[0.75rem] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  {PERIOD_LABEL[p]} <span className="normal-case font-normal">({unitLabel(model) || "flat"}/{p === "MONTHLY" ? "mo" : "yr"})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CURRENCIES.map((c) => {
              const row = PERIODS.map((p) => amountOf(prices, c, p));
              const partial = row.some((v) => v) && row.some((v) => !v);
              return (
                <tr key={c} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    {c}{c === "NGN" && <span className="text-[var(--destructive)]"> *</span>}
                    {partial && <AlertTriangle className="inline w-3.5 h-3.5 ml-2 text-[var(--warning)]" aria-label="Missing one period" />}
                  </td>
                  {PERIODS.map((p, i) => (
                    <td key={p} className="px-4 py-2">
                      <div className={cn("flex items-center rounded-md border-[1.5px] bg-[var(--background)] focus-within:border-[var(--ring)]", partial && !row[i] ? "border-[var(--warning)]" : "border-[var(--input)]")}>
                        <span className="pl-3 text-[var(--muted-foreground)]">{CURRENCY_SYMBOL[c]}</span>
                        <input
                          inputMode="decimal"
                          aria-label={`${c} ${PERIOD_LABEL[p]} price`}
                          value={row[i] ?? ""}
                          onChange={(e) => set(c, p, e.target.value)}
                          placeholder="Not offered"
                          className="w-full h-9 px-2 bg-transparent font-mono text-[0.9rem] focus:outline-none placeholder:font-sans placeholder:text-[var(--muted-foreground)]/70"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={fillAnnual} className="self-start inline-flex items-center gap-2 text-[0.85rem] font-semibold text-[var(--primary)] hover:text-[var(--accent-foreground)]">
        <Wand2 className="w-4 h-4" /> Fill empty annual prices at 10× monthly (2 months free)
      </button>
    </div>
  );
}

/* ---------------- Live preview & readiness ---------------- */

export function OfferPreview({ eyebrow, name, prices, model, features, trialDays, recommended, currency = "NGN" }: {
  eyebrow: string; name: string; prices: Price[]; model: BillingModel; features: string[]; trialDays: number; recommended: boolean; currency?: Currency;
}) {
  const monthly = amountOf(prices, currency, "MONTHLY");
  const annual = amountOf(prices, currency, "ANNUALLY");
  const saving = monthly && annual ? Math.round((1 - annual / (monthly * 12)) * 100) : 0;
  return (
    <div className={cn("rounded-2xl border-[1.5px] p-6 bg-[var(--card)] relative", recommended ? "border-[var(--primary)] shadow-[0_8px_24px_rgba(242,169,59,0.18)]" : "border-[var(--border)]")}>
      {recommended && <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[0.7rem] font-bold uppercase tracking-wide">Recommended</span>}
      <div className="text-[0.75rem] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{eyebrow}</div>
      <div className="font-heading font-extrabold text-[1.3rem] mt-1">{name || "Plan name"}</div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-heading font-extrabold text-[1.8rem]">{monthly ? formatMoney(monthly, currency) : "—"}</span>
        <span className="text-[0.85rem] text-[var(--muted-foreground)]">{unitLabel(model)}/month</span>
      </div>
      <div className="text-[0.8rem] text-[var(--muted-foreground)] min-h-5">
        {annual ? <>or {formatMoney(annual, currency)}{unitLabel(model)}/year{saving > 0 && <span className="text-[var(--success)] font-semibold"> · save {saving}%</span>}</> : "Monthly billing only"}
      </div>
      <ul className="mt-5 flex flex-col gap-2 text-[0.85rem]">
        {features.length === 0 && <li className="text-[var(--muted-foreground)]">No features selected yet</li>}
        {features.map((f) => <li key={f} className="flex gap-2"><Check className="w-4 h-4 shrink-0 text-[var(--success)]" />{f}</li>)}
      </ul>
      <div className="mt-6 h-10 rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)] flex items-center justify-center font-heading font-semibold text-[0.9rem]">
        {trialDays > 0 ? `Start ${trialDays}-day free trial` : "Subscribe"}
      </div>
    </div>
  );
}

export type ReadinessCheck = { label: string; ok: boolean; warn?: boolean };

export function Readiness({ checks }: { checks: ReadinessCheck[] }) {
  const blocking = checks.filter((c) => !c.ok && !c.warn).length;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading font-bold text-[0.9rem]">Ready to publish</span>
        <span className={cn("text-[0.75rem] font-bold", blocking ? "text-[var(--muted-foreground)]" : "text-[var(--success)]")}>{blocking ? `${blocking} to fix` : "All set"}</span>
      </div>
      <ul className="flex flex-col gap-2 text-[0.85rem]">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            {c.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--success)]" /> : c.warn ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--warning)]" /> : <Circle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--muted-foreground)]" />}
            <span className={c.ok ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PriceSummary({ prices, model }: { prices: Price[]; model: BillingModel }) {
  if (prices.length === 0) return <span className="text-[var(--muted-foreground)]">No prices yet</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {CURRENCIES.flatMap((c) => PERIODS.map((p) => ({ c, p, a: amountOf(prices, c, p) }))).filter((x) => x.a).map((x) => (
        <span key={`${x.c}${x.p}`} className="px-2.5 py-1 rounded-md bg-[var(--background)] border border-[var(--border)] text-[0.8rem] font-mono">
          {formatMoney(x.a!, x.c)}{unitLabel(model)}/{x.p === "MONTHLY" ? "mo" : "yr"}
        </span>
      ))}
    </div>
  );
}
