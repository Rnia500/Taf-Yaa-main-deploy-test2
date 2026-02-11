#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

console.log('🧪 Running Taf\'Yaa AI Suggestion Tests...\n');

// Test suites to run
const testSuites = [
  { name: 'Unit Tests', command: 'npm', args: ['test', 'src/test/suggestionService.test.js'] },
  { name: 'Evidence Tests', command: 'npm', args: ['test', 'src/test/evidenceGeneration.test.js'] },
  { name: 'Integration Tests', command: 'npm', args: ['test', 'src/test/suggestionServiceIntegration.test.js'] },
  { name: 'AI Logic Tests', command: 'npm', args: ['test', 'src/test/aiSuggestionsLogic.test.js'] },
  { name: 'Performance Tests', command: 'npm', args: ['test', 'src/test/performance.test.js'] }
];

async function runTestSuite(suite) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Running ${suite.name}...`);
    
    const process = spawn(suite.command, suite.args, {
      cwd: rootDir,
      stdio: 'inherit'
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${suite.name} passed`);
        resolve();
      } else {
        console.log(`❌ ${suite.name} failed`);
        reject(new Error(`${suite.name} failed with code ${code}`));
      }
    });
  });
}

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  for (const suite of testSuites) {
    try {
      await runTestSuite(suite);
      passed++;
    } catch (error) {
      failed++;
    }
  }

  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

runAllTests().catch(console.error);

