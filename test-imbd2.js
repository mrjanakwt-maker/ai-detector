// Save as ~/Desktop/ai-detector/test-imbd2.js and run: node test-imbd2.js

const SPACE_URL = "https://machine-text-detection-imbd.hf.space";

const aiText = "Artificial intelligence has transformed the landscape of modern technology in unprecedented ways. The integration of machine learning algorithms into everyday applications has revolutionized how we interact with digital systems. Furthermore, the continuous advancement of neural network architectures has enabled more sophisticated natural language processing capabilities.";

const humanText = "The first idea of grow light on plants was by is by Andrei Famintsyn, a Russian botanist in 1868. Which is before the first light bulb was invented. There are three main types of grow lights; Fluorescent Lamps, High-pressure sodium and Light-emitting diodes. After red LED was invented in 1962 by Nick Holonyak, Jr, the grow light concept has become a more famous concept.";

async function callImBD(text, label) {
  try {
    // Newer Gradio uses /call/predict then /call/predict/{event_id}
    const submitRes = await fetch(`${SPACE_URL}/call/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [text] }),
    });
    console.log(`[${label}] Submit status:`, submitRes.status);
    const submitData = await submitRes.json();
    console.log(`[${label}] Submit response:`, JSON.stringify(submitData));

    if (submitData.event_id) {
      // Poll for result
      const resultRes = await fetch(`${SPACE_URL}/call/predict/${submitData.event_id}`);
      const resultText = await resultRes.text();
      console.log(`[${label}] Result status:`, resultRes.status);
      console.log(`[${label}] Result:`, resultText.slice(0, 500));
    }
    console.log("");
  } catch (err) {
    console.log(`[${label}] Error:`, err.message);
    console.log("");
  }
}

async function main() {
  console.log("Testing ImBD Space with correct Gradio API format...\n");
  await callImBD(aiText, "AI TEXT");
  await callImBD(humanText, "HUMAN TEXT");
  console.log("Done!");
}

main();
