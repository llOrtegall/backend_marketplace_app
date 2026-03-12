export interface RefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  save(data: RefreshTokenData): Promise<void>;
  findAndDelete(token: string): Promise<RefreshTokenData | null>;
  deleteByToken(token: string): Promise<void>;
}
