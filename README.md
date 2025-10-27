# QR Code Generator

Un générateur de QR codes moderne avec une interface utilisateur inspirée d'Ant Design.

## Fonctionnalités

### Interface utilisateur
- **Zone de saisie texte** : Textarea pour entrer le contenu à encoder (texte long supporté)
- **Options de génération** :
  - **Taille en pixels** : Contrôle direct de la taille du QR code (50-1000px)
  - **Redondance en pourcentage** : Contrôle du niveau de correction d'erreur (1-100%)
- **Prévisualisation en temps réel** : Affichage instantané du QR code généré
- **Export multi-format** : Support SVG et PNG
- **Validation intelligente** : Avertissement si la taille est trop petite pour le contenu

### Options de redondance
Le système mappe automatiquement le pourcentage de redondance vers les niveaux de correction d'erreur QR standard :
- **1-7%** → Niveau L (Low) : ~7% de correction
- **8-15%** → Niveau M (Medium) : ~15% de correction  
- **16-25%** → Niveau Q (Quartile) : ~25% de correction
- **26-100%** → Niveau H (High) : ~30% de correction

### Formats d'export
- **PNG** : Format bitmap haute qualité
- **SVG** : Format vectoriel, idéal pour l'impression et le redimensionnement

## Technologies utilisées

- **HTML5** : Structure sémantique
- **CSS3** : Design moderne inspiré d'Ant Design avec support responsive
- **JavaScript ES6+** : Logique applicative avec gestion d'événements optimisée
- **QR Server API** : Génération de QR codes via API (https://api.qrserver.com)

## Utilisation

1. **Ouvrir le fichier `index.html`** dans un navigateur web moderne
2. **Saisir le texte** à encoder dans la zone de contenu
3. **Choisir les options** :
   - Sélectionner "Size" pour contrôler la taille en pixels
   - Ou sélectionner "Redondance" pour contrôler la correction d'erreur
4. **Prévisualiser** le QR code généré en temps réel
5. **Choisir le format** d'export (SVG ou PNG)
6. **Cliquer sur "Download"** pour télécharger le fichier

## Structure du projet

```
qrcode-generator/
├── index.html          # Page principale avec interface utilisateur
├── styles.css          # Styles CSS avec design Ant Design
├── script.js           # Logique JavaScript avec génération via API
└── README.md           # Documentation du projet
```

## Fonctionnalités avancées

### Validation automatique
- **Taille minimum** : Calcul automatique de la taille minimum requise selon le contenu
- **Avertissements visuels** : Indication quand la taille est insuffisante
- **Debouncing** : Optimisation des performances lors de la saisie

### Interface responsive
- **Design adaptatif** : S'adapte aux écrans mobiles et tablettes
- **Ant Design** : Utilise les conventions et couleurs d'Ant Design
- **Accessibilité** : Support des lecteurs d'écran et navigation clavier

### Gestion d'erreurs
- **Validation des entrées** : Vérification des valeurs numériques
- **Messages d'erreur** : Affichage contextuel des erreurs
- **Fallbacks** : Gestion gracieuse des erreurs de génération

## Exemples d'utilisation

### Carte de visite vCard
```
BEGIN:VCARD
VERSION:3.0
N:Besson;Valentin;;;
FN:Valentin Besson
TITLE:UX / Product designer
EMAIL;TYPE=PREF;INTERNET:vbe@valentin-besson.com
TEL;TYPE=cell:+33 6 64 13 47 10
ADR;TYPE=home:;;3 Allée Alexandre Bachelet;Saint-Ouen;93400;France
URL:https://valentinbesson.com
END:VCARD
```

### URL
```
https://example.com
```

### Texte simple
```
Votre message ici
```

## Compatibilité

- **Navigateurs modernes** : Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobiles** : iOS Safari 12+, Chrome Mobile 60+
- **Connexion internet** : Requise pour la génération des QR codes via API

## Licence

MIT License - Libre d'utilisation pour projets personnels et commerciaux.