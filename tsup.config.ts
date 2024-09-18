import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  skipNodeModulesBundle: true,
  loader: {
    '.html': 'text',
  },
});
