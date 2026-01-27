
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Hardcoded key for debugging script (user provided in prompt)
const genAI = new GoogleGenerativeAI("AIzaSyApukxacGP5kXsHSkB3fZFhPShQAxTFV9A");

async function test() {
  console.log("Testing Gemini API...");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-flash!");
    console.log(result.response.text());
  } catch (e) {
    console.error("Failed gemini-1.5-flash:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-pro!");
    console.log(result.response.text());
  } catch (e) {
    console.error("Failed gemini-pro:", e.message);
  }
}

test();
