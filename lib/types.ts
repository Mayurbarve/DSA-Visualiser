export type Tier = "brute" | "better" | "optimal";

export interface Approach {
  tier: Tier;
  title: string;
  idea: string;
  time: string;
  space: string;
  code: string;
  whenToUse?: string;
  pitfalls?: string[];
}

export interface CompanyHit {
  name: string;
  frequency: "Very High" | "High" | "Medium" | "Low";
  note?: string;
}

export interface SolutionPack {
  overview: string;
  pattern: string[];
  keyInsight: string;
  approaches: Approach[];
  complexityTable: { approach: string; time: string; space: string; note?: string }[];
  companies: CompanyHit[];
  followUps: string[];
  relatedPatterns: string[];
}

export interface Explanation {
  tldr: string;
  intuition: string;
  steps: { title: string; detail: string }[];
  dryRun: { input: string; trace: string[] };
  pitfalls: string[];
  takeaway: string;
}

export const LANGUAGE_OPTIONS = [
  { id: "python3", label: "Python 3" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "javascript", label: "JavaScript" },
  { id: "go", label: "Go" },
] as const;

export type LanguageId = (typeof LANGUAGE_OPTIONS)[number]["id"];

export function languageLabel(id: string): string {
  return LANGUAGE_OPTIONS.find((l) => l.id === id)?.label ?? "Python 3";
}

export function normaliseLanguage(id: string | null | undefined): LanguageId {
  return (LANGUAGE_OPTIONS.find((l) => l.id === id)?.id ?? "python3") as LanguageId;
}
