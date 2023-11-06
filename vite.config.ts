import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  assetsInclude: ['**/*.gltf', '**/*.glb'],
  publicDir: 'src/public',
  build: {

    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      },
      
    }
  }
})