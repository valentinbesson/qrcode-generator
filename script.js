// Configuration et variables globales
let currentQRCode = null;
let currentFormat = 'svg';
let currentOptions = {
    redundancy: 15,
    pixelsPerSquare: 3,
    calculatedSize: 75,
    errorCorrectionLevel: 'M'
};

// Éléments DOM
const contentTextarea = document.getElementById('content');
const pixelSizeInput = document.getElementById('pixel-size-input');
const redundancySlider = document.getElementById('redundancy-slider');
const redundancyDisplay = document.getElementById('redundancy-display');
const calculatedSizeDisplay = document.getElementById('calculated-size');
const errorLevelDisplay = document.getElementById('error-level-display');
const qrPreview = document.getElementById('qr-preview');
const downloadBtn = document.getElementById('download-btn');
const sizeWarning = document.getElementById('size-warning');
const minSizeSpan = document.getElementById('min-size');

// Options radio
const formatRadios = document.querySelectorAll('input[name="format"]');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    autoResizeTextarea(); // Initialise la taille du textarea
    initializeApp(); // Initialisation complète
    generateQRCode();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    console.log('Setting up event listeners...'); // Debug
    console.log('Redundancy slider found:', !!redundancySlider); // Debug
    
    // Textarea content
    contentTextarea.addEventListener('input', debounce(calculateAndUpdateDisplay, 500));
    contentTextarea.addEventListener('input', autoResizeTextarea);
    
    // Format radio
    formatRadios.forEach(radio => {
        radio.addEventListener('change', handleFormatChange);
    });
    
    // Contrôles
    pixelSizeInput.addEventListener('input', handlePixelSizeChange);
    
    // Slider de redondance
    if (redundancySlider) {
        console.log('Adding redundancy slider listeners'); // Debug
        redundancySlider.addEventListener('input', handleRedundancyChange);
        redundancySlider.addEventListener('change', handleRedundancyChange);
    } else {
        console.error('Redundancy slider not found!'); // Debug
    }
    
    // Bouton de téléchargement
    downloadBtn.addEventListener('click', downloadQRCode);
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
        calculateAndUpdateDisplay();
    }
}

// Gestion du changement de redondance via slider
function handleRedundancyChange(e) {
    const redundancy = parseInt(e.target.value);
    console.log('Redundancy slider changed to:', redundancy); // Debug
    currentOptions.redundancy = redundancy;
    
    // Mapper la redondance vers le niveau de correction d'erreur
    if (redundancy <= 7) {
        currentOptions.errorCorrectionLevel = 'L';
    } else if (redundancy <= 15) {
        currentOptions.errorCorrectionLevel = 'M';
    } else if (redundancy <= 25) {
        currentOptions.errorCorrectionLevel = 'Q';
    } else {
        currentOptions.errorCorrectionLevel = 'H';
    }
    
    calculateAndUpdateDisplay();
}

// Fonction principale de calcul et mise à jour de l'affichage
function calculateAndUpdateDisplay() {
    const content = contentTextarea.value.trim();
    
    // Calculer le nombre de modules nécessaires
    const modules = estimateQRModules(content, currentOptions.errorCorrectionLevel);
    
    // Calculer la taille finale
    currentOptions.calculatedSize = modules * currentOptions.pixelsPerSquare;
    
    // Mettre à jour l'affichage
    if (redundancyDisplay) {
        redundancyDisplay.textContent = currentOptions.redundancy + '%';
    }
    
    if (calculatedSizeDisplay) {
        calculatedSizeDisplay.textContent = `${currentOptions.calculatedSize} × ${currentOptions.calculatedSize} px`;
    }
    
    if (errorLevelDisplay) {
        errorLevelDisplay.textContent = `(${currentOptions.errorCorrectionLevel})`;
    }
    
    console.log('Calculated size:', currentOptions.calculatedSize, 'px for', modules, 'modules at', currentOptions.pixelsPerSquare, 'px/square'); // Debug
    
    // Regénérer le QR code
    generateQRCode();
}

// Calcul du nombre de modules (carrés) d'un QR code selon le contenu et niveau d'erreur
function estimateQRModules(content, errorLevel) {
    const length = content.length;
    
    // Estimation simplifiée basée sur la longueur du contenu et le niveau d'erreur
    // Ces valeurs sont approximatives et basées sur les spécifications QR
    let baseModules;
    
    if (length <= 25) baseModules = 21; // Version 1
    else if (length <= 47) baseModules = 25; // Version 2
    else if (length <= 77) baseModules = 29; // Version 3
    else if (length <= 114) baseModules = 33; // Version 4
    else if (length <= 154) baseModules = 37; // Version 5
    else if (length <= 195) baseModules = 41; // Version 6
    else if (length <= 224) baseModules = 45; // Version 7
    else if (length <= 279) baseModules = 49; // Version 8
    else if (length <= 335) baseModules = 53; // Version 9
    else baseModules = 57; // Version 10+
    
    // Ajustement selon le niveau de correction d'erreur
    // Note: Les niveaux QR standards vont jusqu'à H (30%), 
    // mais on peut simuler des niveaux plus élevés pour l'estimation
    const errorMultiplier = {
        'L': 1.0,  // 7%
        'M': 1.1,  // 15%
        'Q': 1.2,  // 25%
        'H': 1.3   // 30% et plus
    };
    
    // Pour les redondances > 30%, on augmente légèrement le multiplicateur H
    let multiplier = errorMultiplier[errorLevel] || 1.1;
    if (errorLevel === 'H' && currentOptions.redundancy > 30) {
        // Ajustement progressif pour les très hautes redondances
        const extraRedundancy = currentOptions.redundancy - 30;
        multiplier = 1.3 + (extraRedundancy * 0.01); // +1% par point de redondance
    }
    
    return Math.ceil(baseModules * multiplier);
}

// Cette fonction n'est plus nécessaire avec la nouvelle logique

// Génération du QR code via API
function generateQRCode() {
    const content = contentTextarea.value.trim();
    
    if (!content) {
        qrPreview.innerHTML = '<div class="qr-placeholder">Entrez du texte pour générer un QR code</div>';
        qrPreview.classList.remove('has-qr');
        return;
    }
    
    // Afficher un indicateur de chargement
    qrPreview.innerHTML = '<div class="qr-placeholder">Génération en cours...</div>';
    
    try {
        const size = currentOptions.calculatedSize;
        const errorCorrection = currentOptions.errorCorrectionLevel;
        
        console.log('Generating QR code...', {
            size: size,
            errorLevel: errorCorrection,
            redundancy: currentOptions.redundancy,
            pixelsPerSquare: currentOptions.pixelsPerSquare
        }); // Debug
        
        const encodedContent = encodeURIComponent(content);
        // Générer directement à la taille calculée
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&data=${encodedContent}&ecc=${errorCorrection}&margin=0`;
        
        console.log('API URL:', apiUrl); // Debug
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Désactiver le lissage pour garder les pixels nets
            ctx.imageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            
            // Dessiner l'image à la taille exacte
            ctx.drawImage(img, 0, 0, size, size);
            
            qrPreview.innerHTML = '';
            qrPreview.appendChild(canvas);
            qrPreview.classList.add('has-qr');
            currentQRCode = canvas;
            
            console.log(`QR code generated - Final size: ${canvas.width}x${canvas.height}px`); // Debug
        };
        
        img.onerror = function() {
            qrPreview.innerHTML = '<div class="qr-placeholder">Erreur lors de la génération<br><small>Vérifiez votre connexion internet</small></div>';
            qrPreview.classList.remove('has-qr');
        };
        
        img.src = apiUrl;
        
    } catch (error) {
        qrPreview.innerHTML = '<div class="qr-placeholder">Erreur lors de la génération</div>';
        qrPreview.classList.remove('has-qr');
    }
}

// Plus besoin de vérification de taille minimum avec la nouvelle logique

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

// Téléchargement en PNG
function downloadAsPNG() {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = currentQRCode.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Téléchargement en SVG
function downloadAsSVG() {
    // Utiliser le canvas existant pour créer un SVG à la taille exacte
    if (!currentQRCode) {
        alert('Aucun QR code à télécharger');
        return;
    }
    
    const size = currentOptions.calculatedSize;
    const canvas = currentQRCode;
    
    console.log(`Creating SVG from canvas - Target size: ${size}x${size}px, Canvas size: ${canvas.width}x${canvas.height}px`); // Debug
    
    // Créer un SVG à partir des données du canvas
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image x="0" y="0" width="${size}" height="${size}" xlink:href="${canvas.toDataURL('image/png')}" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;"/>
</svg>`;
    
    console.log(`SVG created with exact dimensions: ${size}x${size}px`); // Debug
    
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

// Plus besoin de updateUI avec la nouvelle logique simplifiée

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

// Fonction utilitaire pour validation
function validateInput(input, min, max) {
    const value = parseInt(input.value);
    if (isNaN(value) || value < min || value > max) {
        input.classList.add('error');
        return false;
    } else {
        input.classList.remove('error');
        return true;
    }
}

// Fonction pour redimensionner automatiquement le textarea
function autoResizeTextarea() {
    const textarea = contentTextarea;
    // Reset la hauteur pour calculer la nouvelle hauteur nécessaire
    textarea.style.height = 'auto';
    
    // Calcule la nouvelle hauteur basée sur le contenu
    const newHeight = Math.min(textarea.scrollHeight, 400); // Max 400px comme défini dans le CSS
    textarea.style.height = Math.max(newHeight, 120) + 'px'; // Min 120px
}

// Fonction d'initialisation complète
function initializeApp() {
    console.log('Initializing app...'); // Debug
    
    // Vérifier que tous les éléments DOM sont présents
    if (!redundancySlider || !pixelSizeInput) {
        console.error('Required elements not found in DOM!');
        return;
    }
    
    // Initialiser les valeurs par défaut  
    currentOptions.redundancy = parseInt(redundancySlider.value) || 15;
    currentOptions.pixelsPerSquare = parseInt(pixelSizeInput.value) || 3;
    
    // Mapper la redondance vers le niveau d'erreur
    if (currentOptions.redundancy <= 7) {
        currentOptions.errorCorrectionLevel = 'L';
    } else if (currentOptions.redundancy <= 15) {
        currentOptions.errorCorrectionLevel = 'M';
    } else if (currentOptions.redundancy <= 25) {
        currentOptions.errorCorrectionLevel = 'Q';
    } else {
        currentOptions.errorCorrectionLevel = 'H';
    }
    
    // Calculer et afficher la taille initiale
    calculateAndUpdateDisplay();
    
    console.log('App initialized with options:', currentOptions); // Debug
}