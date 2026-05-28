// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app/wrappers';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig((ctx) => {
  return {
    boot: ['axios', 'ws', 'i18n'],

    css: ['app.scss', 'tailwind.css'],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22',
      },

      typescript: {
        strict: true,
        vueShim: true,
      },

      vueRouterMode: 'hash',

      extendViteConf(viteConf) {
        viteConf.plugins?.unshift(tailwindcss() as any);
      },

      vitePlugins: [
        [
          '@intlify/unplugin-vue-i18n/vite',
          {
            ssr: ctx.modeName === 'ssr',
            include: [fileURLToPath(new URL('./src/i18n', import.meta.url))],
          },
        ],
        [
          'vite-plugin-checker',
          {
            vueTsc: true,
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],
      ],
    },

    devServer: {
      open: true,
      port: 9000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },

    framework: {
      config: {
        dark: 'auto',
      },
      plugins: ['Notify', 'Dialog'],
    },

    animations: ['fadeIn', 'fadeOut'],

    capacitor: {
      hideSplashscreen: true,
    },

    electron: {
      preloadScripts: ['electron-preload'],
      inspectPort: 5858,
      bundler: 'packager',
      builder: {
        appId: 'stem-cave-frontend',
      },
    },
  };
});
