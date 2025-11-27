import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscator from 'rollup-plugin-obfuscator';
import { createHtmlPlugin } from 'vite-plugin-html';
import path from 'path';
// import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      ...(isProduction
        ? [
            createHtmlPlugin({
              minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyCSS: true,
                minifyJS: true,
                minifyURLs: true,
                removeEmptyAttributes: true,
                removeOptionalTags: false,
                removeTagWhitespace: true,
                trimCustomFragments: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: false,
                removeEmptyElements: false,
              },
            }),
          ]
        : []),
      // visualizer({ // Bundle size visualization
      //   filename: 'stats.html',
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      // }),
      // Only apply obfuscator in production build
      ...(isProduction
        ? [
            obfuscator({
              // Basic obfuscation options
              compact: true,
              controlFlowFlattening: true,
              deadCodeInjection: true,
              debugProtection: false, // Disable to avoid issues
              debugProtectionInterval: false,
              disableConsoleOutput: true,
              identifierNamesGenerator: 'hexadecimal',
              log: false,
              numbersToExpressions: true,
              renameGlobals: false,
              rotateStringArray: true,
              selfDefending: false, // Disable to avoid issues
              shuffleStringArray: true,
              splitStrings: true,
              stringArray: true,
              stringArrayEncoding: ['base64'],
              stringArrayThreshold: 0.75,
              transformObjectKeys: true,
              unicodeEscapeSequence: false,
            } as any),
          ]
        : []),
    ],
  define: {
    global: 'window', // Add global variable
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true, // Remove debugger
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@mui/')) {
            return 'ui-vendor';
          }
          if (
            id.includes('node_modules/axios/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'utils-vendor';
          }
        },
        // File name optimization
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Size optimization
    chunkSizeWarningLimit: 1000, // Increase limit to 2000kb
    // Enable source maps for production
    sourcemap: false,
    // CSS optimization
    cssCodeSplit: true,
    // Image optimization
    assetsInlineLimit: 4096, // 4kb
  },
  // Development server optimization
  server: {
    hmr: true,
    open: true,
  },
  // CSS prefix optimization
  css: {
    devSourcemap: true,
    modules: {
      generateScopedName: '[hash:base64:8]',
    },
  },
    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});

