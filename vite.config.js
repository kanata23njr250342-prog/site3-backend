import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // ビルド最適化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.logを削除
        drop_debugger: true
      },
      mangle: true
    },
    // チャンク分割の最適化
    rollupOptions: {
      output: {
        manualChunks: {
          'vue': ['vue', 'vue-router'],
          'supabase': ['@supabase/supabase-js'],
          'compressor': ['compressorjs']
        }
      }
    },
    // ビルド時のレポート
    reportCompressedSize: false,
    // ソースマップを本番環境では無効化
    sourcemap: false,
    // チャンク分割の閾値
    chunkSizeWarningLimit: 500
  },
  // 開発環境の最適化
  server: {
    middlewareMode: false
  }
})
