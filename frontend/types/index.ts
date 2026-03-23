export type Booking = {
  id: number;
  client: string;
  event_type: string;
  event_date: string;
  venue: string;
  amount: number;
  status: string;
  notes?: string | null;
  created_at: string;
};

export type Equipment = {
  id: number;
  user_id: number;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  availability_status: string;
  notes?: string | null;
  created_at: string;
};

export type DamageReport = {
  id: number;
  user_id: number;
  equipment_id: number;
  equipment_name?: string;
  client: string;
  description: string;
  date_reported: string;
  repair_cost: number;
  status: string;
  created_at: string;
};

export type Finance = {
  id: number;
  entry_type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  entry_date: string;
  created_at: string;
};

export type QuotationItem = {
  description: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
};

export type Quotation = {
  id: number;
  client: string;
  event_type: string;
  event_date: string;
  status: string;
  items: QuotationItem[];
  total_amount: number;
  created_at: string;
};

export type AiQuotationSuggestion = {
  items: QuotationItem[];
  suggested_total: number;
};
