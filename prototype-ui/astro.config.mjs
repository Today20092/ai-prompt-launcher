// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  integrations: [react()],
  server: { host: '127.0.0.1', port: 4328, allowedHosts: ['desktop-ayoub.cuttlefish-coho.ts.net'] },
  vite: { plugins: [tailwindcss()], server: { strictPort: true, hmr: { protocol: 'wss', host: 'desktop-ayoub.cuttlefish-coho.ts.net', clientPort: 8448 } } }
});
