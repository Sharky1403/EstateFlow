export type Role = 'landlord' | 'tenant' | 'contractor'
export type TicketUrgency = 'emergency' | 'routine'
export type TicketCategory = 'plumbing' | 'electrical' | 'hvac' | 'other'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'complete'
export type LeaseStatus = 'draft' | 'active' | 'expired' | 'terminated'
export type LedgerType = 'rent' | 'late_fee' | 'deposit' | 'expense' | 'lease_break_fee'
export type LedgerBucket = 'revenue' | 'deposit_hold' | 'expense'
export type WorkOrderStatus = 'sent' | 'accepted' | 'complete'

export interface Profile {
  id: string
  role: Role
  full_name: string
  avatar_url: string | null
  company_name: string | null
  company_logo_url: string | null
  phone: string | null
  id_document_url: string | null
  created_at: string
}

export interface Building {
  id: string
  landlord_id: string
  name: string
  address: string
  created_at: string
}

export interface Unit {
  id: string
  building_id: string
  floor_number: number
  unit_number: string
  market_rent: number
  actual_rent: number
  occupied: boolean
  metadata: {
    sq_ft?: number
    paint_code?: string
    appliance_serials?: Record<string, string>
  }
}

export interface Lease {
  id: string
  unit_id: string
  tenant_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  clauses: { title: string; body: string }[]
  pdf_url: string | null
  signed_at: string | null
  signature_data: string | null
  status: LeaseStatus
}

export interface LedgerEntry {
  id: string
  lease_id: string
  type: LedgerType
  amount: number
  bucket: LedgerBucket
  paid_at: string | null
  description: string | null
}

export interface MaintenanceTicket {
  id: string
  unit_id: string
  tenant_id: string
  description: string
  photo_url: string | null
  voice_note_url: string | null
  urgency: TicketUrgency | null
  category: TicketCategory | null
  status: TicketStatus
  created_at: string
}

export interface WorkOrder {
  id: string
  ticket_id: string
  contractor_id: string
  access_code: string
  completion_photo_url: string | null
  status: WorkOrderStatus
}

export interface Message {
  id: string
  ticket_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

export interface Announcement {
  id: string
  landlord_id: string
  building_id: string
  body: string
  sent_via: string[]
  created_at: string
}

export interface ContractorInsurance {
  contractor_id: string
  policy_document_url: string
  expiry_date: string
}

export interface BuildingAnalytics {
  building_id: string
  name: string
  total_units: number
  occupied_units: number
  collected_rent: number
  open_tickets: number
}
