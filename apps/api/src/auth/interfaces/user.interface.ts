export interface AuthenticatedUser {
  userId: number;
  username: string;
  role: string;
  orgId: number;
}

export interface JwtPayload {
  username: string;
  sub: number;
  role: string;
  orgId: number;
}
