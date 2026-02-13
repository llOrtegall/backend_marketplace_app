// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import auth from 'auth-astro';

const checkOriginEnabled = process.env.ASTRO_CHECK_ORIGIN === 'true';

// https://astro.build/config
export default defineConfig({
  security: {
    checkOrigin: checkOriginEnabled
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), auth()],

  adapter: node({
    mode: 'standalone'
  })
});