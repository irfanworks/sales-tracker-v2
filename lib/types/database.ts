import type { SalesStage } from "@/lib/salesStage";

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

/** Who this company is to Enercon — optional until sales categorizes. */
export const CUSTOMER_ROLE_OPTIONS = [
  "End User/Owner",
  "EPC/Main Contractor",
  "Partner",
  "Principal",
  "Direct Quotation Customer",
] as const;
export type CustomerRole = (typeof CUSTOMER_ROLE_OPTIONS)[number];

export function isCustomerRole(value: string | null | undefined): value is CustomerRole {
  return CUSTOMER_ROLE_OPTIONS.includes(value as CustomerRole);
}

export interface CustomerPic {
  id?: string;
  customer_id: string;
  nama: string | null;
  email: string | null;
  no_hp: string | null;
  jabatan: string | null;
}

/** Courtesy title shown before customer PIC name */
export const PIC_SALUTATIONS = ["Mr.", "Mrs.", "Ms."] as const;
export type PicSalutation = (typeof PIC_SALUTATIONS)[number];

export function isPicSalutation(value: string | null | undefined): value is PicSalutation {
  return PIC_SALUTATIONS.includes(value as PicSalutation);
}

/** e.g. "Mr. Budi" or "Budi" / "—" */
export function formatPicWithSalutation(
  salutation: string | null | undefined,
  name: string | null | undefined
): string {
  const n = name?.trim();
  if (!n) return "—";
  const s = salutation?.trim();
  return s ? `${s} ${n}` : n;
}

export interface Customer {
  id: string;
  name: string;
  sector?: SectorOption | null;
  customer_role?: CustomerRole | null;
  slug?: string | null;
  created_at?: string;
  pics?: CustomerPic[];
}

export const PIPELINE_TYPES = ["Project", "Trading", "Service"] as const;
export const LIFECYCLE_STATUSES = ["Open", "Closed"] as const;
/** Pre-quote opportunity statuses */
export const PROSPECT_STATUSES = ["Open", "Closed", "Converted"] as const;

export type PipelineType = (typeof PIPELINE_TYPES)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export { SALES_STAGES } from "@/lib/salesStage";
export type { SalesStage } from "@/lib/salesStage";

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
  sales_stage: SalesStage;
  sales_stage_changed_at?: string | null;
  source_prospect_id?: string | null;
  pic_name?: string | null;
  pic_salutation?: PicSalutation | null;
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
  sales_stage: SalesStage;
  sales_stage_changed_at?: string | null;
  source_prospect_id?: string | null;
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
  pic_salutation?: PicSalutation | null;
  status: ProspectStatus;
  estimated_value?: number | null;
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
  pic_salutation?: PicSalutation | null;
  status?: ProspectStatus;
  estimated_value?: number | null;
  latest_update?: string | null;
}

export type SalesActivityActionType =
  | "pipeline_created"
  | "pipeline_updated"
  | "pipeline_deleted"
  | "pipeline_status_changed"
  | "pipeline_stage_changed"
  | "pipeline_update_added"
  | "quote_revised"
  | "prospect_created"
  | "prospect_updated"
  | "prospect_deleted"
  | "prospect_update_added"
  | "prospect_converted";

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
