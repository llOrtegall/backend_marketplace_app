import cors from 'cors';
import express from 'express';
import logs from 'morgan';
import { env } from './src/config/env';
import { connectDB } from './src/database/mongo';
import { productRouter } from './src/presentation/product/product.routes';
import { authRouter } from './src/presentation/user/auth.routes';
import { userRouter } from './src/presentation/user/user.routes';
import { errorHandler } from './src/shared/middleware/errorHandler';

const app = express();

app.use(cors());
app.use(logs('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Startup error]', err);
    process.exit(1);
  });
