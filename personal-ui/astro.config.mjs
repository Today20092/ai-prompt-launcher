import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4329, allowedHosts: ['desktop-ayoub.cuttlefish-coho.ts.net'] },
  vite: { plugins: [tailwindcss()], server: { strictPort: true } },
});
