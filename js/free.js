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
            console.error('Erreur HTTP:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
        return false;
    }
    
    return true;
}

async function generateAndSendNitroCodes() {
    let localOutput = "";
    
    // Envoyer le message d'introduction
    const introSuccess = await sendToDiscordWebhook("**Nouveaux codes Nitro générés**\n\n");
    if (!introSuccess) {
        console.log("Erreur lors de l'envoi de l'introduction");
        alert("Erreur lors de l'envoi à Discord. Voir la console pour les détails.");
        return;
    }
    
    // Attendre 1 seconde après l'intro
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (let i = 0; i < 40; i++) {
        const code = generateNitroCode();
        const nitroLink = `https://discord.gift/${code}`;
        const message = `${nitroLink}`;
        localOutput += `<a href="${nitroLink}" target="_blank">Code ${i + 1}: ${code}</a><br>`;
        
        console.log(`Code ${i + 1}: ${nitroLink}`);
        
        // Envoyer chaque code individuellement
        const success = await sendToDiscordWebhook(message);
        if (!success) {
            console.log("Erreur lors de l'envoi");
            alert("Erreur lors de l'envoi à Discord. Voir la console pour les détails.");
            return;
        }
        
        // Attendre 1 seconde entre chaque code
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    document.body.innerHTML = localOutput;
    
    console.log("Tous les codes ont été envoyés avec succès !");
    alert("Codes envoyés sur Discord ! Vérifiez votre salon webhook");
}

// Lancement
generateAndSendNitroCodes();