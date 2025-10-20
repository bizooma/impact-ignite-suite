#!/usr/bin/env node

/**
 * Post-build script to automatically build the widget after main app build
 * This runs as a separate process to avoid nested build issues
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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
    console.log('📦 Widget files created:');
    console.log('   • dist-widget/widget.umd.js');
    console.log('   • dist-widget/widget.css');
    console.log('   • public/embed.js');
    console.log('');
    console.log('📤 Next: Upload these files to Supabase Storage');
    console.log('   https://supabase.com/dashboard/project/svuxuhrsrawdqqkepeye/storage/buckets/widget-hosting');
  } else {
    console.error('❌ Widget build failed with code', code);
    process.exit(code);
  }
});

widgetBuild.on('error', (error) => {
  console.error('❌ Failed to start widget build:', error);
  process.exit(1);
});
