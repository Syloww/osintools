function generateNitroCode(length = 16) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

async function sendToDiscordWebhook(message) {
    const webhookUrl = 'https://discord.com/api/webhooks/1367894797171429410/O35MQnuFvsZa3JzSGKB01zVrN50eMMYMThZ910vdeDZOzA6sqRMWFufo2-KkHxKqEK12';
    
    // Découper le message si trop long (2000 caractères max par message Discord)
    const chunks = [];
    while (message.length > 0) {
        chunks.push(message.substring(0, 2000));
        message = message.substring(2000);
    }

    for (const chunk of chunks) {
        const payload = {
            content: chunk
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
                console.error('Erreur HTTP:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            return false;
        }
        
        // Pause entre les messages pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return true;
}

async function generateAndSendNitroCodes() {
    let message = "**Nouveaux codes Nitro générés**\n\n";
    let localOutput = "";
    
    for (let i = 0; i < 40; i++) {
        const code = generateNitroCode();
        const nitroLink = `https://discord.gift/${code}`;
        message += `${i + 1}. ${nitroLink}\n`;
        localOutput += `<a href="${nitroLink}" target="_blank">Code ${i + 1}: ${code}</a><br>`;
        
        console.log(`Code ${i + 1}: ${nitroLink}`);
    }
    
    document.body.innerHTML = localOutput;
    
    const success = await sendToDiscordWebhook(message);
    if (success) {
        console.log("Tous les codes ont été envoyés avec succès !");
        alert("Codes envoyés sur Discord ! Vérifiez votre salon webhook");
    } else {
        console.log("Erreur lors de l'envoi");
        alert("Erreur lors de l'envoi à Discord. Voir la console pour les détails.");
    }
}

// Lancement
generateAndSendNitroCodes();