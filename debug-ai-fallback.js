
const { GoogleGenerativeAI } = require("@google/generative-ai");

// User's key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyApukxacGP5kXsHSkB3fZFhPShQAxTFV9A");

const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro"
];

async function testModels() {
  console.log("Testing models connectivity...");
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`\nTesting ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say 'OK'");
      const response = await result.response;
      console.log(`✅ SUCCESS: ${modelName} responded: ${response.text().trim()}`);
    } catch (error) {
      console.log(`❌ FAILED: ${modelName} - Error: ${error.message.split('[')[0]}...`); // Shorten error
    }
  }
}

testModels();
