#!/usr/bin/env node

/**
 * Post-build script to automatically build the widget after main app build
 * This runs as a separate process to avoid nested build issues
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔧 Building chatbot widget...');

const widgetBuild = spawn('npx', ['vite', 'build', '--config', 'vite.widget.config.ts'], {
  cwd: resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

widgetBuild.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Widget built successfully!');
    
    // Copy widget files to public/widget/ for local dev
    const publicWidgetDir = resolve(__dirname, '../public/widget');
    if (!existsSync(publicWidgetDir)) {
      mkdirSync(publicWidgetDir, { recursive: true });
    }
    
    // Copy widget files to dist/widget/ for production deployment
    const distWidgetDir = resolve(__dirname, '../dist/widget');
    if (!existsSync(distWidgetDir)) {
      mkdirSync(distWidgetDir, { recursive: true });
    }
    
    try {
      // Copy to public/widget/ for local development
      copyFileSync(
        resolve(__dirname, '../dist-widget/widget.umd.cjs'),
        resolve(publicWidgetDir, 'widget.umd.js')
      );
      copyFileSync(
        resolve(__dirname, '../dist-widget/widget.css'),
        resolve(publicWidgetDir, 'widget.css')
      );
      
      // Copy to dist/widget/ for production deployment
      copyFileSync(
        resolve(__dirname, '../dist-widget/widget.umd.cjs'),
        resolve(distWidgetDir, 'widget.umd.js')
      );
      copyFileSync(
        resolve(__dirname, '../dist-widget/widget.css'),
        resolve(distWidgetDir, 'widget.css')
      );
      
      console.log('📦 Widget files deployed:');
      console.log('   ✓ public/widget/widget.umd.js (local dev)');
      console.log('   ✓ public/widget/widget.css (local dev)');
      console.log('   ✓ dist/widget/widget.umd.js (production)');
      console.log('   ✓ dist/widget/widget.css (production)');
      console.log('   ✓ public/embed.js');
      console.log('');
      console.log('✅ Widget will be automatically deployed with your app!');
      console.log('🚀 No manual upload needed - deploy and you\'re done!');
    } catch (error) {
      console.error('❌ Failed to copy widget files:', error);
      process.exit(1);
    }
  } else {
    console.error('❌ Widget build failed with code', code);
    process.exit(code);
  }
});

widgetBuild.on('error', (error) => {
  console.error('❌ Failed to start widget build:', error);
  process.exit(1);
});
