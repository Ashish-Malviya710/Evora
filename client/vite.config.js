import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-dom/client',
            'react-router-dom',
            'react-hot-toast',
            'framer-motion',
            'axios',
            'react-icons/fa',
            'socket.io-client'
        ],
    },
    build: {
        target: 'esnext',
        minify: 'esbuild',
        chunkSizeWarningLimit: 1000,
    }
});
