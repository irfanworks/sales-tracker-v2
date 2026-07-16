export type UserRole = "admin" | "sales";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  role: UserRole;
  annual_sales_target?: number | null;
  updated_at: string;
}

export const SECTOR_OPTIONS = [
  "Data Center",
  "Oil and Gas",
  "Commercial",
  "Industrial",
  "Mining",
] as const;
export type SectorOption = (typeof SECTOR_OPTIONS)[number];

export interface CustomerPic {
  id?: string;
  customer_id: string;
  nama: string | null;
  email: string | null;
  no_hp: string | null;
  jabatan: string | null;
}

export interface Customer {
  id: string;
  name: string;
  sector?: SectorOption | null;
  slug?: string | null;
  created_at?: string;
  pics?: CustomerPic[];
}

/** Progress type at project creation / lifecycle stage */
export const PROGRESS_TYPES = ["Budgetary", "Tender", "BD"] as const;
/** Shown on Projects menu only (BD has its own page) */
export const PROJECTS_LIST_PROGRESS_TYPES = ["Budgetary", "Tender"] as const;
export const PROJECT_TYPES = ["Project", "Trading", "Service"] as const;
export const OUTCOME_STATUSES = ["Win", "Lose", "On Hold"] as const;
export const PROSPECT_OPTIONS = ["Hot Prospect", "Normal"] as const;
export const LIFECYCLE_STATUSES = ["Open", "Closed"] as const;

export type ProgressType = (typeof PROGRESS_TYPES)[number];
export type ProjectType = (typeof PROJECT_TYPES)[number];
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];
export type ProspectOption = (typeof PROSPECT_OPTIONS)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export interface ProjectUpdate {
  id?: string;
  project_id: string;
  content: string;
  created_at: string;
  created_by?: string;
}

/** One line of payment terms — percentages across lines must sum to 100. */
export interface PaymentTermLine {
  label: string;
  percent: number;
  is_custom?: boolean;
}

export interface QuoteRevision {
  id: string;
  project_id: string;
  revision: number;
  no_quote: string;
  value: number | null;
  price_validity_days: number | null;
  delivery_weeks: number | null;
  payment_terms: PaymentTermLine[];
  project_name: string | null;
  notes: string | null;
  created_at: string;
  created_by?: string | null;
  author_name?: string | null;
}

export interface Project {
  id: string;
  slug?: string | null;
  created_at: string;
  no_quote: string;
  quote_base?: string | null;
  quote_revision?: number;
  project_name: string;
  customer_id: string;
  value: number;
  project_type: ProjectType;
  status: LifecycleStatus;
  progress_type: ProgressType;
  outcome_status?: OutcomeStatus | null;
  prospect: ProspectOption;
  pic_name?: string | null;
  weekly_update: string | null;
  target_closing_at?: string | null;
  price_validity_days?: number | null;
  delivery_weeks?: number | null;
  payment_terms?: PaymentTermLine[];
  sales_id: string;
  customer?: Customer;
  sales_name?: string;
  updates?: ProjectUpdate[];
}

export interface ProjectInsert {
  no_quote: string;
  quote_base?: string;
  quote_revision?: number;
  project_name: string;
  customer_id: string;
  value: number;
  project_type: ProjectType;
  progress_type: ProgressType;
  prospect: ProspectOption;
  status?: LifecycleStatus;
  weekly_update?: string | null;
  target_closing_at?: string | null;
  price_validity_days?: number | null;
  delivery_weeks?: number | null;
  payment_terms?: PaymentTermLine[];
}

export interface BdWeeklyUpdate {
  id: string;
  user_id: string;
  year: number;
  week_number: number;
  customer_id: string | null;
  content: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: { id: string; name: string } | null;
}
