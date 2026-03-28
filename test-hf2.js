// Save this as ~/Desktop/ai-detector/test-hf2.js and run: node test-hf2.js

const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');

let hfKey = null;
for (const line of lines) {
  if (line.startsWith('HF_API_KEY=')) {
    hfKey = line.split('=')[1].trim();
  }
}

console.log('HF_API_KEY found:', !!hfKey);
console.log('Using NEW endpoint: router.huggingface.co');
console.log('');

const models = [
  'openai-community/roberta-base-openai-detector',
  'openai-community/roberta-large-openai-detector',
  'coai/roberta-ai-detector-v2',
  'SuperAnnotate/roberta-large-llm-content-detector',
];

const testText = 'Artificial intelligence has transformed the landscape of modern technology in unprecedented ways. The integration of machine learning algorithms into everyday applications has revolutionized how we interact with digital systems. Furthermore, the continuous advancement of neural network architectures has enabled more sophisticated natural language processing capabilities.';

async function testModel(model) {
  try {
    const res = await fetch(
      `https://router.huggingface.co/models/${model}`,
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
    console.log('  Response:', JSON.stringify(data).slice(0, 500));
    console.log('');
  } catch (err) {
    console.log(`[${model}]`);
    console.log('  ERROR:', err.message);
    console.log('');
  }
}

async function main() {
  for (const model of models) {
    await testModel(model);
  }
  console.log('Done! If you see Status 200 with label/score data, the fix works.');
}

main();
