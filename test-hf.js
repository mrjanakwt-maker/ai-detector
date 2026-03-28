// Save this as ~/Desktop/ai-detector/test-hf.js and run: node test-hf.js

const fs = require('fs');

// Read the .env.local file
const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');

let hfKey = null;
for (const line of lines) {
  if (line.startsWith('HF_API_KEY=')) {
    hfKey = line.split('=')[1].trim();
  }
}

console.log('--- ENV CHECK ---');
console.log('HF_API_KEY found:', !!hfKey);
console.log('Key starts with:', hfKey ? hfKey.slice(0, 6) : 'N/A');
console.log('Key length:', hfKey ? hfKey.length : 0);
console.log('');

if (!hfKey) {
  console.log('ERROR: No HF_API_KEY found in .env.local');
  console.log('Make sure your .env.local has a line like:');
  console.log('HF_API_KEY=hf_xxxxxxxxx');
  process.exit(1);
}

// Test all 4 models
const models = [
  'openai-community/roberta-base-openai-detector',
  'openai-community/roberta-large-openai-detector',
  'coai/roberta-ai-detector-v2',
  'SuperAnnotate/roberta-large-llm-content-detector',
];

const testText = 'The quick brown fox jumps over the lazy dog and runs across the field in the warm morning sun while birds sing overhead';

async function testModel(model) {
  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: testText }),
      }
    );
    const data = await res.json();
    console.log(`[${model}]`);
    console.log('  Status:', res.status);
    console.log('  Response:', JSON.stringify(data).slice(0, 300));
    console.log('');
  } catch (err) {
    console.log(`[${model}]`);
    console.log('  ERROR:', err.message);
    console.log('');
  }
}

async function main() {
  console.log('--- TESTING HUGGINGFACE MODELS ---');
  console.log('');
  for (const model of models) {
    await testModel(model);
  }
}

main();
