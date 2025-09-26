// Simple auth types to avoid complex Supabase type resolution
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResponse {
  error: AuthError | null;
}