export type PaymentStatus = 'pending' | 'completed';

export interface Payment {
  id: number;
  quote_id: number;
  amount: number;
  payment_method: string;
  status: PaymentStatus;
  payment_date: Date | null;
  notes: string | null;
  created_at: Date;
}
