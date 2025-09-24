# 🏢 Fatima Mobiliário - Site Catalogue Premium

Un site web catalogue moderne et responsive pour **Fatima Mobiliário**, spécialisé dans les meubles de qualité premium. Ce projet combine design élégant, technologie moderne et interface d'administration complète.

![Logo Fatima Mobiliário](public/assets/images/logo.png)

## 🎨 Aperçu du Design

- **Palette de couleurs** : Jaune #FFD800, Noir/Bordeaux #2B0A0F, Rouge accent #D72631, Blanc #FFFFFF
- **Typographies** : Poppins (titres), Inter (texte)
- **Style** : Minimaliste, moderne avec animations fluides et effets hover
- **Responsive** : Optimisé pour mobile, tablette et desktop

## ⚡ Fonctionnalités Principales

### 🛍️ Côté Client (Public)
- **Page d'accueil** avec carrousel hero et produits vedettes
- **Catalogue complet** avec recherche, filtres et pagination
- **Fiches produits détaillées** avec galerie d'images haute qualité
- **Pages institutionnelles** (À propos, Contact)
- **Formulaire de contact** avec validation et envoi sécurisé
- **SEO optimisé** avec métadonnées dynamiques et Open Graph

### 🔧 Côté Administration
- **Dashboard** avec statistiques en temps réel
- **Gestion CRUD complète** des produits
- **Upload multiple d'images** avec drag & drop
- **Éditeur WYSIWYG** pour les descriptions
- **Gestion des statuts** (brouillon/publié/rupture de stock)
- **Système d'authentification** sécurisé Firebase Auth
- **Historique des modifications** avec timestamps

## 🛠️ Stack Technique

### Frontend
- **HTML5** sémantique et accessible
- **CSS3** avec variables personnalisées et animations
- **JavaScript ES6+** moderne et modulaire
- **Responsive Design** mobile-first

### Backend
- **PHP 8.0+** avec architecture REST
- **Firebase Firestore** (base de données NoSQL)
- **Firebase Storage** (stockage des images)
- **Firebase Authentication** (authentification admin)

### Outils de Développement
- **Composer** (gestion des dépendances PHP)
- **npm/yarn** (outils de développement frontend)
- **Git** (contrôle de version)

## 📁 Structure du Projet

```
fatima-mobiliario/
├── 📂 public/                     # Fichiers publics
│   ├── 📄 index.html             # Page d'accueil
│   ├── 📄 catalogue.html         # Page catalogue
│   ├── 📄 produit.html          # Fiche produit
│   ├── 📄 contact.html          # Page contact
│   ├── 📄 a-propos.html         # Page à propos
│   └── 📂 assets/               # Ressources statiques
│       ├── 📂 css/              # Styles CSS
│       ├── 📂 js/               # Scripts JavaScript
│       ├── 📂 images/           # Images du site
│       └── 📂 icons/            # Icônes et favicon
├── 📂 admin/                     # Interface d'administration
│   ├── 📄 index.html            # Dashboard admin
│   ├── 📄 login.html            # Connexion admin
│   ├── 📄 produits.html         # Gestion produits
│   └── 📄 upload.html           # Upload images
├── 📂 api/                       # API PHP REST
│   ├── 📄 index.php             # Point d'entrée API
│   ├── 📂 config/               # Configuration
│   ├── 📂 endpoints/            # Endpoints API
│   └── 📂 utils/                # Utilitaires
├── 📂 config/                    # Configuration Firebase
├── 📄 composer.json             # Dépendances PHP
├── 📄 package.json              # Dépendances Node.js
└── 📄 README.md                 # Cette documentation
```

## 🚀 Installation et Configuration

### Prérequis
- **PHP 8.0+** avec extensions : `curl`, `json`, `mbstring`
- **Composer** (gestionnaire de dépendances PHP)
- **Node.js 16+** et **npm** (pour les outils de développement)
- **Compte Firebase** avec projet configuré

### 1. Clonage du Projet

```bash
git clone https://github.com/votre-username/fatima-mobiliario.git
cd fatima-mobiliario
```

### 2. Installation des Dépendances

```bash
# Dépendances PHP
composer install

# Dépendances Node.js (optionnel pour le développement)
npm install
```

### 3. Configuration Firebase

#### 3.1 Création du Projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet "fatima-mobiliario"
3. Activez **Firestore Database**
4. Activez **Storage**
5. Activez **Authentication** avec méthode Email/Mot de passe

#### 3.2 Configuration Web
1. Dans les paramètres du projet, ajoutez une application Web
2. Copiez la configuration dans `public/assets/js/firebase.js` :

```javascript
const firebaseConfig = {
    apiKey: "votre-api-key",
    authDomain: "fatima-mobiliario.firebaseapp.com",
    projectId: "fatima-mobiliario",
    storageBucket: "fatima-mobiliario.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456789"
};
```

#### 3.3 Configuration Admin SDK
1. Générez une clé privée dans **Paramètres du projet > Comptes de service**
2. Téléchargez le fichier JSON et placez-le dans `api/config/firebase-credentials.json`

#### 3.4 Règles de Sécurité
Copiez le contenu des fichiers de règles :
- `config/firestore.rules` → Règles Firestore dans la console
- `config/storage.rules` → Règles Storage dans la console

### 4. Configuration de l'Environnement

Créez un fichier `.env` à la racine :

```env
# Firebase
FIREBASE_PROJECT_ID=fatima-mobiliario
FIREBASE_STORAGE_BUCKET=fatima-mobiliario.appspot.com
FIREBASE_CREDENTIALS_PATH=api/config/firebase-credentials.json

# Base de données (optionnel)
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=fatima_mobiliario
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Environnement
APP_ENV=development
APP_DEBUG=true
```

### 5. Création du Premier Administrateur

```bash
# Connectez-vous à Firebase CLI
firebase login

# Utilisez les fonctions Firebase pour créer un admin
firebase functions:shell

# Dans le shell Firebase
createAdmin('admin@fatimamobiliario.com', 'motdepasse123')
```

### 6. Lancement du Serveur de Développement

```bash
# Serveur PHP local
php -S localhost:8000 -t public

# Ou avec Firebase Hosting (recommandé)
firebase serve --host 0.0.0.0 --port 5000
```

Le site sera accessible à :
- **Site public** : http://localhost:8000
- **Administration** : http://localhost:8000/admin

## 🔐 Authentification et Sécurité

### Système d'Authentification
- **Firebase Authentication** pour la sécurité
- **Tokens JWT** pour les sessions
- **Rôles utilisateurs** avec claims personnalisés
- **Vérification côté serveur** de tous les tokens

### Sécurité des Données
- **Règles Firestore** restrictives
- **Validation côté serveur** de toutes les données
- **Sanitisation** des entrées utilisateur
- **Protection CSRF** sur les formulaires
- **Headers de sécurité** appropriés

### Règles d'Accès
```javascript
// Lecture publique pour produits publiés uniquement
allow read: if resource.data.status == 'published';

// Écriture admin uniquement
allow write: if request.auth.token.role == 'admin';
```

## 📊 Base de Données Firestore

### Collection `products`
```javascript
{
  id: "uuid",                    // ID unique généré automatiquement
  name: "Canapé Premium",        // Nom du produit
  code: "FAT-001",              // Code produit unique
  price: 2500.00,               // Prix en euros
  description: "<p>...</p>",     // Description HTML
  status: "published",          // draft | published | out_of_stock
  category: "salon",            // Catégorie du produit
  images: [                     // Tableau des images
    {
      url: "https://...",       // URL Firebase Storage
      alt: "Description",       // Texte alternatif
      order: 0                  // Ordre d'affichage
    }
  ],
  created_at: Timestamp,        // Date de création
  updated_at: Timestamp,        // Date de modification
  date_published: Timestamp,    // Date de publication
  created_by: "uid",           // UID créateur
  name_lowercase: "canapé...",  // Pour recherche insensible casse
  code_lowercase: "fat-001"     // Pour recherche insensible casse
}
```

### Collection `users`
```javascript
{
  id: "uid",                    // UID Firebase Auth
  email: "admin@...",           // Email utilisateur
  role: "admin",                // Rôle utilisateur
  created_at: Timestamp,        // Date de création
  last_login: Timestamp         // Dernière connexion
}
```

## 🎯 API REST

### Endpoints Publics

#### `GET /api/products`
Récupère la liste des produits publiés
```javascript
// Paramètres optionnels
?category=salon&limit=20&search=canapé

// Réponse
{
  "success": true,
  "data": {
    "products": [...],
    "count": 15,
    "hasMore": false
  }
}
```

#### `GET /api/products/{id}`
Récupère un produit spécifique
```javascript
// Réponse
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Canapé Premium",
    // ... autres propriétés
  }
}
```

### Endpoints Admin (Authentification Requise)

#### `POST /api/products`
Crée un nouveau produit
```javascript
// Headers
Authorization: Bearer <firebase-id-token>

// Body
{
  "name": "Nouveau Produit",
  "code": "FAT-002",
  "price": 1500.00,
  "description": "<p>Description...</p>",
  "status": "draft"
}
```

#### `PUT /api/products/{id}`
Met à jour un produit existant

#### `DELETE /api/products/{id}`
Supprime un produit

#### `POST /api/upload`
Upload d'images pour un produit
```javascript
// Headers
Authorization: Bearer <firebase-id-token>
Content-Type: multipart/form-data

// Form Data
productId: "abc123"
images: [File, File, ...]
```

### Gestion d'Erreurs
```javascript
// Erreur standard
{
  "success": false,
  "error": {
    "message": "Produit non trouvé",
    "code": 404,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 🎨 Personnalisation du Design

### Variables CSS Principales
```css
:root {
  --color-primary: #FFD800;        /* Jaune principal */
  --color-secondary: #2B0A0F;      /* Bordeaux foncé */
  --color-accent: #D72631;         /* Rouge accent */
  --color-white: #FFFFFF;          /* Blanc */
  
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  --border-radius-lg: 1rem;        /* Coins arrondis */
  --shadow-lg: 0 10px 15px -3px rgba(43, 10, 15, 0.1);
}
```

### Animations et Transitions
- **Hover effects** : scale(1.03) sur les cartes
- **Fade-in animations** au scroll
- **Smooth transitions** 0.3s ease-in-out
- **Loading spinners** animés en CSS

### Responsive Breakpoints
```css
/* Tablette */
@media (max-width: 768px) { /* Styles tablette */ }

/* Mobile */
@media (max-width: 480px) { /* Styles mobile */ }
```

## 🚀 Déploiement

### Déploiement Firebase Hosting

```bash
# Installation Firebase CLI
npm install -g firebase-tools

# Connexion à Firebase
firebase login

# Initialisation du projet
firebase init hosting

# Configuration firebase.json
{
  "hosting": {
    "public": "public",
    "rewrites": [
      {
        "source": "/api/**",
        "destination": "/api/index.php"
      }
    ]
  }
}

# Déploiement
firebase deploy
```

### Déploiement Serveur Traditionnel

1. **Upload des fichiers** sur votre serveur web
2. **Configuration Apache/Nginx** pour PHP
3. **Variables d'environnement** dans `.env`
4. **Permissions** sur les dossiers de cache
5. **SSL Certificate** pour HTTPS (recommandé)

### Configuration Apache (.htaccess)
```apache
RewriteEngine On

# Redirection API vers PHP
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# Redirection pour SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Sécurité
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

## 🔧 Maintenance et Monitoring

### Logs et Debugging
```javascript
// Côté client
console.log('🔍 Debug info:', data);

// Côté serveur PHP
error_log("API Debug: " . json_encode($data));
```

### Monitoring Firebase
- **Console Firebase** pour surveiller l'utilisation
- **Alertes** sur les quotas et erreurs
- **Analytics** pour le trafic

### Sauvegarde des Données
```bash
# Export Firestore
gcloud firestore export gs://your-bucket/backup-folder

# Backup automatique via Cloud Scheduler
```

### Optimisation des Performances
- **Lazy loading** des images
- **Compression** des assets
- **CDN** pour les ressources statiques
- **Cache** des requêtes API
- **Minification** CSS/JS en production

## 🧪 Tests et Qualité

### Tests Frontend
```bash
# Tests unitaires JavaScript
npm run test

# Tests d'intégration
npm run test:integration
```

### Tests Backend
```bash
# Tests PHPUnit
composer test

# Tests d'API
composer test:api
```

### Validation du Code
```bash
# Linting CSS
npm run lint:css

# Linting JavaScript
npm run lint:js

# Standards PHP
composer lint
```

## 📱 SEO et Accessibilité

### SEO Optimisé
- **Métadonnées dynamiques** selon le contenu
- **Open Graph** et Twitter Cards
- **Sitemap XML** généré automatiquement
- **Schema.org** JSON-LD pour les produits
- **URLs propres** et descriptives

### Accessibilité (WCAG 2.1)
- **Navigation clavier** complète
- **Lecteurs d'écran** supportés
- **Contraste** des couleurs conforme
- **Textes alternatifs** sur toutes les images
- **ARIA labels** appropriés

### Performance Web
- **Lighthouse Score** 90+ visé
- **Core Web Vitals** optimisés
- **Progressive Web App** ready
- **Offline support** pour les pages critiques

## 🤝 Contribution

### Guidelines de Développement
1. **Branches** : `feature/nom-fonctionnalite`
2. **Commits** : Messages descriptifs en français
3. **Code Review** obligatoire avant merge
4. **Tests** : Couverture minimale 80%
5. **Documentation** : Mise à jour avec les changements

### Structure des Commits
```
feat: ajout de la recherche avancée dans le catalogue
fix: correction du bug d'upload d'images
docs: mise à jour de la documentation API
style: amélioration du design des cartes produits
refactor: optimisation des requêtes Firestore
test: ajout de tests pour l'authentification
```

## 📞 Support et Contact

### Support Technique
- **Email** : dev@fatimamobiliario.com
- **Documentation** : Ce README et commentaires dans le code
- **Issues** : GitHub Issues pour les bugs et demandes

### Équipe de Développement
- **Développeur Principal** : [Votre nom]
- **Designer UI/UX** : [Nom designer]
- **Responsable Produit** : Fatima Mobiliário

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- **Firebase** pour l'infrastructure backend
- **Google Fonts** pour les typographies
- **Unsplash** pour les images de démonstration
- **Communauté Open Source** pour les outils utilisés

---

**Fatima Mobiliário** - *Meubles de qualité premium depuis 2024*

Pour plus d'informations, visitez [fatimamobiliario.com](https://fatimamobiliario.com)