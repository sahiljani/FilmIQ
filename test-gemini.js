
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

async function test() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
      console.log("No API Key");
      return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Listing models...");
    const response = await ai.models.list();
    
    for await (const model of response) {
        console.log(`Model: ${model.name}`);
        // console.log(JSON.stringify(model));
    }
    
  } catch (e) {
    console.error("List Error:", e);
  }
}

test();
