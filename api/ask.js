// api/ask.js
const fetch = require("node-fetch");

export default async function handler(req, res) {
  const { prompt } = req.body;
  console.log("Prompt reçu :", prompt); // Log du prompt

  const apiKey = process.env.OPENAI_API_KEY;
  console.log("Clé API :", apiKey); // Log de la clé API (à ne pas laisser en prod, juste pour debug)

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error("Erreur avec l'API OpenAI");
    }

    const data = await response.json();
    res.status(200).json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error("Erreur dans la fonction API :", error);
    res.status(500).json({ error: error.message });
  }
}
