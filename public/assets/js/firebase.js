/**
 * CONFIGURATION FIREBASE POUR FATIMA MOBILIÁRIO
 * 
 * Ce fichier configure Firebase (Firestore, Storage, Auth) pour l'application.
 * Il initialise les services et expose les instances globalement.
 * 
 * Services utilisés :
 * - Firestore : Base de données pour les produits et utilisateurs
 * - Storage : Stockage des images des produits
 * - Auth : Authentification des administrateurs
 */

// Configuration Firebase - À REMPLACER par vos vraies clés
const firebaseConfig = {
    apiKey: "votre-api-key",
    authDomain: "fatima-mobiliario.firebaseapp.com", 
    projectId: "fatima-mobiliario",
    storageBucket: "fatima-mobiliario.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456789"
};

// Initialisation de Firebase
try {
    // Initialisation de l'application Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialisé avec succès');
} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
}

// Instances des services Firebase (disponibles globalement)
let db, storage, auth;

try {
    // Instance Firestore pour la base de données
    db = firebase.firestore();
    
    // Configuration Firestore pour de meilleures performances
    db.enablePersistence()
        .then(() => {
            console.log('✅ Persistance Firestore activée');
        })
        .catch((err) => {
            // Persistance peut échouer si plusieurs onglets sont ouverts
            if (err.code == 'failed-precondition') {
                console.warn('⚠️ Persistance Firestore échouée : plusieurs onglets ouverts');
            } else if (err.code == 'unimplemented') {
                console.warn('⚠️ Persistance Firestore non supportée par ce navigateur');
            }
        });
    
    // Instance Storage pour les fichiers
    storage = firebase.storage();
    
    // Instance Auth pour l'authentification
    auth = firebase.auth();
    
    console.log('✅ Services Firebase initialisés');
    
} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des services Firebase:', error);
}

/**
 * UTILITAIRES FIREBASE
 */

/**
 * Vérifie si Firebase est correctement initialisé
 * @returns {boolean} True si Firebase est prêt
 */
function isFirebaseReady() {
    return db && storage && auth;
}

/**
 * Récupère tous les produits publiés depuis Firestore
 * @param {Object} filters - Filtres optionnels (catégorie, prix, etc.)
 * @param {Object} pagination - Options de pagination
 * @returns {Promise<Object>} Liste des produits et métadonnées
 */
async function getProducts(filters = {}, pagination = { limit: 20, offset: 0 }) {
    try {
        // Vérification de l'initialisation
        if (!isFirebaseReady()) {
            throw new Error('Firebase n\'est pas initialisé');
        }
        
        // Construction de la requête de base
        let query = db.collection('products')
            .where('status', '==', 'published')
            .orderBy('created_at', 'desc');
        
        // Application des filtres
        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }
        
        if (filters.priceMin !== undefined) {
            query = query.where('price', '>=', filters.priceMin);
        }
        
        if (filters.priceMax !== undefined) {
            query = query.where('price', '<=', filters.priceMax);
        }
        
        // Application de la pagination
        if (pagination.offset > 0) {
            // Pour la pagination, on utilise startAfter avec un document
            // Cette implémentation simplifiée utilise limit et offset
            query = query.limit(pagination.limit);
        } else {
            query = query.limit(pagination.limit);
        }
        
        // Exécution de la requête
        const snapshot = await query.get();
        
        // Transformation des données
        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data(),
                // Conversion des timestamps Firestore en dates JavaScript
                created_at: doc.data().created_at?.toDate(),
                updated_at: doc.data().updated_at?.toDate(),
                date_published: doc.data().date_published?.toDate()
            });
        });
        
        // Métadonnées de la requête
        const metadata = {
            count: products.length,
            hasMore: products.length === pagination.limit, // Estimation
            filters: filters,
            pagination: pagination
        };
        
        return { products, metadata };
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des produits:', error);
        throw error;
    }
}

/**
 * Récupère un produit spécifique par son ID
 * @param {string} productId - ID du produit
 * @returns {Promise<Object|null>} Données du produit ou null si non trouvé
 */
async function getProduct(productId) {
    try {
        // Vérification de l'initialisation
        if (!isFirebaseReady()) {
            throw new Error('Firebase n\'est pas initialisé');
        }
        
        // Récupération du document
        const doc = await db.collection('products').doc(productId).get();
        
        if (!doc.exists) {
            return null;
        }
        
        // Retour des données avec conversion des timestamps
        return {
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate(),
            updated_at: doc.data().updated_at?.toDate(),
            date_published: doc.data().date_published?.toDate()
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du produit:', error);
        throw error;
    }
}

/**
 * Recherche de produits par nom ou code
 * @param {string} searchTerm - Terme de recherche
 * @param {number} limit - Nombre maximum de résultats
 * @returns {Promise<Array>} Liste des produits correspondants
 */
async function searchProducts(searchTerm, limit = 10) {
    try {
        if (!isFirebaseReady()) {
            throw new Error('Firebase n\'est pas initialisé');
        }
        
        // Normalisation du terme de recherche
        const normalizedTerm = searchTerm.toLowerCase().trim();
        
        if (!normalizedTerm) {
            return [];
        }
        
        // Recherche par nom (commence par le terme)
        const nameQuery = db.collection('products')
            .where('status', '==', 'published')
            .where('name_lowercase', '>=', normalizedTerm)
            .where('name_lowercase', '<=', normalizedTerm + '\uf8ff')
            .limit(limit);
        
        // Recherche par code (commence par le terme)
        const codeQuery = db.collection('products')
            .where('status', '==', 'published')
            .where('code_lowercase', '>=', normalizedTerm)
            .where('code_lowercase', '<=', normalizedTerm + '\uf8ff')
            .limit(limit);
        
        // Exécution des deux requêtes en parallèle
        const [nameSnapshot, codeSnapshot] = await Promise.all([
            nameQuery.get(),
            codeQuery.get()
        ]);
        
        // Combinaison des résultats sans doublons
        const productIds = new Set();
        const products = [];
        
        // Ajout des résultats de la recherche par nom
        nameSnapshot.forEach(doc => {
            if (!productIds.has(doc.id)) {
                productIds.add(doc.id);
                products.push({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate(),
                    updated_at: doc.data().updated_at?.toDate(),
                    date_published: doc.data().date_published?.toDate()
                });
            }
        });
        
        // Ajout des résultats de la recherche par code
        codeSnapshot.forEach(doc => {
            if (!productIds.has(doc.id)) {
                productIds.add(doc.id);
                products.push({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate(),
                    updated_at: doc.data().updated_at?.toDate(),
                    date_published: doc.data().date_published?.toDate()
                });
            }
        });
        
        // Tri par pertinence (nom exact en premier, puis alphabétique)
        products.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().startsWith(normalizedTerm);
            const bNameMatch = b.name.toLowerCase().startsWith(normalizedTerm);
            const aCodeMatch = a.code.toLowerCase().startsWith(normalizedTerm);
            const bCodeMatch = b.code.toLowerCase().startsWith(normalizedTerm);
            
            // Priorité : nom exact > code exact > alphabétique
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            if (aCodeMatch && !bCodeMatch) return -1;
            if (!aCodeMatch && bCodeMatch) return 1;
            
            return a.name.localeCompare(b.name);
        });
        
        return products.slice(0, limit);
        
    } catch (error) {
        console.error('❌ Erreur lors de la recherche de produits:', error);
        throw error;
    }
}

/**
 * Upload d'une image vers Firebase Storage
 * @param {File} file - Fichier image à uploader
 * @param {string} productId - ID du produit
 * @param {string} imageName - Nom de l'image
 * @param {Function} onProgress - Callback pour le suivi du progrès
 * @returns {Promise<string>} URL de téléchargement de l'image
 */
async function uploadProductImage(file, productId, imageName, onProgress = null) {
    try {
        if (!isFirebaseReady()) {
            throw new Error('Firebase n\'est pas initialisé');
        }
        
        // Validation du fichier
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Le fichier doit être une image');
        }
        
        // Taille maximum : 10MB
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('L\'image ne peut pas dépasser 10MB');
        }
        
        // Création du chemin de stockage
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${imageName}_${timestamp}.${fileExtension}`;
        const storageRef = storage.ref(`products/${productId}/${fileName}`);
        
        // Métadonnées du fichier
        const metadata = {
            contentType: file.type,
            customMetadata: {
                'productId': productId,
                'uploadedAt': new Date().toISOString()
            }
        };
        
        // Upload avec suivi du progrès
        const uploadTask = storageRef.put(file, metadata);
        
        // Gestion du progrès si callback fourni
        if (onProgress) {
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress, snapshot.state);
                },
                (error) => {
                    console.error('❌ Erreur pendant l\'upload:', error);
                }
            );
        }
        
        // Attente de la fin de l'upload
        await uploadTask;
        
        // Récupération de l'URL de téléchargement
        const downloadURL = await storageRef.getDownloadURL();
        
        console.log('✅ Image uploadée avec succès:', downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'upload de l\'image:', error);
        throw error;
    }
}

/**
 * Suppression d'une image de Firebase Storage
 * @param {string} imageUrl - URL de l'image à supprimer
 * @returns {Promise<void>}
 */
async function deleteProductImage(imageUrl) {
    try {
        if (!isFirebaseReady()) {
            throw new Error('Firebase n\'est pas initialisé');
        }
        
        // Création de la référence depuis l'URL
        const imageRef = storage.refFromURL(imageUrl);
        
        // Suppression du fichier
        await imageRef.delete();
        
        console.log('✅ Image supprimée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression de l\'image:', error);
        throw error;
    }
}

/**
 * Authentification d'un administrateur
 * @param {string} email - Email de l'administrateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Informations de l'utilisateur connecté
 */
async function signInAdmin(email, password) {
    try {
        if (!isFirebaseReady()) {
            throw new Error('Firebase n\'est pas initialisé');
        }
        
        // Connexion avec Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Vérification du token personnalisé pour le rôle admin
        const idTokenResult = await user.getIdTokenResult();
        
        if (!idTokenResult.claims.role || idTokenResult.claims.role !== 'admin') {
            // Déconnexion si pas admin
            await auth.signOut();
            throw new Error('Accès non autorisé. Vous devez être administrateur.');
        }
        
        console.log('✅ Administrateur connecté:', user.email);
        
        return {
            uid: user.uid,
            email: user.email,
            role: idTokenResult.claims.role
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de la connexion admin:', error);
        throw error;
    }
}

/**
 * Déconnexion de l'administrateur
 * @returns {Promise<void>}
 */
async function signOutAdmin() {
    try {
        if (!isFirebaseReady()) {
            throw new Error('Firebase n\'est pas initialisé');
        }
        
        await auth.signOut();
        console.log('✅ Administrateur déconnecté');
        
    } catch (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        throw error;
    }
}

/**
 * Écoute des changements d'état d'authentification
 * @param {Function} callback - Fonction appelée lors des changements
 * @returns {Function} Fonction pour arrêter l'écoute
 */
function onAuthStateChanged(callback) {
    if (!isFirebaseReady()) {
        console.error('❌ Firebase n\'est pas initialisé');
        return () => {};
    }
    
    return auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Vérification du rôle admin
                const idTokenResult = await user.getIdTokenResult();
                const isAdmin = idTokenResult.claims.role === 'admin';
                
                callback({
                    uid: user.uid,
                    email: user.email,
                    role: idTokenResult.claims.role,
                    isAdmin: isAdmin
                });
            } catch (error) {
                console.error('❌ Erreur lors de la vérification du token:', error);
                callback(null);
            }
        } else {
            callback(null);
        }
    });
}

/**
 * GESTION D'ERREURS ET UTILITAIRES
 */

/**
 * Gère les erreurs Firebase de manière centralisée
 * @param {Error} error - Erreur Firebase
 * @returns {string} Message d'erreur utilisateur
 */
function handleFirebaseError(error) {
    console.error('❌ Erreur Firebase:', error);
    
    // Messages d'erreur traduits pour l'utilisateur
    const errorMessages = {
        'auth/user-not-found': 'Utilisateur non trouvé.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/invalid-email': 'Adresse email invalide.',
        'auth/user-disabled': 'Ce compte a été désactivé.',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
        'auth/network-request-failed': 'Erreur de connexion réseau.',
        'firestore/permission-denied': 'Accès non autorisé.',
        'firestore/unavailable': 'Service temporairement indisponible.',
        'storage/unauthorized': 'Accès non autorisé au stockage.',
        'storage/canceled': 'Opération annulée.',
        'storage/unknown': 'Erreur inconnue du stockage.'
    };
    
    return errorMessages[error.code] || 'Une erreur inattendue s\'est produite.';
}

/**
 * Formate une date pour l'affichage
 * @param {Date} date - Date à formater
 * @param {string} locale - Locale pour le formatage (défaut: 'fr-FR')
 * @returns {string} Date formatée
 */
function formatDate(date, locale = 'fr-FR') {
    if (!date || !(date instanceof Date)) {
        return 'Date inconnue';
    }
    
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

/**
 * Formate un prix pour l'affichage
 * @param {number} price - Prix à formater
 * @param {string} currency - Devise (défaut: 'EUR')
 * @param {string} locale - Locale pour le formatage (défaut: 'pt-PT')
 * @returns {string} Prix formaté
 */
function formatPrice(price, currency = 'EUR', locale = 'pt-PT') {
    if (!price || isNaN(price)) {
        return 'Prix sur demande';
    }
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(price);
}

// Export des fonctions pour utilisation dans d'autres scripts
window.FirebaseUtils = {
    isFirebaseReady,
    getProducts,
    getProduct,
    searchProducts,
    uploadProductImage,
    deleteProductImage,
    signInAdmin,
    signOutAdmin,
    onAuthStateChanged,
    handleFirebaseError,
    formatDate,
    formatPrice
};

// Log de fin d'initialisation
console.log('🔥 Firebase Utils chargé et prêt à l\'utilisation');