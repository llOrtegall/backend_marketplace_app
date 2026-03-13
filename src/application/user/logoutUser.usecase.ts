import type { RefreshTokenRepository } from '../../domain/user/RefreshTokenRepository';

export class LogoutUserUseCase {
  constructor(private readonly tokenRepo: RefreshTokenRepository) {}

  async execute(refreshToken: string): Promise<void> {
    await this.tokenRepo.deleteByToken(refreshToken);
  }
}
