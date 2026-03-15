import { env } from './src/config/env';
import { createApp } from './src/app';
import { connectDB } from './src/database/mongo';

const app = createApp();

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
