import { TokenServiceInterface } from './token.interface';
import { TokenService } from './token.service';

// Adapter to wrap the concrete token service
export class TokenServiceAdapter implements TokenServiceInterface {
  private tokenService: TokenService;

  constructor() {
    this.tokenService = TokenService.getInstance();
  }

  createEphemeralToken(data: { songId: string }) {
    return this.tokenService.createEphemeralToken(data);
  }

  verifyToken(token: string) {
    const payload = this.tokenService.verifyToken(token);
    if (!payload) return null;
    return {
      songId: payload.songId,
      tokenId: payload.tokenId
    };
  }

  verifyAndConsumeToken(token: string) {
    const payload = this.tokenService.verifyAndConsumeToken(token);
    if (!payload) return null;
    return {
      songId: payload.songId,
      tokenId: payload.tokenId
    };
  }

  blacklistToken(tokenId: string) {
    this.tokenService.blacklistToken(tokenId);
  }

  isTokenBlacklisted(tokenId: string) {
    return this.tokenService.isTokenBlacklisted(tokenId);
  }

  resetTokenUsage(tokenId: string) {
    this.tokenService.resetTokenUsage(tokenId);
  }

  getTokenUsage(tokenId: string) {
    return this.tokenService.getTokenUsage(tokenId);
  }
}