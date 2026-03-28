// Save as ~/Desktop/ai-detector/test-models.js and run: node test-models.js

const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
let hfKey = null;
for (const line of envFile.split('\n')) {
  if (line.startsWith('HF_API_KEY=')) hfKey = line.split('=')[1].trim();
}

const aiText = 'Artificial intelligence has transformed the landscape of modern technology in unprecedented ways. The integration of machine learning algorithms into everyday applications has revolutionized how we interact with digital systems. Furthermore, the continuous advancement of neural network architectures has enabled more sophisticated natural language processing capabilities that were previously thought impossible.';

const models = [
  // Already working
  'openai-community/roberta-large-openai-detector',
  'fakespot-ai/roberta-base-ai-text-detection-v1',
  'PirateXX/AI-Content-Detector',
  'Hello-SimpleAI/chatgpt-detector-roberta',
  // Candidates to test
  'Hello-SimpleAI/chatgpt-qa-detector-roberta',
  'andreas122001/roberta-academic-detector',
  'coai/roberta-ai-detector-v2',
  'SuperAnnotate/roberta-large-llm-content-detector',
  'roberta-base-openai-detector',
  'PirateXX/AI-Content-Detector-V2',
  'PirateXX/AI-Content-Detector-Beta',
  'nealcly/detection-pergpt',
  'Hello-SimpleAI/chatgpt-detector-ling',
  'yaful/DeepfakeTextDetect-Roberta',
  'TrustSafeAI/RADAR-Vicuna-7B',
  'Organika/sdg-classifier',
  'jkhedri/AI-text-detector-roberta-large',
  'akshayvkt/detect-ai-text',
  'Meysam/AI-Sentence-Detector',
];

async function testModel(model) {
  try {
    const res = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: aiText }),
      }
    );
    const text = await res.text();
    const status = res.status;
    if (status === 200 && text.includes('label')) {
      console.log(`✅ [${model}] Status: ${status}`);
      console.log(`   ${text.slice(0, 200)}`);
    } else {
      console.log(`❌ [${model}] Status: ${status} — ${text.slice(0, 80)}`);
    }
  } catch (err) {
    console.log(`❌ [${model}] ERROR: ${err.message}`);
  }
}

async function main() {
  console.log('Testing AI detector models on HF free inference...\n');
  for (const model of models) {
    await testModel(model);
    console.log('');
  }
  console.log('Done! Models with ✅ can be used as engines.');
}

main();
