import OpenAI from "openai";

// Initialisation sécurisée
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY?.trim()
  });
} catch (err) {
  console.error("Erreur d'initialisation OpenAI:", err);
}

export default async function handler(req, res) {
  // Vérification préalable
  if (!openai) {
    return res.status(500).json({ 
      error: "Client OpenAI non initialisé",
      details: "Vérifiez la clé API et la configuration"
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt manquant' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || "Aucune réponse";
    return res.status(200).json({ message: response });

  } catch (error) {
    console.error("Erreur complète:", error);
    return res.status(500).json({
      error: "Erreur serveur",
      type: error.type,
      code: error.code,
      message: error.message,
      details: error.response?.data || null
    });
  }
}