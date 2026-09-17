export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthSessionMeta {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

export interface AuthResponse {
  user: User;
  session: AuthSessionMeta;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}
