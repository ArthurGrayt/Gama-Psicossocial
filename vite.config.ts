
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Função auxiliar para ler .env manualmente se o loadEnv falhar
function manualLoadEnv(cwd: string) {
  const envPath = path.resolve(cwd, '.env');
  const env: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    console.log(`[Vite Manual Load] Lendo .env manualmente de: ${envPath}`);
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        let value = rest.join('=');
        // Remove aspas se existirem
        if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
          value = value.substring(1, value.length - 1);
        }
        env[key.trim()] = value;
      }
    });
  }
  return env;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
