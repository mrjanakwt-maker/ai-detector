// Save as ~/Desktop/ai-detector/test-imbd.js and run: node test-imbd.js

// Gradio Spaces expose an API. Let's test the ImBD Space.
// The Space URL format for API is: https://{user}-{space}.hf.space/api/predict

const SPACE_URL = "https://machine-text-detection-imbd.hf.space";

async function testInfo() {
  // First, get the API info
  try {
    const res = await fetch(`${SPACE_URL}/info`);
    console.log("Info status:", res.status);
    const data = await res.text();
    console.log("Info:", data.slice(0, 500));
    console.log("");
  } catch (err) {
    console.log("Info error:", err.message);
  }
}

async function testConfig() {
  try {
    const res = await fetch(`${SPACE_URL}/config`);
    console.log("Config status:", res.status);
    const data = await res.json();
    // Look for API endpoints
    const deps = data.dependencies || [];
    console.log("Number of endpoints:", deps.length);
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      console.log(`Endpoint ${i}: api_name=${dep.api_name}, inputs=${dep.inputs?.length}, outputs=${dep.outputs?.length}`);
    }
    console.log("");
  } catch (err) {
    console.log("Config error:", err.message);
  }
}

async function testPredict() {
  const testText = "Artificial intelligence has transformed the landscape of modern technology in unprecedented ways. The integration of machine learning algorithms into everyday applications has revolutionized how we interact with digital systems.";

  try {
    // Try the Gradio API format
    const res = await fetch(`${SPACE_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [testText] }),
    });
    console.log("Predict status:", res.status);
    const data = await res.text();
    console.log("Predict response:", data.slice(0, 500));
    console.log("");
  } catch (err) {
    console.log("Predict error:", err.message);
  }

  try {
    // Try queue/push format (newer Gradio)
    const res = await fetch(`${SPACE_URL}/queue/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [testText],
        fn_index: 0,
        session_hash: "test123",
      }),
    });
    console.log("Queue push status:", res.status);
    const data = await res.text();
    console.log("Queue push response:", data.slice(0, 500));
  } catch (err) {
    console.log("Queue push error:", err.message);
  }
}

async function main() {
  console.log("Testing ImBD Space API...\n");
  await testInfo();
  await testConfig();
  await testPredict();
  console.log("\nDone!");
}

main();
