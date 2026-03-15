import { MongoRefreshTokenRepository } from '../../infrastructure/user/MongoRefreshTokenRepository';
import { MongoUserRepository } from '../../infrastructure/user/MongoUserRepository';
import { GetUserUseCase } from './getUser.usecase';
import { ListUsersUseCase } from './listUsers.usecase';
import { LoginUserUseCase } from './loginUser.usecase';
import { LogoutUserUseCase } from './logoutUser.usecase';
import { PromoteToAdminUseCase } from './promoteToAdmin.usecase';
import { RefreshTokenUseCase } from './refreshToken.usecase';
import { RegisterUserUseCase } from './registerUser.usecase';
import { UpdateUserStatusUseCase } from './updateUserStatus.usecase';

const userRepo = new MongoUserRepository();
const tokenRepo = new MongoRefreshTokenRepository();

export const makeRegisterUserUseCase = () => new RegisterUserUseCase(userRepo);

export const makeLoginUserUseCase = () =>
  new LoginUserUseCase(userRepo, tokenRepo);

export const makeRefreshTokenUseCase = () =>
  new RefreshTokenUseCase(userRepo, tokenRepo);

export const makeLogoutUserUseCase = () => new LogoutUserUseCase(tokenRepo);

export const makeGetUserUseCase = () => new GetUserUseCase(userRepo);

export const makeListUsersUseCase = () => new ListUsersUseCase(userRepo);

export const makeUpdateUserStatusUseCase = () =>
  new UpdateUserStatusUseCase(userRepo);

export const makePromoteToAdminUseCase = () =>
  new PromoteToAdminUseCase(userRepo);
