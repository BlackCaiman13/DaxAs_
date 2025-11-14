export type AssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface Assignment {
  id: number;
  request_id: number;
  repairer_id: string;
  assigned_at: Date;
  status: AssignmentStatus;
  created_at: Date;
  updated_at: Date;
}
