import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' }, // optimizer.worker.ts (Plan v2, Section 8)
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
