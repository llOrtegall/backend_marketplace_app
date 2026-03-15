import type { RefreshTokenRepository } from '../../domain/user/RefreshTokenRepository';
import type { IUserRepository } from '../../domain/user/UserRepository';
import { AppError, UnauthorizedError } from '../../shared/errors/AppError';
import { signAccessToken, signRefreshToken } from '../../shared/utils/jwt';
import { verifyPassword } from '../../shared/utils/password';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

const DUMMY_HASH =
  '$2b$12$LcMfGmxKNWHrRVSBuCi9POtXWJJMIQnvDj5pVA.o8R.Tf8ZKjhfTe';

export class LoginUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenRepo: RefreshTokenRepository,
  ) {}

  async execute(input: LoginDTO): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      await verifyPassword(input.password, DUMMY_HASH); // constant-time guard
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive()) {
      throw new AppError('ACCOUNT_INACTIVE', 'Your account is not active', 403);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { token: refreshToken, expiresAt } = signRefreshToken(user.id);

    await this.tokenRepo.save({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
