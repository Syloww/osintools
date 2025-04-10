import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const { prompt } = req.body;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Clé API manquante" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ou "gpt-4", "gpt-4-turbo", "gpt-4o" si vous y avez accès
      messages: [{ role: "user", content: prompt }]
    });

    return res.status(200).json({ 
      message: response.choices[0]?.message?.content 
    });

  } catch (error) {
    console.error("Erreur OpenAI:", error);
    
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = error.response.data?.error?.message || errorMessage;
    }

    return res.status(500).json({ 
      error: errorMessage,
      code: error.code,
      type: error.type
    });
  }
}