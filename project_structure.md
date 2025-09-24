# Structure du Projet Fatima Mobiliário

```
fatima-mobiliario/
├── public/                     # Fichiers publics accessibles
│   ├── index.html             # Page d'accueil
│   ├── catalogue.html         # Page catalogue
│   ├── produit.html          # Fiche produit
│   ├── contact.html          # Page contact
│   ├── a-propos.html         # Page à propos
│   ├── assets/               # Ressources statiques
│   │   ├── css/
│   │   │   ├── style.css     # Styles principaux
│   │   │   └── admin.css     # Styles admin
│   │   ├── js/
│   │   │   ├── app.js        # JavaScript principal
│   │   │   ├── firebase.js   # Configuration Firebase
│   │   │   ├── catalogue.js  # Logique catalogue
│   │   │   └── admin.js      # Logique admin
│   │   ├── images/           # Images du site
│   │   │   └── logo.png      # Logo Fatima
│   │   └── icons/            # Icônes
├── admin/                     # Interface d'administration
│   ├── index.html            # Dashboard admin
│   ├── login.html            # Page de connexion
│   ├── produits.html         # Gestion produits
│   └── upload.html           # Upload images
├── api/                       # API PHP
│   ├── index.php             # Point d'entrée API
│   ├── config/
│   │   ├── firebase.php      # Configuration Firebase
│   │   └── database.php      # Configuration base
│   ├── endpoints/
│   │   ├── products.php      # CRUD produits
│   │   ├── upload.php        # Upload images
│   │   └── auth.php          # Authentification
│   └── utils/
│       ├── security.php      # Utilitaires sécurité
│       └── helpers.php       # Fonctions utilitaires
├── config/                    # Configuration
│   ├── firestore.rules       # Règles Firestore
│   ├── storage.rules         # Règles Storage
│   └── firebase.json         # Config Firebase
├── composer.json             # Dépendances PHP
├── package.json              # Dépendances Node.js
├── README.md                 # Documentation
└── .gitignore               # Fichiers à ignorer
```