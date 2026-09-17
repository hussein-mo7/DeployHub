export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface AuthSessionMeta {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSessionMeta;
}

export interface RegisterResponse {
  message: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}
