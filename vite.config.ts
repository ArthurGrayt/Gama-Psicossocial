import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use('/api/process-payment', (req, res, next) => {
          if (req.method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              id: 'mock_pay_' + Date.now(),
              invoiceUrl: 'https://sandbox.asaas.com/fatura/123456',
              value: 100.00,
              pixQrCode: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Rickrolling_QR_code.png'
            }));
          } else {
            next();
          }
        });
      }
    }
  ],
})
