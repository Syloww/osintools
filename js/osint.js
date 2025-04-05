 // Gestion des onglets
 document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

document.getElementById('searchForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const searchType = document.getElementById('searchType').value;
    const searchQuery = document.getElementById('searchQuery').value.trim();
    const searchButton = document.getElementById('searchButton');

    // Validate input
    if (!searchType || !searchQuery) {
        showError('Veuillez sélectionner un type de recherche et entrer une requête');
        return;
    }

    // Show loading indicator
    document.getElementById('initialMessage').classList.add('hidden');
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('searchStatus').textContent = 'Recherche en cours...';
    searchButton.disabled = true;
    searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recherche en cours...';

    try {
        let results = [];

        switch (searchType) {
            case 'phone':
                results = await searchPhoneNumber(searchQuery);
                break;
            case 'email':
                results = await searchEmail(searchQuery);
                break;
            case 'ip':
                results = await searchIP(searchQuery);
                break;
            case 'domain':
                results = await searchDomain(searchQuery);
                break;
            case 'username':
                results = await searchUsername(searchQuery);
                break;
            case 'person':
                results = await searchPerson(searchQuery);
                break;
            default:
                throw new Error('Type de recherche non supporté');
        }

        displayResults(results);
        document.getElementById('searchStatus').textContent = `${results.length} résultat(s) trouvé(s)`;
        document.getElementById('searchStatus').style.color = results.length ? 'var(--success)' : 'var(--warning)';
    } catch (error) {
        console.error('Search error:', error);
        showError(`Erreur lors de la recherche: ${error.message}`);
        document.getElementById('searchStatus').textContent = 'Erreur lors de la recherche';
        document.getElementById('searchStatus').style.color = 'var(--danger)';
    } finally {
        document.getElementById('loadingIndicator').classList.add('hidden');
        searchButton.disabled = false;
        searchButton.innerHTML = '<i class="fas fa-search"></i> Rechercher';
    }
});

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').classList.remove('hidden');
}

async function searchEmail(email) {
    const results = [];

    // 1. Validate email syntax first
    const validationResult = validateEmailSyntax(email);
    results.push({
        title: '<i class="fas fa-check-circle"></i> Validation email',
        content: validationResult.message,
        badge: validationResult.valid ? '<span class="badge badge-success">Valide</span>' : '<span class="badge badge-danger">Invalide</span>',
        source: 'Validation syntaxique'
    });

    if (!validationResult.valid) {
        return results;
    }

    // 2. Check email with AbstractAPI (free tier)
    try {
        const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=YOUR_ABSTRACT_API_KEY&email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.is_valid_format?.value === false) {
            results.push({
                title: '<i class="fas fa-times-circle"></i> Format email',
                content: 'Le format de cet email est invalide selon AbstractAPI',
                badge: '<span class="badge badge-danger">Invalide</span>',
                source: 'AbstractAPI'
            });
            return results;
        }

        let deliverabilityStatus = '';
        let deliverabilityBadge = '';

        if (data.deliverability === 'DELIVERABLE') {
            deliverabilityStatus = 'Cet email est probablement livrable';
            deliverabilityBadge = '<span class="badge badge-success">Livrable</span>';
        } else if (data.deliverability === 'UNDELIVERABLE') {
            deliverabilityStatus = 'Cet email est probablement non livrable';
            deliverabilityBadge = '<span class="badge badge-danger">Non livrable</span>';
        } else {
            deliverabilityStatus = 'Statut de livraison inconnu';
            deliverabilityBadge = '<span class="badge badge-warning">Inconnu</span>';
        }

        results.push({
            title: '<i class="fas fa-truck"></i> Livrabilité email',
            content: deliverabilityStatus,
            badge: deliverabilityBadge,
            source: 'AbstractAPI'
        });

        // Check if it's a disposable email
        if (data.is_disposable_email?.value) {
            results.push({
                title: '<i class="fas fa-trash-alt"></i> Email jetable',
                content: 'Cet email provient d\'un service d\'emails jetables (temporaires)',
                badge: '<span class="badge badge-warning">Jetable</span>',
                source: 'AbstractAPI'
            });
        }

        // Check if it's a free email
        if (data.is_free_email?.value) {
            results.push({
                title: '<i class="fas fa-envelope-open-text"></i> Email gratuit',
                content: 'Cet email provient d\'un service de messagerie gratuit (Gmail, Yahoo, etc.)',
                badge: '<span class="badge badge-info">Gratuit</span>',
                source: 'AbstractAPI'
            });
        }
    } catch (e) {
        console.warn('AbstractAPI email validation error:', e);
        results.push({
            title: '<i class="fas fa-exclamation-triangle"></i> Erreur de validation',
            content: 'Impossible de valider l\'email avec AbstractAPI',
            badge: '<span class="badge badge-warning">Erreur</span>',
            source: 'AbstractAPI'
        });
    }

    // 3. Check for breaches with Have I Been Pwned (no API key needed)
    try {
        const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
            headers: {
                'User-Agent': 'OSINTool-Pro'
            }
        });

        if (response.status === 404) {
            results.push({
                title: '<i class="fas fa-shield-alt"></i> Fuites de données',
                content: 'Aucune fuite trouvée pour cette adresse email dans Have I Been Pwned',
                badge: '<span class="badge badge-success">Sécurisé</span>',
                source: 'Have I Been Pwned'
            });
        } else if (response.ok) {
            const breaches = await response.json();
            const breachList = breaches.map(b =>
                `<strong>${b.Name}</strong> (${new Date(b.BreachDate).toLocaleDateString()}) - ${b.Description}`
            ).join('<br><br>');

            results.push({
                title: '<i class="fas fa-exclamation-triangle"></i> Fuites de données',
                content: `Cette adresse email a été compromise dans ${breaches.length} fuites:<br><br>${breachList}`,
                badge: `<span class="badge badge-danger">${breaches.length} fuite(s)</span>`,
                source: 'Have I Been Pwned'
            });
        }
    } catch (e) {
        console.warn('HIBP API error:', e);
        results.push({
            title: '<i class="fas fa-exclamation-triangle"></i> Vérification des fuites',
            content: 'Impossible de vérifier les fuites de données pour cet email',
            badge: '<span class="badge badge-warning">Erreur</span>',
            source: 'Have I Been Pwned'
        });
    }

    return results;
}

function validateEmailSyntax(email) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return {
        valid: isValid,
        message: isValid
            ? 'Format email valide'
            : 'Format email invalide - doit contenir un @ et un domaine valide'
    };
}

async function searchPhoneNumber(phoneNumber) {
    const results = [];

    // Normalisation du numéro (supprime tous les caractères non numériques)
    const normalizedPhone = phoneNumber.replace(/[^\d+]/g, '');

    // Validation de base
    if (!normalizedPhone.match(/^\+?[\d\s]{8,}$/)) {
        results.push({
            title: '<i class="fas fa-times-circle"></i> Format invalide',
            content: 'Le numéro doit contenir au moins 8 chiffres. Format international recommandé: +33123456789',
            badge: '<span class="badge badge-danger">Invalide</span>',
            source: 'Validation'
        });
        return results;
    }

    // Utilisation d'une API gratuite
    try {
        const response = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=YOUR_API_KEY&phone=${normalizedPhone}`);
        const data = await response.json();

        if (!data.valid) {
            results.push({
                title: '<i class="fas fa-times-circle"></i> Numéro invalide',
                content: data.error?.message || 'Ce numéro n\'est pas valide',
                badge: '<span class="badge badge-danger">Invalide</span>',
                source: 'AbstractAPI'
            });
            return results;
        }

        results.push({
            title: '<i class="fas fa-check-circle"></i> Numéro valide',
            content: 'Ce numéro de téléphone est valide',
            badge: '<span class="badge badge-success">Valide</span>',
            source: 'AbstractAPI'
        });

        // Format international standardisé
        const intlFormat = data.format?.international || normalizedPhone;
        results.push({
            title: '<i class="fas fa-phone-alt"></i> Format international',
            content: intlFormat,
            badge: '<span class="badge badge-info">Standard</span>',
            source: 'AbstractAPI'
        });

        // Informations de localisation
        results.push({
            title: '<i class="fas fa-globe-europe"></i> Localisation',
            content: `
        <strong>Pays:</strong> ${data.country?.name || 'Inconnu'}<br>
        <strong>Code:</strong> +${data.country?.prefix || '?'}<br>
        <strong>Opérateur:</strong> ${data.carrier || 'Inconnu'}<br>
        <strong>Type:</strong> ${data.type || 'Inconnu'}
    `,
            badge: `<span class="badge badge-info">${data.country?.name || 'Localisation'}</span>`,
            source: 'AbstractAPI'
        });

    } catch (e) {
        console.error('Phone validation error:', e);
        results.push({
            title: '<i class="fas fa-exclamation-triangle"></i> Erreur',
            content: 'Service temporairement indisponible. Essayez avec un format international: +33123456789',
            badge: '<span class="badge badge-warning">Erreur</span>',
            source: 'AbstractAPI'
        });
    }

    return results;
}

async function searchIP(ipAddress) {
    const results = [];

    // Validation améliorée de l'IP
    if (!isValidIP(ipAddress)) {
        results.push({
            title: '<i class="fas fa-times-circle"></i> IP invalide',
            content: 'Format d\'adresse IP invalide. Utilisez une IPv4 (ex: 8.8.8.8) ou IPv6',
            badge: '<span class="badge badge-danger">Invalide</span>',
            source: 'Validation'
        });
        return results;
    }

    // Utilisation d'une API gratuite et fiable
    try {
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.reason || 'Erreur de l\'API');
        }

        // Main IP information
        results.push({
            title: '<i class="fas fa-map-marker-alt"></i> Géolocalisation',
            content: `
        <strong>IP:</strong> ${data.ip || ipAddress}<br>
        <strong>Pays:</strong> ${data.country_name} (${data.country_code})<br>
        <strong>Ville:</strong> ${data.city || 'Inconnue'}<br>
        <strong>Région:</strong> ${data.region || 'Inconnue'}<br>
        <strong>Code postal:</strong> ${data.postal || 'Inconnu'}<br>
        <strong>FAI:</strong> ${data.org || 'Inconnu'}<br>
        <strong>Fuseau horaire:</strong> ${data.timezone || 'Inconnu'}
    `,
            badge: `<span class="badge badge-info">${data.country_name || 'Localisation'}</span>`,
            source: 'ipapi.co'
        });

        // Détection proxy/VPN
        if (data.proxy || data.vpn) {
            results.push({
                title: '<i class="fas fa-user-secret"></i> Anonymisation',
                content: 'Cette IP est associée à un service proxy/VPN',
                badge: '<span class="badge badge-warning">Proxy/VPN</span>',
                source: 'ipapi.co'
            });
        }

        // Create map container
        const mapContainer = document.createElement('div');
        mapContainer.id = 'map';
        mapContainer.style.height = '400px';
        mapContainer.style.marginTop = '1rem';

        // Add device information
        const deviceInfo = getDeviceInfo();
        const deviceInfoHTML = `
            <div class="device-info-grid">
                <div class="device-info-item">
                    <div class="device-info-label">Navigateur</div>
                    <div class="device-info-value">${deviceInfo.browser}</div>
                </div>
                <div class="device-info-item">
                    <div class="device-info-label">Système d'exploitation</div>
                    <div class="device-info-value">${deviceInfo.os}</div>
                </div>
                <div class="device-info-item">
                    <div class="device-info-label">Résolution d'écran</div>
                    <div class="device-info-value">${deviceInfo.screenResolution}</div>
                </div>
                <div class="device-info-item">
                    <div class="device-info-label">Batterie</div>
                    <div class="device-info-value">${deviceInfo.batteryLevel}</div>
                </div>
                <div class="device-info-item">
                    <div class="device-info-label">Langue</div>
                    <div class="device-info-value">${deviceInfo.language}</div>
                </div>
                <div class="device-info-item">
                    <div class="device-info-label">Connexion</div>
                    <div class="device-info-value">${deviceInfo.connection}</div>
                </div>
            </div>
        `;

        // Add map and device info to results
        results.push({
            title: '<i class="fas fa-map"></i> Carte de localisation',
            content: mapContainer.outerHTML + deviceInfoHTML,
            badge: '<span class="badge badge-info">Carte</span>',
            source: 'Leaflet Maps'
        });

        // Display results first
        displayResults(results);

        // Then initialize map (need to wait for DOM update)
        setTimeout(() => {
            if (data.latitude && data.longitude) {
                initMap(data.latitude, data.longitude, data.city || 'Localisation', ipAddress);
            }
        }, 100);

    } catch (e) {
        console.error('IP search error:', e);
        results.push({
            title: '<i class="fas fa-exclamation-triangle"></i> Erreur',
            content: 'Impossible de géolocaliser cette IP. Essayez avec une IP publique.',
            badge: '<span class="badge badge-danger">Erreur</span>',
            source: 'ipapi.co'
        });
    }

    return results;
}

// Initialize Leaflet map
function initMap(lat, lng, locationName, ipAddress) {
    const map = L.map('map').setView([lat, lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${locationName}</b><br>IP: ${ipAddress}`)
        .openPopup();
}

// Get device information
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Inconnu';
    let os = 'Inconnu';
    
    // Detect browser
    if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
    } else if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
    } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
    } else if (userAgent.includes('Opera')) {
        browser = 'Opera';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) {
        browser = 'Internet Explorer';
    }
    
    // Detect OS
    if (userAgent.includes('Windows')) {
        os = 'Windows';
    } else if (userAgent.includes('Mac')) {
        os = 'macOS';
    } else if (userAgent.includes('Linux')) {
        os = 'Linux';
    } else if (userAgent.includes('Android')) {
        os = 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        os = 'iOS';
    }
    
    // Get battery info if available
    let batteryLevel = 'Non disponible';
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            batteryLevel = `${Math.round(battery.level * 100)}% ${battery.charging ? '(En charge)' : ''}`;
            document.querySelector('.device-info-value').textContent = batteryLevel;
        });
    }
    
    // Get screen resolution
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    
    // Get language
    const language = navigator.language || navigator.userLanguage || 'Inconnu';
    
    // Get connection info
    let connection = 'Inconnu';
    if ('connection' in navigator) {
        const conn = navigator.connection;
        if (conn) {
            connection = `${conn.effectiveType || 'Inconnu'}`;
            if (conn.downlink) {
                connection += ` ~${Math.round(conn.downlink)} Mbps`;
            }
        }
    }
    
    return {
        browser,
        os,
        batteryLevel,
        screenResolution,
        language,
        connection
    };
}

// Validation améliorée des IP
function isValidIP(ip) {
    // IPv4
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 (simplifiée)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

async function searchDomain(domain) {
    const results = [];

    // Validate domain format first
    if (!isValidDomain(domain)) {
        results.push({
            title: '<i class="fas fa-times-circle"></i> Domaine invalide',
            content: 'Ce nom de domaine est invalide',
            badge: '<span class="badge badge-danger">Invalide</span>',
            source: 'Validation'
        });
        return results;
    }

    // WHOIS information
    results.push({
        title: '<i class="fas fa-info-circle"></i> Informations WHOIS',
        content: `Les informations WHOIS complètes sont disponibles sur <a href="https://www.whois.com/whois/${domain}" target="_blank">whois.com</a>`,
        badge: '<span class="badge badge-info">WHOIS</span>',
        source: 'WHOIS.com'
    });

    // Check domain age
    try {
        const response = await fetch(`https://api.whoapi.com/?domain=${domain}&r=whois&apikey=YOUR_WHOAPI_KEY`);
        const data = await response.json();

        if (data.created) {
            const createdDate = new Date(data.created);
            const ageInDays = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));

            results.push({
                title: '<i class="fas fa-calendar-alt"></i> Âge du domaine',
                content: `
                    Créé le: ${createdDate.toLocaleDateString()}<br>
                    Âge: ~${ageInDays} jours (${Math.floor(ageInDays / 365)} ans)
                `,
                badge: `<span class="badge badge-info">${Math.floor(ageInDays / 365)} ans</span>`,
                source: 'WHOAPI'
            });
        }
    } catch (e) {
        console.warn('Domain age check error:', e);
    }

    // Check SSL certificate
    try {
        const response = await fetch(`https://api.ssllabs.com/api/v3/analyze?host=${domain}`);
        const data = await response.json();

        if (data.status === 'READY') {
            const grade = data.endpoints[0]?.grade || 'Inconnu';
            results.push({
                title: '<i class="fas fa-lock"></i> Certificat SSL',
                content: `Note SSL: ${grade}`,
                badge: `<span class="badge ${grade === 'A' || grade === 'A+' ? 'badge-success' : 'badge-warning'}">${grade}</span>`,
                source: 'SSL Labs'
            });
        }
    } catch (e) {
        console.warn('SSL check error:', e);
    }

    return results;
}

function isValidDomain(domain) {
    // Simple domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

async function searchUsername(username) {
    const results = [];

    // Check various social networks
    const socialNetworks = [
        { name: 'Twitter', url: `https://twitter.com/${username}`, icon: 'fab fa-twitter' },
        { name: 'Instagram', url: `https://instagram.com/${username}`, icon: 'fab fa-instagram' },
        { name: 'GitHub', url: `https://github.com/${username}`, icon: 'fab fa-github' },
        { name: 'Reddit', url: `https://reddit.com/user/${username}`, icon: 'fab fa-reddit' },
        { name: 'Facebook', url: `https://facebook.com/${username}`, icon: 'fab fa-facebook' },
        { name: 'LinkedIn', url: `https://linkedin.com/in/${username}`, icon: 'fab fa-linkedin' },
        { name: 'YouTube', url: `https://youtube.com/user/${username}`, icon: 'fab fa-youtube' },
        { name: 'TikTok', url: `https://tiktok.com/@${username}`, icon: 'fab fa-tiktok' }
    ];

    // Check which profiles exist
    const profileChecks = await Promise.all(socialNetworks.map(async network => {
        try {
            const response = await fetch(network.url, { method: 'HEAD', mode: 'no-cors' });
            return { ...network, exists: true };
        } catch (e) {
            return { ...network, exists: false };
        }
    }));

    const existingProfiles = profileChecks.filter(p => p.exists);

    if (existingProfiles.length > 0) {
        results.push({
            title: '<i class="fas fa-user-check"></i> Profils trouvés',
            content: existingProfiles.map(n =>
                `<a href="${n.url}" target="_blank" rel="noopener noreferrer"><i class="${n.icon}"></i> ${n.name}</a>`
            ).join(' | '),
            badge: `<span class="badge badge-success">${existingProfiles.length} profil(s)</span>`,
            source: 'Réseaux sociaux'
        });
    } else {
        results.push({
            title: '<i class="fas fa-user-times"></i> Profils sociaux',
            content: 'Aucun profil trouvé sur les réseaux sociaux principaux',
            badge: '<span class="badge badge-warning">Aucun</span>',
            source: 'Réseaux sociaux'
        });
    }

    // Check username on other services
    results.push({
        title: '<i class="fas fa-search-plus"></i> Autres vérifications',
        content: `
            Vous pouvez vérifier ce nom d'utilisateur sur:<br><br>
            <a href="https://whatsmyname.app/?q=${username}" target="_blank">WhatsMyName</a> - Vérification sur 500+ sites<br>
            <a href="https://namechk.com/?q=${username}" target="_blank">Namechk</a> - Disponibilité du nom<br>
            <a href="https://checkusernames.com/${username}" target="_blank">CheckUsernames</a> - Vérification multi-sites
        `,
        badge: '<span class="badge badge-info">Outils</span>',
        source: 'Services tiers'
    });

    return results;
}

async function searchPerson(name) {
    const results = [];

    // Basic name validation
    if (!name.includes(' ')) {
        results.push({
            title: '<i class="fas fa-exclamation-triangle"></i> Format invalide',
            content: 'Pour une recherche de personne, veuillez entrer au moins un prénom et un nom',
            badge: '<span class="badge badge-warning">Incomplet</span>',
            source: 'Validation'
        });
        return results;
    }

    // Search suggestions
    results.push({
        title: '<i class="fas fa-user-tag"></i> Recherche de personne',
        content: `
            Pour rechercher une personne, essayez ces services:<br><br>
            <a href="https://www.google.com/search?q="${encodeURIComponent(name)}"" target="_blank">Google (recherche exacte)</a><br>
            <a href="https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}" target="_blank">LinkedIn</a><br>
            <a href="https://www.facebook.com/search/people/?q=${encodeURIComponent(name)}" target="_blank">Facebook</a><br>
            <a href="https://pipl.com/search/?q=${encodeURIComponent(name)}" target="_blank">Pipl</a><br>
            <a href="https://thatsthem.com/name/${encodeURIComponent(name.replace(' ', '-'))}" target="_blank">That's Them</a>
        `,
        badge: '<span class="badge badge-info">Ressources</span>',
        source: 'Services de recherche'
    });

    return results;
}

function displayResults(results) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = `
            <div class="result-card">
                <div class="result-title"><i class="fas fa-info-circle"></i> Aucun résultat</div>
                <div class="result-content">Aucune information trouvée pour cette recherche. Essayez avec des termes différents.</div>
                <div class="result-source"><i class="fas fa-database"></i> OSINTool Pro</div>
            </div>
        `;
        return;
    }

    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-card';

        card.innerHTML = `
            <div class="result-title">${result.title} ${result.badge || ''}</div>
            <div class="result-content">${result.content}</div>
            ${result.source ? `<div class="result-source"><i class="fas fa-database"></i> Source: ${result.source}</div>` : ''}
        `;

        container.appendChild(card);
    });
}