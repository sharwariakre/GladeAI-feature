import type { Client, PartyRole, CaseType } from "./clientDatabase";

export interface NewClientParty {
  name: string;
  role: PartyRole;
}

export interface NewClientInput {
  name: string;
  caseType: CaseType;
  relatedParties: NewClientParty[];
}

export type MatchType = "direct_name" | "adverse_party" | "related_party";
export type Severity = "high" | "medium";
export type ConflictStatus = "clear" | "warning" | "conflict";

export interface Match {
  existingClientName: string;
  existingCaseId: string;
  matchType: MatchType;
  matchedName: string;
  severity: Severity;
  explanation: string;
}

export interface ConflictResult {
  status: ConflictStatus;
  matches: Match[];
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,'\-]/g, "")
    .replace(/\s+/g, " ");
}

function extractLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

interface NameMatchResult {
  isMatch: boolean;
  isLastNameOnly: boolean;
}

function matchNames(a: string, b: string): NameMatchResult {
  if (normalizeName(a) === normalizeName(b)) {
    return { isMatch: true, isLastNameOnly: false };
  }

  const lastA = extractLastName(a);
  const lastB = extractLastName(b);

  // Require last names longer than 3 chars to avoid false positives on short surnames
  if (lastA === lastB && lastA.length > 3) {
    return { isMatch: true, isLastNameOnly: true };
  }

  return { isMatch: false, isLastNameOnly: false };
}

export function checkConflicts(
  newClient: NewClientInput,
  database: Client[]
): ConflictResult {
  const rawMatches: Match[] = [];

  for (const existing of database) {
    // 1. Direct name match: new client name vs existing client name
    const directMatch = matchNames(newClient.name, existing.name);
    if (directMatch.isMatch) {
      if (directMatch.isLastNameOnly) {
        rawMatches.push({
          existingClientName: existing.name,
          existingCaseId: existing.id,
          matchType: "direct_name",
          matchedName: newClient.name,
          severity: "medium",
          explanation: `"${newClient.name}" shares a last name with existing ${existing.status.toLowerCase()} client "${existing.name}" (case ${existing.id}, ${existing.caseType}). Confirm these are different individuals.`,
        });
      } else if (existing.status === "Active") {
        rawMatches.push({
          existingClientName: existing.name,
          existingCaseId: existing.id,
          matchType: "direct_name",
          matchedName: newClient.name,
          severity: "high",
          explanation: `"${newClient.name}" is currently an active client in case ${existing.id} (${existing.caseType}). Opening a new matter requires a review for conflicts of interest.`,
        });
      } else {
        rawMatches.push({
          existingClientName: existing.name,
          existingCaseId: existing.id,
          matchType: "direct_name",
          matchedName: newClient.name,
          severity: "medium",
          explanation: `"${newClient.name}" matches a closed case (${existing.id}, ${existing.caseType}). Review prior representation before proceeding.`,
        });
      }
    }

    // 2. New client's related parties vs existing client name
    //    Signals the firm would be adverse to one of its own clients
    for (const party of newClient.relatedParties) {
      const adverseMatch = matchNames(party.name, existing.name);
      if (!adverseMatch.isMatch) continue;

      if (adverseMatch.isLastNameOnly) {
        rawMatches.push({
          existingClientName: existing.name,
          existingCaseId: existing.id,
          matchType: "adverse_party",
          matchedName: party.name,
          severity: "medium",
          explanation: `New client's ${party.role} "${party.name}" shares a last name with existing ${existing.status.toLowerCase()} client "${existing.name}" (case ${existing.id}, ${existing.caseType}). Verify whether these are the same person.`,
        });
      } else if (existing.status === "Active") {
        rawMatches.push({
          existingClientName: existing.name,
          existingCaseId: existing.id,
          matchType: "adverse_party",
          matchedName: party.name,
          severity: "high",
          explanation: `New client's ${party.role} "${party.name}" is an active firm client (case ${existing.id}, ${existing.caseType}). Representing adverse parties in concurrent matters is prohibited without informed consent.`,
        });
      } else {
        rawMatches.push({
          existingClientName: existing.name,
          existingCaseId: existing.id,
          matchType: "adverse_party",
          matchedName: party.name,
          severity: "medium",
          explanation: `New client's ${party.role} "${party.name}" was a firm client in closed case ${existing.id} (${existing.caseType}). Review for ongoing duty-of-loyalty concerns.`,
        });
      }
    }

    // 3. New client's related parties vs existing client's related parties
    //    Shared parties across cases may indicate entanglement
    for (const newParty of newClient.relatedParties) {
      for (const existingParty of existing.relatedParties) {
        const relatedMatch = matchNames(newParty.name, existingParty.name);
        if (!relatedMatch.isMatch) continue;

        // Skip if this party was already flagged as adverse to this case
        const alreadyFlagged = rawMatches.some(
          (m) =>
            m.existingCaseId === existing.id &&
            m.matchedName === newParty.name &&
            m.matchType === "adverse_party"
        );
        if (alreadyFlagged) continue;

        const explanation = relatedMatch.isLastNameOnly
          ? `New client's ${newParty.role} "${newParty.name}" shares a last name with ${existingParty.role} "${existingParty.name}" in case ${existing.id} (${existing.name}, ${existing.caseType}). Confirm these are different individuals.`
          : `New client's ${newParty.role} "${newParty.name}" appears as ${existingParty.role} in case ${existing.id} (${existing.name}, ${existing.caseType}). This overlap may indicate a conflict or prior relationship.`;

        rawMatches.push({
          existingClientName: existing.name,
          existingCaseId: existing.id,
          matchType: "related_party",
          matchedName: newParty.name,
          severity: "medium",
          explanation,
        });
      }
    }
  }

  // Deduplicate: same case + match type + matched name should surface only once
  const seen = new Set<string>();
  const matches = rawMatches.filter((m) => {
    const key = `${m.existingCaseId}|${m.matchType}|${normalizeName(m.matchedName)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let status: ConflictStatus = "clear";
  if (matches.some((m) => m.severity === "high")) {
    status = "conflict";
  } else if (matches.length > 0) {
    status = "warning";
  }

  return { status, matches };
}
