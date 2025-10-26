export interface Notification {
  id: number;
  user_id: string;  // UUID
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}