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

export const makeRegisterUserUseCase = () =>
  new RegisterUserUseCase(new MongoUserRepository());

export const makeLoginUserUseCase = () =>
  new LoginUserUseCase(
    new MongoUserRepository(),
    new MongoRefreshTokenRepository(),
  );

export const makeRefreshTokenUseCase = () =>
  new RefreshTokenUseCase(
    new MongoUserRepository(),
    new MongoRefreshTokenRepository(),
  );

export const makeLogoutUserUseCase = () =>
  new LogoutUserUseCase(new MongoRefreshTokenRepository());

export const makeGetUserUseCase = () =>
  new GetUserUseCase(new MongoUserRepository());

export const makeListUsersUseCase = () =>
  new ListUsersUseCase(new MongoUserRepository());

export const makeUpdateUserStatusUseCase = () =>
  new UpdateUserStatusUseCase(new MongoUserRepository());

export const makePromoteToAdminUseCase = () =>
  new PromoteToAdminUseCase(new MongoUserRepository());
