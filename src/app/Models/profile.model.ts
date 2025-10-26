export type UserRole = 'client' | 'repairer' | 'admin';

export interface Profile {
  id: string;  // UUID from auth.users
  fullname: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: Date;
}