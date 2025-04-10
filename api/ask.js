// api/ask.js
export default async function handler(req, res) {
    const { prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    try {
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

        // Modifiez la partie de gestion d'erreur
        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.json();
                if (errorData.error?.code === 'insufficient_quota') {
                    errorMessage = "Quota API épuisé. Veuillez vérifier votre compte OpenAI.";
                } else {
                    errorMessage = errorData.error?.message || JSON.stringify(errorData);
                }
            } catch {
                errorMessage = await response.text();
            }
            return res.status(500).json({
                error: errorMessage,
                help: "Voir https://platform.openai.com/docs/guides/error-codes/api-errors"
            });
        }

        const data = await response.json();
        return res.status(200).json({ message: data.choices[0].message.content });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur interne du serveur." });
    }
}