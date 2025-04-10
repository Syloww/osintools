// api/ask.js
const fetch = require("node-fetch");

export default async function handler(req, res) {
  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    // Vérifie si la clé API est bien définie
    if (!apiKey) {
      return res.status(500).json({ error: "Clé API manquante" });
    }

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

    // Vérifie si la réponse est OK
    if (!response.ok) {
      const errorMessage = await response.text(); // Récupérer le texte d'erreur
      return res.status(500).json({ error: errorMessage });
    }

    const data = await response.json();
    return res.status(200).json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error("Erreur serveur :", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
}
