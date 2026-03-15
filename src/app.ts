import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import logs from 'morgan';
import { env } from './config/env';
import { productRouter } from './presentation/product/product.routes';
import { authRouter } from './presentation/user/auth.routes';
import { userRouter } from './presentation/user/user.routes';
import { errorHandler } from './shared/middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(helmet());
  if (env.NODE_ENV !== 'test') {
    app.use(logs('dev'));
  }
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/products', productRouter);

  app.use(errorHandler);

  return app;
}
