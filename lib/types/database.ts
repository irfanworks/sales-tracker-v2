export type UserRole = "admin" | "sales";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  display_name: string | null;
  role: UserRole;
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
  created_at?: string;
  pics?: CustomerPic[];
}

export const PROGRESS_TYPES = ["Budgetary", "Tender", "Win", "Lose"] as const;
export const PROSPECT_OPTIONS = ["Hot Prospect", "Normal"] as const;
export type ProgressType = (typeof PROGRESS_TYPES)[number];
export type ProspectOption = (typeof PROSPECT_OPTIONS)[number];

export interface ProjectUpdate {
  id?: string;
  project_id: string;
  content: string;
  created_at: string;
  created_by?: string;
}

export interface Project {
  id: string;
  created_at: string;
  no_quote: string;
  project_name: string;
  customer_id: string;
  value: number;
  status?: string;
  progress_type: ProgressType;
  prospect: ProspectOption;
  weekly_update: string | null;
  sales_id: string;
  customer?: Customer;
  sales_name?: string;
  updates?: ProjectUpdate[];
}

export interface ProjectInsert {
  no_quote: string;
  project_name: string;
  customer_id: string;
  value: number;
  progress_type: ProgressType;
  prospect: ProspectOption;
  weekly_update?: string | null;
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
