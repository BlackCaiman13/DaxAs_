export type QuoteStatus = 'pending' | 'accepted' | 'rejected';

export interface Quote {
  id: number;
  request_id: number;
  amount: number;
  description_travaux: string;
  estimated_duration: string;
  parts_needed: string | null;
  status: QuoteStatus;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}
