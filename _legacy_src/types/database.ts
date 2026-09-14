export type UserRole = "admin" | "sales";

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  updated_at?: string;
}

export type CustomerSector =
  | "Data Center"
  | "Oil and Gas"
  | "Commercial"
  | "Industrial"
  | "Mining";

export interface CustomerPIC {
  id?: string;
  customer_id?: string;
  nama_pic: string;
  email: string;
  no_hp: string;
  jabatan: string;
}

export interface Customer {
  id: string;
  name: string;
  sector: CustomerSector;
  created_at?: string;
}

export type ProgressType = "Budgetary" | "Tender" | "Win" | "Loss";

export type ProspectType = "Hot Prospect" | "Normal";

export interface Project {
  id: string;
  created_at: string;
  no_quote: string;
  project_name: string;
  customer_id: string;
  value: number;
  status?: string;
  progress_type: ProgressType;
  prospect: ProspectType;
  created_by?: string;
  created_by_name?: string | null;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  update_text: string;
  created_at: string;
  created_by?: string | null;
  created_by_name?: string | null;
}

export interface ProjectWithCustomer extends Project {
  customers: { name: string } | null;
}
