const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
let key = null;
for (const line of envFile.split('\n')) {
  if (line.startsWith('SAPLING_API_KEY=')) {
    key = line.split('=')[1].trim();
  }
}
console.log('Key found:', !!key, 'length:', key?.length);

fetch('https://api.sapling.ai/api/v1/aidetect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: key,
    text: 'Artificial intelligence has transformed the landscape of modern technology in unprecedented ways. The integration of machine learning algorithms into everyday applications has revolutionized how we interact with digital systems.'
  })
})
.then(r => { console.log('Status:', r.status); return r.json(); })
.then(d => console.log('Response:', JSON.stringify(d, null, 2)))
.catch(e => console.log('Error:', e.message));
