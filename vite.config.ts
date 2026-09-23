import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'La Jolie Nail', short_name: 'La Jolie Nail', description: 'Gestão para nail designers', theme_color: '#8f2148', background_color: '#fbf5f1', display: 'standalone', icons: [] } })]
});
