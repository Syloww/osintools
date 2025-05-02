function generateNitroCode(length = 16) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

async function sendToDiscordWebhook(message) {
    const webhookUrl = 'https://discord.com/api/webhooks/1367894797171429410/O35MQnuFvsZa3JzSGKB01zVrN50eMMYMThZ910vdeDZOzA6sqRMWFufo2-KkHxKqEK12'; // Remplacez par votre URL de webhook
    const payload = {
        content: message
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            console.error('Erreur lors de l\'envoi au webhook:', response.statusText);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function generateAndSendNitroCodes() {
    let message = "Voici vos codes Nitro générés:\n\n";
    
    for (let i = 0; i < 40; i++) {
        const code = generateNitroCode();
        const nitroLink = `https://discord.gift/${code}`;
        message += `Nitro Code ${i + 1}: ${nitroLink}\n`;
        
        // Afficher aussi dans la console et sur la page
        console.log(`Nitro Code ${i + 1}: ${nitroLink}`);
        document.querySelector("body").innerHTML += 
            `<a href="${nitroLink}" target="_blank">Nitro Code ${i + 1}: ${code}</a><br>`;
    }
    
    // Envoyer le message complet via le webhook
    await sendToDiscordWebhook(message);
    console.log("Tous les codes ont été envoyés sur Discord!");
}

// Démarrer le processus
generateAndSendNitroCodes();