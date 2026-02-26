// Configuration et variables globales
let currentQRCode = null;
let currentFormat = 'svg';
let currentOptions = {
    errorCorrectionLevel: 'M', // L, M, Q, H
    pixelsPerSquare: 3,
    calculatedSize: 75
};

// Mapping des niveaux de correction d'erreur
const ERROR_CORRECTION_LEVELS = [
    { value: 'L', label: 'L (~7%)', percentage: 7, qrCodeLevel: 'L' },
    { value: 'M', label: 'M (~15%)', percentage: 15, qrCodeLevel: 'M' },
    { value: 'Q', label: 'Q (~25%)', percentage: 25, qrCodeLevel: 'Q' },
    { value: 'H', label: 'H (~30%)', percentage: 30, qrCodeLevel: 'H' }
];

// Template vCard
const VCARD_TEMPLATE = `BEGIN:VCARD
VERSION:3.0

N:Nom;Prenom;;;
FN:Prenom Nom

TITLE:Titre

EMAIL;TYPE=PREF,INTERNET:email@adress.com

TEL;TYPE=cell:+33 6 00 00 00

ADR;TYPE=home:;;00 nom de rue;Ville;;00000;Pays

URL:https://url

END:VCARD`;

// Éléments DOM
const contentTextarea = document.getElementById('content');
const pixelSizeInput = document.getElementById('pixel-size-input');
const redundancySlider = document.getElementById('redundancy-slider');
const redundancyDisplay = document.getElementById('redundancy-display');
const calculatedSizeDisplay = document.getElementById('calculated-size');
const qrPreview = document.getElementById('qr-preview');
const downloadBtn = document.getElementById('download-btn');
const formatRadios = document.querySelectorAll('input[name="format"]');
const contentTypeRadios = document.querySelectorAll('input[name="content-type"]');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    autoResizeTextarea();
    initializeApp();
    generateQRCode();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Textarea content
    contentTextarea.addEventListener('input', debounce(generateQRCode, 300));
    contentTextarea.addEventListener('input', autoResizeTextarea);
    
    // Format radio
    formatRadios.forEach(radio => {
        radio.addEventListener('change', handleFormatChange);
    });
    
    // Content type radio
    contentTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleContentTypeChange);
    });
    
    // Contrôles
    pixelSizeInput.addEventListener('input', handlePixelSizeChange);
    redundancySlider.addEventListener('input', handleRedundancyChange);
    
    // Bouton de téléchargement
    downloadBtn.addEventListener('click', downloadQRCode);
}

// Gestion du changement de type de contenu
function handleContentTypeChange(e) {
    const contentType = e.target.value;
    
    if (contentType === 'vcard') {
        // Préremplir avec le template vCard
        contentTextarea.value = VCARD_TEMPLATE;
        contentTextarea.placeholder = 'Template vCard - Modifiez les informations';
    } else {
        // Mode libre
        if (contentTextarea.value === VCARD_TEMPLATE) {
            contentTextarea.value = '';
        }
        contentTextarea.placeholder = 'Entrez votre texte ici... (ex: URL, texte, vCard, etc.)';
    }
    
    // Déclencher la génération du QR code
    autoResizeTextarea();
    generateQRCode();
}

// Gestion du changement de format
function handleFormatChange(e) {
    currentFormat = e.target.value;
}

// Gestion du changement de pixels par carré
function handlePixelSizeChange(e) {
    const pixelSize = parseInt(e.target.value);
    if (pixelSize >= 1 && pixelSize <= 10) {
        currentOptions.pixelsPerSquare = pixelSize;
        updateDisplay();
        generateQRCode();
    }
}

// Gestion du changement de niveau de correction d'erreur
function handleRedundancyChange(e) {
    const levelIndex = parseInt(e.target.value);
    const level = ERROR_CORRECTION_LEVELS[levelIndex];
    
    currentOptions.errorCorrectionLevel = level.qrCodeLevel;
    redundancyDisplay.textContent = level.label;
    
    generateQRCode();
}

// Mise à jour de l'affichage
function updateDisplay() {
    if (currentQRCode) {
        const modules = currentQRCode.getModuleCount();
        currentOptions.calculatedSize = modules * currentOptions.pixelsPerSquare;
        calculatedSizeDisplay.textContent = `${currentOptions.calculatedSize} × ${currentOptions.calculatedSize} px`;
    }
}

// Génération du QR code avec qrcode-generator
function generateQRCode() {
    const content = contentTextarea.value.trim();
    
    if (!content) {
        qrPreview.innerHTML = '<div class="qr-placeholder">Entrez du texte pour générer un QR code</div>';
        qrPreview.classList.remove('has-qr');
        currentQRCode = null;
        return;
    }
    
    try {
        // Vérifier que la bibliothèque est chargée
        if (typeof qrcode === 'undefined') {
            console.error('La bibliothèque qrcode-generator n\'est pas chargée');
            qrPreview.innerHTML = '<div class="qr-placeholder">Erreur: Bibliothèque non chargée<br><small>Vérifiez votre connexion internet</small></div>';
            qrPreview.classList.remove('has-qr');
            return;
        }
        
        // Créer le QR code
        // typeNumber: 0 = auto-détection
        // errorCorrectionLevel: 'L', 'M', 'Q', 'H' (directement en string)
        const qr = qrcode(0, currentOptions.errorCorrectionLevel);
        qr.addData(content);
        qr.make();
        
        // Stocker le QR code pour le téléchargement
        currentQRCode = qr;
        
        // Calculer la taille
        const modules = qr.getModuleCount();
        currentOptions.calculatedSize = modules * currentOptions.pixelsPerSquare;
        
        // Mettre à jour l'affichage de la taille
        calculatedSizeDisplay.textContent = `${currentOptions.calculatedSize} × ${currentOptions.calculatedSize} px`;
        
        // Créer le SVG manuellement pour un rendu parfait
        const cellSize = currentOptions.pixelsPerSquare;
        const size = modules * cellSize;
        
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`;
        svgContent += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
        
        // Dessiner les modules noirs
        for (let row = 0; row < modules; row++) {
            for (let col = 0; col < modules; col++) {
                if (qr.isDark(row, col)) {
                    const x = col * cellSize;
                    const y = row * cellSize;
                    svgContent += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
                }
            }
        }
        
        svgContent += '</svg>';
        
        // Afficher le SVG
        qrPreview.innerHTML = svgContent;
        qrPreview.classList.add('has-qr');
        
        console.log(`QR Code généré: ${modules}x${modules} modules, taille: ${size}x${size}px, niveau: ${currentOptions.errorCorrectionLevel}`);
        
    } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error);
        qrPreview.innerHTML = `<div class="qr-placeholder">Erreur lors de la génération<br><small>${error.message}</small></div>`;
        qrPreview.classList.remove('has-qr');
        currentQRCode = null;
    }
}

// Téléchargement du QR code
function downloadQRCode() {
    if (!currentQRCode) {
        alert('Aucun QR code à télécharger');
        return;
    }
    
    const content = contentTextarea.value.trim();
    if (!content) {
        alert('Veuillez entrer du contenu avant de télécharger');
        return;
    }
    
    if (currentFormat === 'png') {
        downloadAsPNG();
    } else {
        downloadAsSVG();
    }
}

// Téléchargement en SVG
function downloadAsSVG() {
    const svgElement = qrPreview.querySelector('svg');
    if (!svgElement) {
        alert('Aucun QR code SVG à télécharger');
        return;
    }
    
    // Récupérer le contenu SVG complet
    const svgContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgElement.outerHTML;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = 'qrcode.svg';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Téléchargement en PNG
function downloadAsPNG() {
    const svgElement = qrPreview.querySelector('svg');
    if (!svgElement) {
        alert('Aucun QR code à télécharger');
        return;
    }
    
    // Créer un canvas pour convertir le SVG en PNG
    const canvas = document.createElement('canvas');
    const size = currentOptions.calculatedSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Désactiver le lissage pour garder les pixels nets
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Convertir le SVG en image
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        
        // Télécharger le PNG
        canvas.toBlob(function(blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        }, 'image/png');
    };
    
    img.onerror = function() {
        alert('Erreur lors de la conversion en PNG');
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
}

// Fonction de debounce pour limiter les appels
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fonction pour redimensionner automatiquement le textarea
function autoResizeTextarea() {
    const textarea = contentTextarea;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 400);
    textarea.style.height = Math.max(newHeight, 120) + 'px';
}

// Fonction d'initialisation complète
function initializeApp() {
    // Initialiser les valeurs par défaut
    const levelIndex = parseInt(redundancySlider.value) || 1;
    const level = ERROR_CORRECTION_LEVELS[levelIndex];
    
    currentOptions.errorCorrectionLevel = level.qrCodeLevel;
    currentOptions.pixelsPerSquare = parseInt(pixelSizeInput.value) || 3;
    
    redundancyDisplay.textContent = level.label;
    
    console.log('Application initialisée avec:', currentOptions);
}
