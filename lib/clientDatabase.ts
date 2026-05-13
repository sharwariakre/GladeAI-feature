export type CaseType = "Bankruptcy" | "PersonalInjury" | "Immigration";
export type Status = "Active" | "Closed";
export type PartyRole =
  | "Opposing Counsel"
  | "Adverse Party"
  | "Co-Defendant"
  | "Spouse"
  | "Business Partner"
  | "Employer";

export interface RelatedParty {
  name: string;
  role: PartyRole;
}

export interface Client {
  id: string;
  name: string;
  caseType: CaseType;
  status: Status;
  openedDate: string;
  relatedParties: RelatedParty[];
}

export const clients: Client[] = [
  {
    id: "C001",
    name: "Marcus Bellini",
    caseType: "Bankruptcy",
    status: "Active",
    openedDate: "2024-03-12",
    relatedParties: [
      { name: "Sandra Bellini", role: "Spouse" },
      { name: "Apex Lending Group", role: "Adverse Party" },
      { name: "Derek Foss, Esq.", role: "Opposing Counsel" },
    ],
  },
  {
    id: "C002",
    name: "Renata Voss",
    caseType: "PersonalInjury",
    status: "Active",
    openedDate: "2025-01-08",
    relatedParties: [
      { name: "Tri-State Logistics LLC", role: "Adverse Party" },
      { name: "Claire Odum, Esq.", role: "Opposing Counsel" },
      { name: "Tri-State Logistics LLC", role: "Employer" },
    ],
  },
  {
    id: "C003",
    name: "Hector Fuentes",
    caseType: "Immigration",
    status: "Active",
    openedDate: "2025-04-22",
    relatedParties: [
      { name: "Maria Fuentes", role: "Spouse" },
      { name: "Greenfield Foods Inc.", role: "Employer" },
    ],
  },
  {
    id: "C004",
    name: "Diane Calloway",
    caseType: "Bankruptcy",
    status: "Closed",
    openedDate: "2022-11-03",
    relatedParties: [
      { name: "Thomas Calloway", role: "Spouse" },
      { name: "Northgate Capital Partners", role: "Adverse Party" },
      { name: "Priya Nair, Esq.", role: "Opposing Counsel" },
      { name: "Calloway Tile & Stone", role: "Business Partner" },
    ],
  },
  {
    id: "C005",
    name: "Jerome Whitfield",
    caseType: "PersonalInjury",
    status: "Closed",
    openedDate: "2023-06-15",
    relatedParties: [
      { name: "City of Hartwell", role: "Adverse Party" },
      { name: "Paul Sternberg, Esq.", role: "Opposing Counsel" },
    ],
  },
  {
    id: "C006",
    name: "Anita Chowdhury",
    caseType: "Immigration",
    status: "Active",
    openedDate: "2025-02-17",
    relatedParties: [
      { name: "Rajan Chowdhury", role: "Spouse" },
      { name: "Pinnacle Research Institute", role: "Employer" },
    ],
  },
  {
    id: "C007",
    name: "Brandon Kessler",
    caseType: "Bankruptcy",
    status: "Active",
    openedDate: "2025-09-01",
    relatedParties: [
      { name: "Kessler & Mora Holdings", role: "Business Partner" },
      { name: "Luis Mora", role: "Business Partner" },
      { name: "Silverline Bank", role: "Adverse Party" },
      { name: "Rachel Huang, Esq.", role: "Opposing Counsel" },
    ],
  },
  {
    id: "C008",
    name: "Fatima Al-Rashidi",
    caseType: "PersonalInjury",
    status: "Active",
    openedDate: "2025-11-30",
    relatedParties: [
      { name: "Westfield Medical Center", role: "Adverse Party" },
      { name: "Dr. Samuel Park", role: "Co-Defendant" },
      { name: "Gregory Elwood, Esq.", role: "Opposing Counsel" },
    ],
  },
  {
    id: "C009",
    name: "Colette Dufresne",
    caseType: "Immigration",
    status: "Closed",
    openedDate: "2021-08-09",
    relatedParties: [
      { name: "Blue Harbor Hospitality", role: "Employer" },
      { name: "Andre Dufresne", role: "Spouse" },
    ],
  },
  {
    id: "C010",
    name: "Raymond Ochoa",
    caseType: "PersonalInjury",
    status: "Active",
    openedDate: "2026-01-14",
    relatedParties: [
      { name: "Ironclad Construction Co.", role: "Adverse Party" },
      { name: "Ironclad Construction Co.", role: "Employer" },
      { name: "Michelle Tran, Esq.", role: "Opposing Counsel" },
      { name: "NorthStar Insurance Group", role: "Co-Defendant" },
    ],
  },
  {
    id: "C011",
    name: "Patricia Sundberg",
    caseType: "Bankruptcy",
    status: "Closed",
    openedDate: "2020-05-27",
    relatedParties: [
      { name: "Sundberg Interiors LLC", role: "Business Partner" },
      { name: "Kevin Sundberg", role: "Spouse" },
      { name: "Harbor Trust Bank", role: "Adverse Party" },
      { name: "Joel Krauss, Esq.", role: "Opposing Counsel" },
    ],
  },
  {
    id: "C012",
    name: "Dmitri Volkov",
    caseType: "Immigration",
    status: "Active",
    openedDate: "2025-07-03",
    relatedParties: [
      { name: "Volkov & Associates", role: "Business Partner" },
      { name: "U.S. Customs and Border Protection", role: "Adverse Party" },
    ],
  },
  {
    id: "C013",
    name: "Simone Beaumont",
    caseType: "PersonalInjury",
    status: "Closed",
    openedDate: "2023-02-28",
    relatedParties: [
      { name: "Eastgate Shopping Center", role: "Adverse Party" },
      { name: "CleanSweep Maintenance Co.", role: "Co-Defendant" },
      { name: "Barbara Fenwick, Esq.", role: "Opposing Counsel" },
    ],
  },
  {
    id: "C014",
    name: "Omar Hassan",
    caseType: "Bankruptcy",
    status: "Active",
    openedDate: "2024-10-19",
    relatedParties: [
      { name: "Hassan Import & Export", role: "Business Partner" },
      { name: "Layla Hassan", role: "Spouse" },
      { name: "Cornerstone Credit Union", role: "Adverse Party" },
      { name: "Dominic Ferraro, Esq.", role: "Opposing Counsel" },
    ],
  },
  {
    id: "C015",
    name: "Ngozi Eze",
    caseType: "Immigration",
    status: "Active",
    openedDate: "2026-03-05",
    relatedParties: [
      { name: "Summit University Medical Center", role: "Employer" },
      { name: "Chidi Eze", role: "Spouse" },
    ],
  },
];
