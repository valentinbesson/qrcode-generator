// Configuration et variables globales
let currentQRCode = null;
let currentFormat = 'png';
let currentOptions = {
    type: 'size',
    size: 120,
    redundancy: 30,
    errorCorrectionLevel: 'M'
};

// Éléments DOM
const contentTextarea = document.getElementById('content');
const sizeInput = document.getElementById('size-input');
const redundancyInput = document.getElementById('redundancy-input');
const qrPreview = document.getElementById('qr-preview');
const downloadBtn = document.getElementById('download-btn');
const sizeWarning = document.getElementById('size-warning');
const minSizeSpan = document.getElementById('min-size');

// Options radio
const optionTypeRadios = document.querySelectorAll('input[name="option-type"]');
const formatRadios = document.querySelectorAll('input[name="format"]');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    generateQRCode();
    updateUI();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Textarea content
    contentTextarea.addEventListener('input', debounce(generateQRCode, 500));
    
    // Options radio
    optionTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleOptionTypeChange);
    });
    
    // Format radio
    formatRadios.forEach(radio => {
        radio.addEventListener('change', handleFormatChange);
    });
    
    // Inputs numériques
    sizeInput.addEventListener('input', debounce(handleSizeChange, 500));
    redundancyInput.addEventListener('input', debounce(handleRedundancyChange, 500));
    
    // Bouton de téléchargement
    downloadBtn.addEventListener('click', downloadQRCode);
}

// Gestion du changement de type d'option (taille/redondance)
function handleOptionTypeChange(e) {
    currentOptions.type = e.target.value;
    
    if (currentOptions.type === 'size') {
        sizeInput.disabled = false;
        redundancyInput.disabled = true;
        currentOptions.size = parseInt(sizeInput.value);
    } else {
        sizeInput.disabled = true;
        redundancyInput.disabled = false;
        currentOptions.redundancy = parseInt(redundancyInput.value);
        
        // Mapper la redondance vers le niveau de correction d'erreur
        const redundancy = currentOptions.redundancy;
        if (redundancy <= 7) {
            currentOptions.errorCorrectionLevel = 'L';
        } else if (redundancy <= 15) {
            currentOptions.errorCorrectionLevel = 'M';
        } else if (redundancy <= 25) {
            currentOptions.errorCorrectionLevel = 'Q';
        } else {
            currentOptions.errorCorrectionLevel = 'H';
        }
    }
    
    updateQuartileDisplay();
    generateQRCode();
}

// Gestion du changement de format
function handleFormatChange(e) {
    currentFormat = e.target.value;
}

// Gestion du changement de taille
function handleSizeChange(e) {
    const size = parseInt(e.target.value);
    if (size >= 50 && size <= 1000) {
        currentOptions.size = size;
        if (currentOptions.type === 'size') {
            generateQRCode();
        }
    }
}

// Gestion du changement de redondance
function handleRedundancyChange(e) {
    const redundancy = parseInt(e.target.value);
    if (redundancy >= 1 && redundancy <= 100) {
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
        
        updateQuartileDisplay();
        
        if (currentOptions.type === 'redundancy') {
            generateQRCode();
        }
    }
}

// Mise à jour de l'affichage du quartile
function updateQuartileDisplay() {
    const quartileValue = document.querySelector('.quartile-value');
    const redundancy = currentOptions.redundancy;
    
    let quartileText = '';
    if (redundancy <= 7) {
        quartileText = '~7%';
    } else if (redundancy <= 15) {
        quartileText = '~15%';
    } else if (redundancy <= 25) {
        quartileText = '~25%';
    } else {
        quartileText = '~30%';
    }
    
    quartileValue.textContent = quartileText;
}

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
        const size = currentOptions.type === 'size' ? currentOptions.size : 200;
        const errorCorrection = currentOptions.errorCorrectionLevel || 'M';
        const encodedContent = encodeURIComponent(content);
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedContent}&ecc=${errorCorrection}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
            
            qrPreview.innerHTML = '';
            qrPreview.appendChild(canvas);
            qrPreview.classList.add('has-qr');
            currentQRCode = canvas;
            
            checkMinimumSize(content);
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

// Vérification de la taille minimum
function checkMinimumSize(content) {
    // Estimer la taille minimum basée sur la longueur du contenu
    let estimatedMinSize = Math.max(97, Math.ceil(content.length / 4) + 50);
    
    if (currentOptions.type === 'size' && currentOptions.size < estimatedMinSize) {
        minSizeSpan.textContent = estimatedMinSize;
        sizeWarning.style.display = 'flex';
    } else {
        sizeWarning.style.display = 'none';
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
    const content = contentTextarea.value.trim();
    const size = currentOptions.type === 'size' ? currentOptions.size : 200;
    const errorCorrection = currentOptions.errorCorrectionLevel || 'M';
    const encodedContent = encodeURIComponent(content);
    
    // Utiliser l'API pour générer un SVG
    const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=svg&data=${encodedContent}&ecc=${errorCorrection}`;
    
    fetch(svgUrl)
        .then(response => response.text())
        .then(svgContent => {
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.download = 'qrcode.svg';
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            alert('Erreur lors du téléchargement du fichier SVG');
        });
}

// Mise à jour de l'interface utilisateur
function updateUI() {
    // Mise à jour des états des inputs
    if (currentOptions.type === 'size') {
        sizeInput.disabled = false;
        redundancyInput.disabled = true;
    } else {
        sizeInput.disabled = true;
        redundancyInput.disabled = false;
    }
    
    updateQuartileDisplay();
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