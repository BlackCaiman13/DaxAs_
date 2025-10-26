export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Request {
  id: number;
  user_id: string;  // UUID
  device_id: number | null;
  model: string;
  problem_description: string;
  location: string | null;  // Format: "latitude, longitude"
  location_details: string | null;
  status: RequestStatus;
  scheduled_at: Date | null;
  created_at: Date;
}