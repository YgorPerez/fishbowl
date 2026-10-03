import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serve o site em /<repo>/ — o workflow define BASE_PATH=/fishbowl/
const base = process.env.BASE_PATH ?? '/'

const config = defineConfig({
  base,
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      // Gera dist/client/index.html estático para hospedar sem servidor
      prerender: {
        enabled: true,
        failOnError: true,
      },
    }),
    viteReact(),
  ],
})

export default config
