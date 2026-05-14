"use client";

import { useState } from "react";
import { checkConflicts } from "@/lib/conflictChecker";
import type { NewClientInput, ConflictResult, Match } from "@/lib/conflictChecker";
import type { CaseType, PartyRole } from "@/lib/clientDatabase";
import { clients } from "@/lib/clientDatabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const CASE_TYPES: CaseType[] = ["Bankruptcy", "PersonalInjury", "Immigration"];

const PARTY_ROLES: PartyRole[] = [
  "Opposing Counsel",
  "Adverse Party",
  "Co-Defendant",
  "Spouse",
  "Business Partner",
  "Employer",
];

// Three presets that exercise all three result states against the live database
const PRESETS = [
  {
    label: "Clear",
    variant: "clear" as const,
    description: "No known conflicts",
    value: {
      name: "Diana Nguyen",
      caseType: "PersonalInjury" as CaseType,
      relatedParties: [
        { name: "Metro Transit Authority", role: "Adverse Party" as PartyRole },
      ],
    },
  },
  {
    label: "Warning",
    variant: "warning" as const,
    description: "Matches a closed case",
    value: {
      name: "Patricia Sundberg",
      caseType: "Immigration" as CaseType,
      relatedParties: [],
    },
  },
  {
    label: "Conflict",
    variant: "conflict" as const,
    description: "Adverse to active client",
    value: {
      name: "Robert Chen",
      caseType: "PersonalInjury" as CaseType,
      relatedParties: [
        { name: "Hector Fuentes", role: "Adverse Party" as PartyRole },
      ],
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCaseType(ct: CaseType) {
  return ct === "PersonalInjury" ? "Personal Injury" : ct;
}

function formatMatchType(mt: Match["matchType"]) {
  const labels: Record<Match["matchType"], string> = {
    direct_name: "Direct Name",
    adverse_party: "Adverse Party",
    related_party: "Related Party",
  };
  return labels[mt];
}

const STATUS_CONFIG = {
  clear: {
    badge: "bg-emerald-100 text-emerald-800",
    headerBg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Clear",
    summary:
      "No conflicts identified. This client may be safely onboarded pending standard due diligence.",
  },
  warning: {
    badge: "bg-amber-100 text-amber-800",
    headerBg: "bg-amber-50",
    border: "border-amber-200",
    label: "Warning",
    summary:
      "Potential issues detected. Attorney review is recommended before proceeding.",
  },
  conflict: {
    badge: "bg-red-100 text-red-800",
    headerBg: "bg-red-50",
    border: "border-red-200",
    label: "Conflict",
    summary:
      "One or more conflicts identified. Do not onboard without resolving conflicts and obtaining informed written consent.",
  },
};

const PRESET_STYLES = {
  clear: {
    base: "border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50",
    active: "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300",
  },
  warning: {
    base: "border-amber-200 text-amber-700 bg-white hover:bg-amber-50",
    active: "border-amber-400 bg-amber-50 ring-1 ring-amber-300",
  },
  conflict: {
    base: "border-red-200 text-red-700 bg-white hover:bg-red-50",
    active: "border-red-400 bg-red-50 ring-1 ring-red-300",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartyRow {
  id: number;
  name: string;
  role: PartyRole;
}

let nextId = 0;
const makeParty = (): PartyRow => ({ id: nextId++, name: "", role: "Adverse Party" });

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [clientName, setClientName] = useState("");
  const [caseType, setCaseType] = useState<CaseType>("Bankruptcy");
  const [parties, setParties] = useState<PartyRow[]>([makeParty()]);
  const [result, setResult] = useState<ConflictResult | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setClientName(preset.value.name);
    setCaseType(preset.value.caseType);
    setParties(
      preset.value.relatedParties.length > 0
        ? preset.value.relatedParties.map((p) => ({ ...p, id: nextId++ }))
        : [makeParty()]
    );
    setResult(null);
    setActivePreset(preset.label);
  }

  function addParty() {
    setParties((prev) => [...prev, makeParty()]);
  }

  function removeParty(id: number) {
    setParties((prev) => prev.filter((p) => p.id !== id));
  }

  function updateParty(id: number, field: keyof Omit<PartyRow, "id">, value: string) {
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function handleFieldChange(fn: () => void) {
    setActivePreset(null);
    fn();
  }

  function runCheck() {
    const input: NewClientInput = {
      name: clientName.trim(),
      caseType,
      relatedParties: parties
        .filter((p) => p.name.trim())
        .map((p) => ({ name: p.name.trim(), role: p.role })),
    };
    setResult(checkConflicts(input, clients));
  }

  const cfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-slate-800 inline-block" />
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
            Conflict Checker
          </h1>
          <span className="text-slate-300 text-sm">·</span>
          <span className="text-xs text-slate-400">Prototype for Glade.ai</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* ── Info banner ── */}
        <div className="rounded-lg bg-slate-100 border border-slate-200 px-5 py-3.5">
          <p className="text-xs font-medium text-slate-600">
            Conflict of Interest Checker — Prototype
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            This is a concept demo built for Glade.ai. The client database is fictional and matching is string-based. Use the preset buttons below to explore all three result states: Clear, Warning, and Conflict. Built by Sharwari Akre.
          </p>
        </div>

        {/* ── Intake form ── */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">New Client Intake</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter client details to check for conflicts against active and closed matters.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-7">
            {/* Preset scenarios */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2.5">
                Load test scenario
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => {
                  const styles = PRESET_STYLES[preset.variant];
                  const isActive = activePreset === preset.label;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                        isActive ? styles.active : styles.base
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-current opacity-60">{preset.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Client name + case type */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="sm:col-span-3 space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Client full name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) =>
                    handleFieldChange(() => setClientName(e.target.value))
                  }
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Case type
                </label>
                <select
                  value={caseType}
                  onChange={(e) =>
                    handleFieldChange(() => setCaseType(e.target.value as CaseType))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-shadow"
                >
                  {CASE_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {formatCaseType(ct)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Related parties */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Related parties
                </label>
                <button
                  onClick={addParty}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1.5 transition-colors hover:bg-slate-50 hover:border-slate-400"
                >
                  + Add party
                </button>
              </div>

              {parties.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">
                  No related parties added. Conflict check will run on client name only.
                </p>
              )}

              <div className="space-y-2">
                {parties.map((party, i) => (
                  <div key={party.id} className="flex gap-2 items-center group">
                    <span className="text-xs text-slate-400 w-5 text-right shrink-0">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={party.name}
                      onChange={(e) => updateParty(party.id, "name", e.target.value)}
                      placeholder="Full name or entity"
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-shadow"
                    />
                    <select
                      value={party.role}
                      onChange={(e) => updateParty(party.id, "role", e.target.value)}
                      className="w-44 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-shadow shrink-0"
                    >
                      {PARTY_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeParty(party.id)}
                      className="p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-md hover:bg-slate-100 shrink-0"
                      aria-label="Remove party"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1 flex items-center gap-4">
              <button
                onClick={runCheck}
                disabled={!clientName.trim()}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Run conflict check
              </button>
              {!clientName.trim() && (
                <p className="text-xs text-slate-400">Enter a client name to continue.</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Result panel ── */}
        {result && cfg && (
          <section className={`rounded-xl border ${cfg.border} shadow-sm overflow-hidden`}>
            {/* Status header */}
            <div
              className={`px-6 py-4 ${cfg.headerBg} border-b ${cfg.border} flex items-start gap-3`}
            >
              <span
                className={`mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${cfg.badge}`}
              >
                {cfg.label}
              </span>
              <div>
                <p className="text-sm text-slate-800 font-medium">{cfg.summary}</p>
                {result.matches.length > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {result.matches.length} match
                    {result.matches.length !== 1 ? "es" : ""} found across the client
                    database.
                  </p>
                )}
              </div>
            </div>

            {/* Matches table */}
            {result.matches.length > 0 ? (
              <div className="bg-white overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        Matched name
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        Match type
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        Existing case
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        Severity
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Explanation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches.map((match, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                          {match.matchedName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          {formatMatchType(match.matchType)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-medium text-slate-800">
                            {match.existingClientName}
                          </span>
                          <span className="ml-1.5 text-xs text-slate-400 font-mono">
                            {match.existingCaseId}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              match.severity === "high"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {match.severity === "high" ? "High" : "Medium"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs leading-relaxed max-w-sm">
                          {match.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white px-6 py-8 text-center">
                <p className="text-sm text-slate-500">
                  No matching records found in the client database.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
