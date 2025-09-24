# 🔧 Guide d'Installation - Fatima Mobiliário

Ce guide détaillé vous accompagne pas à pas dans l'installation et la configuration du site catalogue Fatima Mobiliário.

## 📋 Prérequis Système

### Serveur Web
- **PHP 8.0+** avec extensions :
  - `curl` (communication avec Firebase)
  - `json` (manipulation JSON)
  - `mbstring` (gestion des chaînes UTF-8)
  - `openssl` (sécurité HTTPS)
  - `fileinfo` (détection types de fichiers)
- **Apache 2.4+** ou **Nginx 1.18+**
- **HTTPS** (recommandé pour Firebase Auth)

### Outils de Développement
- **Composer 2.0+** (gestionnaire dépendances PHP)
- **Node.js 16+** et **npm** (outils frontend)
- **Git** (contrôle de version)

### Services Cloud
- **Compte Firebase** (gratuit pour débuter)
- **Domaine personnalisé** (optionnel)

## 🚀 Installation Étape par Étape

### Étape 1 : Préparation de l'Environnement

#### 1.1 Clonage du Projet
```bash
# Cloner le dépôt
git clone https://github.com/votre-username/fatima-mobiliario.git

# Accéder au dossier
cd fatima-mobiliario

# Vérifier la structure
ls -la
```

#### 1.2 Installation des Dépendances
```bash
# Dépendances PHP (backend)
composer install --no-dev --optimize-autoloader

# Dépendances Node.js (outils de développement)
npm install

# Vérification des installations
composer --version
npm --version
```

### Étape 2 : Configuration Firebase

#### 2.1 Création du Projet Firebase
1. **Accédez à [Firebase Console](https://console.firebase.google.com/)**
2. **Cliquez sur "Ajouter un projet"**
3. **Nom du projet** : `fatima-mobiliario`
4. **Activez Google Analytics** (recommandé)
5. **Sélectionnez votre pays** : Portugal

#### 2.2 Configuration des Services Firebase

##### Firestore Database
1. **Dans la console** → **Firestore Database**
2. **Cliquez sur "Créer une base de données"**
3. **Mode de sécurité** : Commencer en mode test
4. **Emplacement** : europe-west1 (Belgique) ou europe-west3 (Allemagne)
5. **Cliquez sur "Terminé"**

##### Storage
1. **Dans la console** → **Storage**
2. **Cliquez sur "Commencer"**
3. **Règles de sécurité** : Mode test pour l'instant
4. **Emplacement** : Même région que Firestore

##### Authentication
1. **Dans la console** → **Authentication**
2. **Onglet "Sign-in method"**
3. **Activez "E-mail/Mot de passe"**
4. **Désactivez "Lien par e-mail"** (non utilisé)

#### 2.3 Configuration Web App
1. **Paramètres du projet** → **Applications**
2. **Cliquez sur l'icône Web** `</>`
3. **Nom de l'app** : `Fatima Mobiliario Web`
4. **Activez Firebase Hosting** : Oui
5. **Copiez la configuration** qui apparaît :

```javascript
// Configuration à copier dans public/assets/js/firebase.js
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "fatima-mobiliario.firebaseapp.com",
    projectId: "fatima-mobiliario",
    storageBucket: "fatima-mobiliario.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef..."
};
```

#### 2.4 Configuration Admin SDK (Backend)
1. **Paramètres du projet** → **Comptes de service**
2. **Cliquez sur "Générer une nouvelle clé privée"**
3. **Téléchargez le fichier JSON**
4. **Renommez-le** en `firebase-credentials.json`
5. **Placez-le dans** `api/config/firebase-credentials.json`

⚠️ **IMPORTANT** : Ajoutez ce fichier à `.gitignore` pour la sécurité !

### Étape 3 : Configuration du Code

#### 3.1 Configuration Firebase Frontend
Modifiez `public/assets/js/firebase.js` :

```javascript
// Remplacez cette section avec votre configuration
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "fatima-mobiliario.firebaseapp.com",
    projectId: "fatima-mobiliario",
    storageBucket: "fatima-mobiliario.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

#### 3.2 Configuration des Variables d'Environnement
Créez un fichier `.env` à la racine :

```env
# Configuration Firebase
FIREBASE_PROJECT_ID=fatima-mobiliario
FIREBASE_STORAGE_BUCKET=fatima-mobiliario.appspot.com
FIREBASE_CREDENTIALS_PATH=api/config/firebase-credentials.json

# Configuration Base de Données (optionnel)
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=fatima_mobiliario
DB_USERNAME=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe

# Configuration Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://votre-domaine.com

# Configuration Email (pour les notifications)
MAIL_FROM_ADDRESS=noreply@fatimamobiliario.com
MAIL_FROM_NAME="Fatima Mobiliário"
```

#### 3.3 Mise à jour du .gitignore
Ajoutez ces lignes à `.gitignore` :

```gitignore
# Fichiers sensibles
.env
.env.local
.env.production
api/config/firebase-credentials.json

# Cache et logs
*.log
cache/
temp/

# Uploads temporaires
uploads/temp/
```

### Étape 4 : Configuration des Règles de Sécurité

#### 4.1 Règles Firestore
1. **Console Firebase** → **Firestore Database** → **Règles**
2. **Copiez le contenu** de `config/firestore.rules`
3. **Cliquez sur "Publier"**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Produits - lecture publique si publié, écriture admin
    match /products/{productId} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth != null && 
                      request.auth.token.role == 'admin';
    }
    
    // Utilisateurs - accès restreint
    match /users/{userId} {
      allow read: if request.auth != null && 
                     request.auth.uid == userId;
      allow write: if request.auth != null && 
                      request.auth.token.role == 'admin';
    }
  }
}
```

#### 4.2 Règles Storage
1. **Console Firebase** → **Storage** → **Règles**
2. **Copiez le contenu** de `config/storage.rules`
3. **Cliquez sur "Publier"**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images produits - lecture publique, écriture admin
    match /products/{productId}/{imageId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.role == 'admin' &&
                      request.resource.contentType.matches('image/.*') &&
                      request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### Étape 5 : Création du Premier Administrateur

#### 5.1 Installation Firebase CLI
```bash
# Installation globale
npm install -g firebase-tools

# Connexion à votre compte
firebase login

# Vérification
firebase projects:list
```

#### 5.2 Initialisation du Projet
```bash
# Dans le dossier du projet
firebase init

# Sélectionnez :
# - Firestore
# - Hosting
# - Storage

# Configuration Hosting :
# - Public directory: public
# - Single-page app: No
# - Rewrites: Oui (pour l'API)
```

#### 5.3 Création du Compte Admin
Deux options disponibles :

**Option A : Via Console Firebase**
1. **Authentication** → **Utilisateurs**
2. **Ajouter un utilisateur**
3. **Email** : `admin@fatimamobiliario.com`
4. **Mot de passe** : Générez un mot de passe fort
5. **Notez l'UID** de l'utilisateur créé

**Option B : Via Firebase CLI**
```bash
# Ouvrir le shell Firebase
firebase functions:shell

# Créer l'utilisateur (dans le shell)
const admin = require('firebase-admin');
admin.auth().createUser({
  email: 'admin@fatimamobiliario.com',
  password: 'VotreMotDePasseSecurise123!',
  emailVerified: true
});
```

#### 5.4 Attribution du Rôle Admin
```bash
# Dans Firebase CLI ou via Cloud Functions
firebase functions:shell

# Attribuer le rôle admin
admin.auth().setCustomUserClaims('UID_DE_VOTRE_ADMIN', {
  role: 'admin'
});
```

### Étape 6 : Test de l'Installation

#### 6.1 Serveur de Développement Local
```bash
# Option 1 : Serveur PHP intégré
php -S localhost:8000 -t public

# Option 2 : Firebase Hosting (recommandé)
firebase serve --host 0.0.0.0 --port 5000
```

#### 6.2 Tests de Fonctionnement

**Site Public :**
- ✅ **Page d'accueil** : http://localhost:5000
- ✅ **Catalogue** : http://localhost:5000/catalogue.html
- ✅ **Contact** : http://localhost:5000/contact.html

**Administration :**
- ✅ **Connexion** : http://localhost:5000/admin/login.html
- ✅ **Dashboard** : http://localhost:5000/admin/index.html

**API :**
- ✅ **Health Check** : http://localhost:5000/api/health
- ✅ **Produits** : http://localhost:5000/api/products

#### 6.3 Vérifications de Sécurité
```bash
# Test des règles Firestore
firebase firestore:rules:test --test-suite test-suite.js

# Test des règles Storage
firebase storage:rules:test --test-suite storage-test.js
```

### Étape 7 : Déploiement en Production

#### 7.1 Préparation du Build
```bash
# Optimisation des assets
npm run build

# Optimisation PHP
composer install --no-dev --optimize-autoloader

# Nettoyage des fichiers de développement
rm -rf node_modules
rm -rf .git
```

#### 7.2 Déploiement Firebase Hosting
```bash
# Déploiement complet
firebase deploy

# Déploiement spécifique
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

#### 7.3 Configuration du Domaine Personnalisé
1. **Console Firebase** → **Hosting**
2. **Ajouter un domaine personnalisé**
3. **Saisissez** : `www.fatimamobiliario.com`
4. **Suivez les instructions** pour la vérification DNS
5. **Certificat SSL** : Automatique avec Firebase

### Étape 8 : Configuration Post-Déploiement

#### 8.1 Variables d'Environnement Production
Mettez à jour `.env` pour la production :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://www.fatimamobiliario.com

# Désactivez les logs de debug
LOG_LEVEL=error
```

#### 8.2 Monitoring et Alertes
1. **Console Firebase** → **Performance**
2. **Activez Performance Monitoring**
3. **Configurez les alertes** sur les quotas
4. **Surveillez** les métriques de performance

#### 8.3 Sauvegarde Automatique
```bash
# Script de sauvegarde Firestore
gcloud firestore export gs://fatima-mobiliario-backup/$(date +%Y%m%d)

# Programmez avec cron (tous les jours à 2h)
0 2 * * * /path/to/backup-script.sh
```

## 🔧 Dépannage

### Problèmes Courants

#### Erreur "Firebase not initialized"
```bash
# Vérifiez la configuration dans firebase.js
# Assurez-vous que les clés API sont correctes
# Vérifiez la console du navigateur pour plus de détails
```

#### Erreur "Permission denied" sur Firestore
```bash
# Vérifiez les règles Firestore
# Assurez-vous que l'utilisateur a le bon rôle
# Testez avec firebase firestore:rules:test
```

#### Images ne se chargent pas
```bash
# Vérifiez les règles Storage
# Assurez-vous que les images sont publiques
# Vérifiez les CORS si nécessaire
```

#### API retourne 500
```bash
# Vérifiez les logs PHP
tail -f /var/log/apache2/error.log

# Vérifiez les permissions de fichiers
chmod -R 755 api/
chown -R www-data:www-data api/
```

### Logs et Debug

#### Activation des Logs
```php
// Dans api/config/database.php
ini_set('log_errors', 1);
ini_set('error_log', '/path/to/your/error.log');
```

#### Debug Frontend
```javascript
// Dans public/assets/js/firebase.js
// Ajoutez en mode développement
firebase.firestore().enableNetwork().then(() => {
    console.log('Firestore connected');
});
```

## 📞 Support

### Ressources Utiles
- **Documentation Firebase** : https://firebase.google.com/docs
- **PHP Manual** : https://www.php.net/manual/
- **MDN Web Docs** : https://developer.mozilla.org/

### Contact Support
- **Email** : support@fatimamobiliario.com
- **Issues GitHub** : [Lien vers issues]
- **Documentation** : Ce guide et README.md

## ✅ Checklist de Déploiement

Avant de mettre en production, vérifiez :

### Sécurité
- [ ] Fichiers sensibles dans `.gitignore`
- [ ] Règles Firebase configurées et testées
- [ ] HTTPS activé sur le domaine
- [ ] Mots de passe admin sécurisés
- [ ] Variables d'environnement configurées

### Performance
- [ ] Images optimisées et compressées
- [ ] CSS/JS minifiés en production
- [ ] Cache configuré sur le serveur
- [ ] CDN configuré si nécessaire

### Fonctionnalités
- [ ] Toutes les pages accessibles
- [ ] Formulaires fonctionnels
- [ ] Upload d'images opérationnel
- [ ] Authentification admin testée
- [ ] API endpoints testés

### SEO et Accessibilité
- [ ] Métadonnées configurées
- [ ] Sitemap généré
- [ ] Tests d'accessibilité passés
- [ ] Performance Lighthouse > 90

---

**Installation terminée !** 🎉

Votre site Fatima Mobiliário est maintenant prêt à accueillir vos premiers produits et visiteurs.