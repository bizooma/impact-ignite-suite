import { defineConfig, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Widget build plugin - runs after main build
const widgetBuildPlugin = () => ({
  name: 'widget-build',
  closeBundle: async () => {
    console.log('\n🔧 Building widget bundle...');
    try {
      await viteBuild({
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
          },
        },
        build: {
          outDir: 'dist-widget',
          lib: {
            entry: path.resolve(__dirname, 'src/widget-entry.tsx'),
            name: 'CauseioWidget',
            fileName: 'widget',
            formats: ['umd']
          },
          rollupOptions: {
            external: [],
            output: {
              globals: {},
              assetFileNames: (assetInfo) => {
                if (assetInfo.name === 'style.css') {
                  return 'widget.css';
                }
                return assetInfo.name || 'asset';
              },
            }
          },
          cssCodeSplit: false,
        },
      });
      console.log('✅ Widget bundle built successfully!');
    } catch (error) {
      console.error('❌ Widget build failed:', error);
      throw error;
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    mode === "production" && widgetBuildPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
