import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[react(),tailwindcss()],server:{host:'127.0.0.1',port:5173,strictPort:true,
  allowedHosts:['localhost','127.0.0.1'],fs:{strict:true,allow:[fileURLToPath(new URL('.',import.meta.url))],deny:['**/.env*','**/.git/**']},
  proxy:{'/api':{target:'http://127.0.0.1:3001',changeOrigin:false},'/ui':{target:'http://127.0.0.1:3001',changeOrigin:false}}},build:{outDir:'dist'}});
