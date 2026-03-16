import { MongoUserRepository } from '../../infrastructure/user/MongoUserRepository';
import { makeAuthenticate, makeOptionalAuthenticate } from './authenticate';

const _userRepo = new MongoUserRepository();

export const authenticate = makeAuthenticate(_userRepo);
export const optionalAuthenticate = makeOptionalAuthenticate(_userRepo);
