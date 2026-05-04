export interface TokenServiceInterface {
  createEphemeralToken(data: { songId: string }): {
    token: string;
    expiresAt: number;
  };
  verifyToken(token: string): { songId: string; tokenId: string } | null;
  verifyAndConsumeToken(
    token: string
  ): { songId: string; tokenId: string } | null;
  blacklistToken(tokenId: string): void;
  isTokenBlacklisted(tokenId: string): boolean;
  resetTokenUsage(tokenId: string): void;
  getTokenUsage(tokenId: string): number;
}
