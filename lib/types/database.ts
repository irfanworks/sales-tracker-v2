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

/** Progress type at pipeline creation / lifecycle stage */
export const PROGRESS_TYPES = ["Budgetary", "Tender"] as const;
export const PIPELINE_TYPES = ["Project", "Trading", "Service"] as const;
export const OUTCOME_STATUSES = ["Win", "Lose", "On Hold"] as const;
/** Heat on a pipeline (Hot vs Normal) — not the Prospects module */
export const PROSPECT_OPTIONS = ["Hot Prospect", "Normal"] as const;
export const LIFECYCLE_STATUSES = ["Open", "Closed"] as const;
/** Pre-quote opportunity statuses */
export const PROSPECT_STATUSES = ["Open", "Closed", "Converted"] as const;

export type ProgressType = (typeof PROGRESS_TYPES)[number];
export type PipelineType = (typeof PIPELINE_TYPES)[number];
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];
export type ProspectOption = (typeof PROSPECT_OPTIONS)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export interface PipelineUpdate {
  id?: string;
  pipeline_id: string;
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
  pipeline_id: string;
  revision: number;
  no_quote: string;
  value: number | null;
  price_validity_days: number | null;
  delivery_weeks: number | null;
  payment_terms: PaymentTermLine[];
  pipeline_name: string | null;
  notes: string | null;
  created_at: string;
  created_by?: string | null;
  author_name?: string | null;
}

export interface Pipeline {
  id: string;
  slug?: string | null;
  created_at: string;
  no_quote: string;
  quote_base?: string | null;
  quote_revision?: number;
  pipeline_name: string;
  customer_id: string;
  value: number;
  pipeline_type: PipelineType;
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
  updates?: PipelineUpdate[];
}

export interface PipelineInsert {
  no_quote: string;
  quote_base?: string;
  quote_revision?: number;
  pipeline_name: string;
  customer_id: string;
  value: number;
  pipeline_type: PipelineType;
  progress_type: ProgressType;
  prospect: ProspectOption;
  status?: LifecycleStatus;
  weekly_update?: string | null;
  target_closing_at?: string | null;
  price_validity_days?: number | null;
  delivery_weeks?: number | null;
  payment_terms?: PaymentTermLine[];
}

export interface ProspectUpdate {
  id?: string;
  prospect_id: string;
  content: string;
  created_at: string;
  created_by?: string | null;
}

export interface Prospect {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  title: string;
  work_description: string | null;
  pic_name?: string | null;
  status: ProspectStatus;
  sales_id: string;
  latest_update: string | null;
  customer?: Customer;
  sales_name?: string | null;
  updates?: ProspectUpdate[];
}

export interface ProspectInsert {
  customer_id: string;
  title: string;
  work_description?: string | null;
  pic_name?: string | null;
  status?: ProspectStatus;
  latest_update?: string | null;
}

export type SalesActivityActionType =
  | "pipeline_created"
  | "pipeline_updated"
  | "pipeline_deleted"
  | "pipeline_status_changed"
  | "pipeline_update_added"
  | "quote_revised"
  | "prospect_created"
  | "prospect_updated"
  | "prospect_deleted"
  | "prospect_update_added";

export interface SalesActivityLog {
  id: string;
  created_at: string;
  actor_id: string;
  action_type: SalesActivityActionType | string;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  summary: string;
  details: string | null;
  actor_name?: string | null;
}
