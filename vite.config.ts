import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');

    return {
      base: '/ai-quiz-/', // تم التعديل هنا ليتطابق مع اسم الريبو الجديد

      plugins: [react()],

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

