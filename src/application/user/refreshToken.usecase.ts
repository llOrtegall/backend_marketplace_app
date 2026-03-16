import type { RefreshTokenRepository } from '../../domain/user/RefreshTokenRepository';
import type { IUserRepository } from '../../domain/user/UserRepository';
import { AppError, UnauthorizedError } from '../../shared/errors/AppError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/jwt';
import type { LoginResult } from './loginUser.usecase';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenRepo: RefreshTokenRepository,
  ) {}

  async execute(token: string): Promise<LoginResult> {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const stored = await this.tokenRepo.findAndDelete(token);
    if (!stored) {
      throw new UnauthorizedError('Refresh token not found or already used');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    if (!user.isActive()) {
      throw new AppError('ACCOUNT_INACTIVE', 'Your account is not active', 403);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { token: newRefreshToken, expiresAt } = signRefreshToken(user.id);

    await this.tokenRepo.save({
      token: newRefreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
