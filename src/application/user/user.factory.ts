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

function makeUserRepo() {
  return new MongoUserRepository();
}

function makeTokenRepo() {
  return new MongoRefreshTokenRepository();
}

export const makeRegisterUserUseCase = () =>
  new RegisterUserUseCase(makeUserRepo());

export const makeLoginUserUseCase = () =>
  new LoginUserUseCase(makeUserRepo(), makeTokenRepo());

export const makeRefreshTokenUseCase = () =>
  new RefreshTokenUseCase(makeUserRepo(), makeTokenRepo());

export const makeLogoutUserUseCase = () =>
  new LogoutUserUseCase(makeTokenRepo());

export const makeGetUserUseCase = () => new GetUserUseCase(makeUserRepo());

export const makeListUsersUseCase = () => new ListUsersUseCase(makeUserRepo());

export const makeUpdateUserStatusUseCase = () =>
  new UpdateUserStatusUseCase(makeUserRepo());

export const makePromoteToAdminUseCase = () =>
  new PromoteToAdminUseCase(makeUserRepo());
