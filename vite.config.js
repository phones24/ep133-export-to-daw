import preact from '@preact/preset-vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    tailwindcss(),
    preact(),
    svgr(),
    ViteMinifyPlugin({}),
    VitePWA({
      registerType: 'autoUpdate',
      // devOptions: {
      //   enabled: true,
      // },
      workbox: {
        globPatterns: ['**/*'],
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 10,
      },
      includeAssets: ['**/*'],
      manifest: {
        name: 'EP-133 K.O. II: Export To DAW',
        short_name: 'ep133-to-daw',
        description: 'Export your projects to Ableton Live, DAWproject or MIDI',
        theme_color: '#dbdddb',
        scope: '/',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/android-icon-36x36.png',
            sizes: '36x36',
            type: 'image/png',
          },
          {
            src: '/android-icon-48x48.png',
            sizes: '48x48',
            type: 'image/png',
          },
          {
            src: '/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: '/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: '/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
    sentryVitePlugin({
      org: 'private-developer-d9',
      project: 'ep133-to-daw',
      telemetry: false,
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('xmlbuilder2')) {
            return 'xmlbuilder2';
          }
        },
      },
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
});
