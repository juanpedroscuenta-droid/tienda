require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no direct listModels in the simple SDK, but we can try to initialize and check
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Checking gemini-1.5-flash...");
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (err) {
    console.error("Error with gemini-1.5-flash:", err.message);
    
    try {
        console.log("Checking models/gemini-1.5-flash...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success with models/gemini-1.5-flash:", result.response.text());
    } catch (err2) {
        console.error("Error with models/gemini-1.5-flash:", err2.message);
    }
  }
}

checkModels();
