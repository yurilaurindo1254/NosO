
async function listModels() {
  const key = "AIzaSyApukxacGP5kXsHSkB3fZFhPShQAxTFV9A"; // Hardcoded for test
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  console.log("Fetching models from:", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    const fs = require('fs');
    fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
    console.log("Models written to models.json");
  } catch(e) {
    console.error("Error listing models:", e);
  }
}

listModels();
