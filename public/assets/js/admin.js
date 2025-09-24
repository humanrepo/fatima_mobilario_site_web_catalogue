/**
 * SCRIPT ADMIN FATIMA MOBILIÁRIO
 * 
 * Ce fichier contient toute la logique JavaScript commune à l'interface d'administration :
 * - Gestion de l'authentification admin
 * - CRUD des produits
 * - Upload et gestion des images
 * - Utilitaires admin
 */

/**
 * VARIABLES GLOBALES ADMIN
 */

// État global de l'administration
let adminState = {
    currentUser: null,
    isAuthenticated: false,
    currentProduct: null,
    uploadedImages: [],
    isDirty: false // Indique si des modifications non sauvegardées existent
};

// Configuration admin
const adminConfig = {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxImagesPerProduct: 10
};

/**
 * AUTHENTIFICATION ADMIN
 */

/**
 * Vérifie l'authentification admin sur toutes les pages
 */
function checkAdminAuthentication() {
    return new Promise((resolve, reject) => {
        if (!window.FirebaseUtils || !window.FirebaseUtils.isFirebaseReady()) {
            console.error('❌ Firebase non disponible');
            reject(new Error('Firebase non disponible'));
            return;
        }
        
        // Écoute de l'état d'authentification
        const unsubscribe = window.FirebaseUtils.onAuthStateChanged((user) => {
            if (!user || !user.isAdmin) {
                console.warn('⚠️ Accès non autorisé');
                adminState.isAuthenticated = false;
                adminState.currentUser = null;
                reject(new Error('Accès non autorisé'));
            } else {
                console.log('✅ Admin authentifié:', user.email);
                adminState.isAuthenticated = true;
                adminState.currentUser = user;
                resolve(user);
            }
            unsubscribe(); // Arrêt de l'écoute après la première vérification
        });
    });
}

/**
 * Redirige vers la page de connexion
 */
function redirectToAdminLogin() {
    // Sauvegarde de l'URL courante pour redirection après connexion
    sessionStorage.setItem('admin-redirect-url', window.location.pathname + window.location.search);
    window.location.href = '/admin/login.html';
}

/**
 * GESTION DES PRODUITS (CRUD)
 */

/**
 * Crée un nouveau produit
 * @param {Object} productData - Données du produit
 * @returns {Promise<string>} ID du produit créé
 */
async function createProduct(productData) {
    try {
        if (!adminState.isAuthenticated) {
            throw new Error('Non authentifié');
        }
        
        // Validation des données
        validateProductData(productData);
        
        // Ajout des métadonnées
        const now = firebase.firestore.Timestamp.now();
        const productToCreate = {
            ...productData,
            created_at: now,
            updated_at: now,
            created_by: adminState.currentUser.uid,
            // Champs de recherche en minuscules pour les requêtes
            name_lowercase: productData.name.toLowerCase(),
            code_lowercase: productData.code.toLowerCase()
        };
        
        // Si le produit est publié, ajouter la date de publication
        if (productData.status === 'published') {
            productToCreate.date_published = now;
        }
        
        // Création dans Firestore
        const docRef = await db.collection('products').add(productToCreate);
        
        console.log('✅ Produit créé avec succès:', docRef.id);
        return docRef.id;
        
    } catch (error) {
        console.error('❌ Erreur lors de la création du produit:', error);
        throw error;
    }
}

/**
 * Met à jour un produit existant
 * @param {string} productId - ID du produit
 * @param {Object} productData - Nouvelles données du produit
 * @returns {Promise<void>}
 */
async function updateProduct(productId, productData) {
    try {
        if (!adminState.isAuthenticated) {
            throw new Error('Non authentifié');
        }
        
        // Validation des données
        validateProductData(productData);
        
        // Récupération du produit existant pour comparaison
        const existingProduct = await getProductById(productId);
        if (!existingProduct) {
            throw new Error('Produit non trouvé');
        }
        
        // Préparation des données de mise à jour
        const now = firebase.firestore.Timestamp.now();
        const productToUpdate = {
            ...productData,
            updated_at: now,
            updated_by: adminState.currentUser.uid,
            // Champs de recherche en minuscules
            name_lowercase: productData.name.toLowerCase(),
            code_lowercase: productData.code.toLowerCase()
        };
        
        // Gestion de la date de publication
        if (productData.status === 'published' && existingProduct.status !== 'published') {
            // Premier passage en "publié"
            productToUpdate.date_published = now;
        } else if (productData.status !== 'published') {
            // Retrait de la date de publication si plus publié
            productToUpdate.date_published = firebase.firestore.FieldValue.delete();
        }
        
        // Mise à jour dans Firestore
        await db.collection('products').doc(productId).update(productToUpdate);
        
        console.log('✅ Produit mis à jour avec succès:', productId);
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du produit:', error);
        throw error;
    }
}

/**
 * Supprime un produit
 * @param {string} productId - ID du produit à supprimer
 * @returns {Promise<void>}
 */
async function deleteProduct(productId) {
    try {
        if (!adminState.isAuthenticated) {
            throw new Error('Non authentifié');
        }
        
        // Récupération du produit pour supprimer ses images
        const product = await getProductById(productId);
        if (!product) {
            throw new Error('Produit non trouvé');
        }
        
        // Suppression des images associées
        if (product.images && product.images.length > 0) {
            await Promise.all(
                product.images.map(image => deleteProductImage(image.url))
            );
        }
        
        // Suppression du document Firestore
        await db.collection('products').doc(productId).delete();
        
        console.log('✅ Produit supprimé avec succès:', productId);
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du produit:', error);
        throw error;
    }
}

/**
 * Récupère un produit par son ID (admin - tous statuts)
 * @param {string} productId - ID du produit
 * @returns {Promise<Object|null>} Données du produit ou null
 */
async function getProductById(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        
        if (!doc.exists) {
            return null;
        }
        
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
 * Récupère tous les produits (admin - tous statuts)
 * @param {Object} filters - Filtres optionnels
 * @param {Object} pagination - Options de pagination
 * @returns {Promise<Object>} Liste des produits et métadonnées
 */
async function getAllProducts(filters = {}, pagination = { limit: 50, offset: 0 }) {
    try {
        // Construction de la requête de base
        let query = db.collection('products').orderBy('created_at', 'desc');
        
        // Application des filtres
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        
        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }
        
        // Application de la pagination
        query = query.limit(pagination.limit);
        
        if (pagination.offset > 0) {
            // Pour une vraie pagination, il faudrait utiliser startAfter avec un document
            // Cette implémentation simplifiée utilise limit/offset
            query = query.offset(pagination.offset);
        }
        
        // Exécution de la requête
        const snapshot = await query.get();
        
        // Transformation des données
        const products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate(),
                updated_at: doc.data().updated_at?.toDate(),
                date_published: doc.data().date_published?.toDate()
            });
        });
        
        return {
            products,
            count: products.length,
            hasMore: products.length === pagination.limit
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des produits:', error);
        throw error;
    }
}

/**
 * Valide les données d'un produit
 * @param {Object} productData - Données à valider
 * @throws {Error} Si les données ne sont pas valides
 */
function validateProductData(productData) {
    const requiredFields = ['name', 'code', 'status'];
    
    // Vérification des champs obligatoires
    for (const field of requiredFields) {
        if (!productData[field] || productData[field].toString().trim() === '') {
            throw new Error(`Le champ "${field}" est obligatoire`);
        }
    }
    
    // Validation du statut
    const validStatuses = ['draft', 'published', 'out_of_stock'];
    if (!validStatuses.includes(productData.status)) {
        throw new Error('Statut invalide');
    }
    
    // Validation du prix (si fourni)
    if (productData.price !== undefined && productData.price !== null) {
        const price = parseFloat(productData.price);
        if (isNaN(price) || price < 0) {
            throw new Error('Le prix doit être un nombre positif');
        }
    }
    
    // Validation des images (si fournies)
    if (productData.images && Array.isArray(productData.images)) {
        if (productData.images.length > adminConfig.maxImagesPerProduct) {
            throw new Error(`Maximum ${adminConfig.maxImagesPerProduct} images par produit`);
        }
        
        // Validation de chaque image
        productData.images.forEach((image, index) => {
            if (!image.url || typeof image.url !== 'string') {
                throw new Error(`Image ${index + 1}: URL manquante ou invalide`);
            }
        });
    }
}

/**
 * GESTION DES IMAGES
 */

/**
 * Upload multiple d'images pour un produit
 * @param {FileList|Array} files - Fichiers à uploader
 * @param {string} productId - ID du produit
 * @param {Function} onProgress - Callback de progression
 * @returns {Promise<Array>} URLs des images uploadées
 */
async function uploadMultipleImages(files, productId, onProgress = null) {
    try {
        if (!adminState.isAuthenticated) {
            throw new Error('Non authentifié');
        }
        
        // Validation des fichiers
        const validFiles = Array.from(files).filter(file => {
            // Vérification du type
            if (!adminConfig.allowedImageTypes.includes(file.type)) {
                console.warn(`Type de fichier non supporté: ${file.type}`);
                return false;
            }
            
            // Vérification de la taille
            if (file.size > adminConfig.maxImageSize) {
                console.warn(`Fichier trop volumineux: ${file.name}`);
                return false;
            }
            
            return true;
        });
        
        if (validFiles.length === 0) {
            throw new Error('Aucun fichier valide à uploader');
        }
        
        // Upload des fichiers en parallèle
        const uploadPromises = validFiles.map((file, index) => {
            const imageName = `image_${Date.now()}_${index}`;
            
            return window.FirebaseUtils.uploadProductImage(
                file,
                productId,
                imageName,
                onProgress ? (progress, state) => onProgress(index, progress, state, file.name) : null
            );
        });
        
        const imageUrls = await Promise.all(uploadPromises);
        
        // Création des objets image avec métadonnées
        const imageObjects = imageUrls.map((url, index) => ({
            url: url,
            alt: `${validFiles[index].name} - Fatima Mobiliário`,
            order: index,
            filename: validFiles[index].name,
            size: validFiles[index].size,
            uploaded_at: new Date().toISOString(),
            uploaded_by: adminState.currentUser.uid
        }));
        
        console.log(`✅ ${imageObjects.length} images uploadées avec succès`);
        return imageObjects;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'upload des images:', error);
        throw error;
    }
}

/**
 * Supprime une image de produit
 * @param {string} imageUrl - URL de l'image à supprimer
 * @returns {Promise<void>}
 */
async function deleteProductImage(imageUrl) {
    try {
        if (!adminState.isAuthenticated) {
            throw new Error('Non authentifié');
        }
        
        await window.FirebaseUtils.deleteProductImage(imageUrl);
        console.log('✅ Image supprimée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression de l\'image:', error);
        throw error;
    }
}

/**
 * Réorganise l'ordre des images d'un produit
 * @param {string} productId - ID du produit
 * @param {Array} newImageOrder - Nouvel ordre des images
 * @returns {Promise<void>}
 */
async function reorderProductImages(productId, newImageOrder) {
    try {
        if (!adminState.isAuthenticated) {
            throw new Error('Non authentifié');
        }
        
        // Mise à jour de l'ordre des images
        const updatedImages = newImageOrder.map((image, index) => ({
            ...image,
            order: index
        }));
        
        // Sauvegarde dans Firestore
        await db.collection('products').doc(productId).update({
            images: updatedImages,
            updated_at: firebase.firestore.Timestamp.now(),
            updated_by: adminState.currentUser.uid
        });
        
        console.log('✅ Ordre des images mis à jour');
        
    } catch (error) {
        console.error('❌ Erreur lors de la réorganisation des images:', error);
        throw error;
    }
}

/**
 * UTILITAIRES ADMIN
 */

/**
 * Affiche une notification admin
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, warning, info)
 * @param {number} duration - Durée d'affichage en ms (0 = permanent)
 */
function showAdminNotification(message, type = 'info', duration = 5000) {
    // Création de la notification
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification--${type}`;
    
    // Icône selon le type
    const icons = {
        success: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
        error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
        warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
        info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
    };
    
    notification.innerHTML = `
        <div class="admin-notification__content">
            <svg class="admin-notification__icon" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                ${icons[type] || icons.info}
            </svg>
            <span class="admin-notification__message">${message}</span>
            <button class="admin-notification__close" type="button" aria-label="Fermer">&times;</button>
        </div>
    `;
    
    // Ajout au DOM
    document.body.appendChild(notification);
    
    // Gestion de la fermeture
    const closeButton = notification.querySelector('.admin-notification__close');
    closeButton.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto-suppression si durée spécifiée
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('admin-notification--visible');
    }, 100);
    
    /**
     * Supprime une notification avec animation
     * @param {HTMLElement} notificationElement - Élément notification
     */
    function removeNotification(notificationElement) {
        if (notificationElement.parentNode) {
            notificationElement.classList.remove('admin-notification--visible');
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.parentNode.removeChild(notificationElement);
                }
            }, 300);
        }
    }
}

/**
 * Confirme une action destructive
 * @param {string} message - Message de confirmation
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation
 * @returns {Promise<boolean>} True si confirmé
 */
function confirmAdminAction(message, confirmText = 'Confirmer', cancelText = 'Annuler') {
    return new Promise((resolve) => {
        // Création de la modal de confirmation
        const modal = document.createElement('div');
        modal.className = 'admin-modal admin-modal--confirm';
        modal.innerHTML = `
            <div class="admin-modal__backdrop"></div>
            <div class="admin-modal__content">
                <div class="admin-modal__header">
                    <h3>Confirmation</h3>
                </div>
                <div class="admin-modal__body">
                    <p>${message}</p>
                </div>
                <div class="admin-modal__footer">
                    <button class="btn btn--outline" id="confirm-cancel">${cancelText}</button>
                    <button class="btn btn--danger" id="confirm-ok">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gestion des événements
        const confirmButton = modal.querySelector('#confirm-ok');
        const cancelButton = modal.querySelector('#confirm-cancel');
        const backdrop = modal.querySelector('.admin-modal__backdrop');
        
        const handleConfirm = () => {
            removeModal();
            resolve(true);
        };
        
        const handleCancel = () => {
            removeModal();
            resolve(false);
        };
        
        const removeModal = () => {
            if (modal.parentNode) {
                modal.classList.remove('admin-modal--visible');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        };
        
        confirmButton.addEventListener('click', handleConfirm);
        cancelButton.addEventListener('click', handleCancel);
        backdrop.addEventListener('click', handleCancel);
        
        // Gestion de l'échap
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Animation d'entrée
        setTimeout(() => {
            modal.classList.add('admin-modal--visible');
        }, 100);
        
        // Focus sur le bouton d'annulation par défaut
        setTimeout(() => {
            cancelButton.focus();
        }, 300);
    });
}

/**
 * Formate une date pour l'affichage admin
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée
 */
function formatAdminDate(date) {
    if (!date || !(date instanceof Date)) {
        return 'Date inconnue';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Si c'est aujourd'hui
    if (diffDays === 0) {
        return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si c'est hier
    if (diffDays === 1) {
        return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si c'est cette semaine
    if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
    }
    
    // Date complète
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Génère un code produit unique
 * @param {string} productName - Nom du produit
 * @returns {string} Code produit généré
 */
function generateProductCode(productName) {
    // Extraction des premières lettres des mots
    const words = productName.toUpperCase().split(' ').filter(word => word.length > 0);
    let code = 'FAT'; // Préfixe Fatima
    
    // Ajout des initiales (maximum 3 lettres supplémentaires)
    words.slice(0, 3).forEach(word => {
        code += word.charAt(0);
    });
    
    // Ajout d'un nombre aléatoire
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    code += randomNum;
    
    return code;
}

/**
 * Vérifie si un code produit est unique
 * @param {string} code - Code à vérifier
 * @param {string} excludeId - ID du produit à exclure (pour les modifications)
 * @returns {Promise<boolean>} True si le code est unique
 */
async function isProductCodeUnique(code, excludeId = null) {
    try {
        const query = db.collection('products').where('code', '==', code);
        const snapshot = await query.get();
        
        // Si aucun document trouvé, le code est unique
        if (snapshot.empty) {
            return true;
        }
        
        // Si un document trouvé mais c'est le produit en cours de modification
        if (snapshot.size === 1 && excludeId) {
            const doc = snapshot.docs[0];
            return doc.id === excludeId;
        }
        
        // Sinon, le code n'est pas unique
        return false;
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du code produit:', error);
        return false;
    }
}

/**
 * Détecte les modifications non sauvegardées
 * @param {HTMLFormElement} form - Formulaire à surveiller
 */
function trackFormChanges(form) {
    if (!form) return;
    
    // Sauvegarde des valeurs initiales
    const initialData = new FormData(form);
    const initialValues = {};
    for (let [key, value] of initialData.entries()) {
        initialValues[key] = value;
    }
    
    // Surveillance des changements
    const checkChanges = () => {
        const currentData = new FormData(form);
        let hasChanges = false;
        
        // Vérification des valeurs modifiées
        for (let [key, value] of currentData.entries()) {
            if (initialValues[key] !== value) {
                hasChanges = true;
                break;
            }
        }
        
        // Vérification des champs supprimés
        if (!hasChanges) {
            for (let key in initialValues) {
                if (!currentData.has(key)) {
                    hasChanges = true;
                    break;
                }
            }
        }
        
        adminState.isDirty = hasChanges;
        
        // Mise à jour de l'interface (indicateur visuel)
        updateDirtyIndicator(hasChanges);
    };
    
    // Ajout des listeners sur tous les champs
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', checkChanges);
        input.addEventListener('change', checkChanges);
    });
    
    // Avertissement avant de quitter la page
    window.addEventListener('beforeunload', (event) => {
        if (adminState.isDirty) {
            event.preventDefault();
            event.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
            return event.returnValue;
        }
    });
}

/**
 * Met à jour l'indicateur de modifications non sauvegardées
 * @param {boolean} isDirty - Si il y a des modifications
 */
function updateDirtyIndicator(isDirty) {
    // Recherche d'un indicateur existant
    let indicator = document.querySelector('.dirty-indicator');
    
    if (isDirty && !indicator) {
        // Création de l'indicateur
        indicator = document.createElement('div');
        indicator.className = 'dirty-indicator';
        indicator.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            Modifications non sauvegardées
        `;
        
        // Ajout à l'en-tête admin
        const adminHeader = document.querySelector('.admin-header');
        if (adminHeader) {
            adminHeader.appendChild(indicator);
        }
        
    } else if (!isDirty && indicator) {
        // Suppression de l'indicateur
        indicator.remove();
    }
}

/**
 * EXPORT DES FONCTIONS UTILITAIRES
 */

// Export des fonctions pour utilisation dans d'autres scripts
window.AdminUtils = {
    // Authentification
    checkAdminAuthentication,
    redirectToAdminLogin,
    
    // CRUD Produits
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getAllProducts,
    validateProductData,
    
    // Images
    uploadMultipleImages,
    deleteProductImage,
    reorderProductImages,
    
    // Utilitaires
    showAdminNotification,
    confirmAdminAction,
    formatAdminDate,
    generateProductCode,
    isProductCodeUnique,
    trackFormChanges,
    
    // État
    getAdminState: () => ({ ...adminState }),
    setCurrentProduct: (product) => { adminState.currentProduct = product; },
    markClean: () => { 
        adminState.isDirty = false; 
        updateDirtyIndicator(false); 
    }
};

// Log de fin d'initialisation
console.log('⚙️ Admin.js chargé et prêt à l\'utilisation');