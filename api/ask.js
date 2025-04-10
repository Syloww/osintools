// api/ask.js
const fetch = require("node-fetch");

export default async function handler(req, res) {
  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;  // Récupérer la clé depuis la variable d'environnement

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

  const data = await response.json();
  res.status(200).json({ message: data.choices[0].message.content });
}
