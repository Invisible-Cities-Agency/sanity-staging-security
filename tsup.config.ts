import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'sanity',
    '@sanity/ui',
    '@sanity/icons',
    '@vercel/edge-config', // Optional dependency
  ],
  treeshake: true,
  outDir: 'dist',
  esbuildOptions(options) {
    // Optimize for modern browsers and Node.js
    options.target = ['es2020', 'node18']
  },
})