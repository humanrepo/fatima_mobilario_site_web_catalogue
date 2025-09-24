<?php
/**
 * CONFIGURATION FIREBASE - FATIMA MOBILIÁRIO
 * 
 * Configuration et initialisation de Firebase Admin SDK pour PHP.
 * Gère Firestore, Storage et Authentication côté serveur.
 */

use Google\Cloud\Firestore\FirestoreClient;
use Google\Cloud\Storage\StorageClient;
use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;

/**
 * Configuration Firebase
 */
class FirebaseConfig {
    private static $firestore = null;
    private static $storage = null;
    private static $auth = null;
    private static $factory = null;
    
    // Configuration par défaut (à modifier selon l'environnement)
    private static $config = [
        'project_id' => 'fatima-mobiliario',
        'storage_bucket' => 'fatima-mobiliario.appspot.com',
        'credentials_path' => __DIR__ . '/firebase-credentials.json'
    ];
    
    /**
     * Charge la configuration depuis les variables d'environnement
     */
    public static function loadFromEnvironment() {
        // Chargement des variables d'environnement si disponibles
        if (getenv('FIREBASE_PROJECT_ID')) {
            self::$config['project_id'] = getenv('FIREBASE_PROJECT_ID');
        }
        
        if (getenv('FIREBASE_STORAGE_BUCKET')) {
            self::$config['storage_bucket'] = getenv('FIREBASE_STORAGE_BUCKET');
        }
        
        if (getenv('FIREBASE_CREDENTIALS_PATH')) {
            self::$config['credentials_path'] = getenv('FIREBASE_CREDENTIALS_PATH');
        }
        
        // Support des credentials en base64 (pour déploiement)
        if (getenv('FIREBASE_CREDENTIALS_BASE64')) {
            $credentialsJson = base64_decode(getenv('FIREBASE_CREDENTIALS_BASE64'));
            $tempFile = tempnam(sys_get_temp_dir(), 'firebase_credentials_');
            file_put_contents($tempFile, $credentialsJson);
            self::$config['credentials_path'] = $tempFile;
        }
        
        error_log("Firebase config loaded for project: " . self::$config['project_id']);
    }
    
    /**
     * Initialise la factory Firebase
     * 
     * @return Factory Instance de la factory Firebase
     * @throws Exception En cas d'erreur d'initialisation
     */
    public static function getFactory() {
        if (self::$factory !== null) {
            return self::$factory;
        }
        
        try {
            self::loadFromEnvironment();
            
            // Vérification de l'existence du fichier de credentials
            if (!file_exists(self::$config['credentials_path'])) {
                throw new Exception("Fichier de credentials Firebase non trouvé: " . self::$config['credentials_path']);
            }
            
            // Création de la factory avec les credentials
            $serviceAccount = ServiceAccount::fromJsonFile(self::$config['credentials_path']);
            
            self::$factory = (new Factory)
                ->withServiceAccount($serviceAccount)
                ->withProjectId(self::$config['project_id']);
            
            error_log("Firebase factory initialized successfully");
            return self::$factory;
            
        } catch (Exception $e) {
            error_log("Firebase factory initialization failed: " . $e->getMessage());
            throw new Exception("Erreur d'initialisation Firebase");
        }
    }
    
    /**
     * Obtient une instance Firestore
     * 
     * @return FirestoreClient Instance Firestore
     * @throws Exception En cas d'erreur de connexion
     */
    public static function getFirestore() {
        if (self::$firestore !== null) {
            return self::$firestore;
        }
        
        try {
            self::loadFromEnvironment();
            
            // Création du client Firestore
            self::$firestore = new FirestoreClient([
                'projectId' => self::$config['project_id'],
                'keyFilePath' => self::$config['credentials_path']
            ]);
            
            error_log("Firestore client initialized successfully");
            return self::$firestore;
            
        } catch (Exception $e) {
            error_log("Firestore initialization failed: " . $e->getMessage());
            throw new Exception("Erreur de connexion Firestore");
        }
    }
    
    /**
     * Obtient une instance Storage
     * 
     * @return StorageClient Instance Storage
     * @throws Exception En cas d'erreur de connexion
     */
    public static function getStorage() {
        if (self::$storage !== null) {
            return self::$storage;
        }
        
        try {
            self::loadFromEnvironment();
            
            // Création du client Storage
            self::$storage = new StorageClient([
                'projectId' => self::$config['project_id'],
                'keyFilePath' => self::$config['credentials_path']
            ]);
            
            error_log("Storage client initialized successfully");
            return self::$storage;
            
        } catch (Exception $e) {
            error_log("Storage initialization failed: " . $e->getMessage());
            throw new Exception("Erreur de connexion Storage");
        }
    }
    
    /**
     * Obtient une instance Auth
     * 
     * @return \Kreait\Firebase\Auth Instance Auth
     * @throws Exception En cas d'erreur de connexion
     */
    public static function getAuth() {
        if (self::$auth !== null) {
            return self::$auth;
        }
        
        try {
            $factory = self::getFactory();
            self::$auth = $factory->createAuth();
            
            error_log("Firebase Auth initialized successfully");
            return self::$auth;
            
        } catch (Exception $e) {
            error_log("Firebase Auth initialization failed: " . $e->getMessage());
            throw new Exception("Erreur d'initialisation Auth");
        }
    }
    
    /**
     * Vérifie un token Firebase ID
     * 
     * @param string $idToken Token ID à vérifier
     * @return array Informations du token décodé
     * @throws Exception Si le token est invalide
     */
    public static function verifyIdToken($idToken) {
        try {
            $auth = self::getAuth();
            $verifiedIdToken = $auth->verifyIdToken($idToken);
            
            $claims = $verifiedIdToken->claims();
            
            return [
                'uid' => $claims->get('sub'),
                'email' => $claims->get('email'),
                'email_verified' => $claims->get('email_verified'),
                'role' => $claims->get('role'),
                'iat' => $claims->get('iat'),
                'exp' => $claims->get('exp')
            ];
            
        } catch (Exception $e) {
            error_log("Token verification failed: " . $e->getMessage());
            throw new Exception("Token invalide");
        }
    }
    
    /**
     * Définit des claims personnalisés pour un utilisateur
     * 
     * @param string $uid UID de l'utilisateur
     * @param array $customClaims Claims personnalisés
     * @throws Exception En cas d'erreur
     */
    public static function setCustomUserClaims($uid, $customClaims) {
        try {
            $auth = self::getAuth();
            $auth->setCustomUserClaims($uid, $customClaims);
            
            error_log("Custom claims set for user: $uid");
            
        } catch (Exception $e) {
            error_log("Set custom claims failed: " . $e->getMessage());
            throw new Exception("Erreur lors de la définition des claims");
        }
    }
    
    /**
     * Obtient les informations d'un utilisateur
     * 
     * @param string $uid UID de l'utilisateur
     * @return array Informations utilisateur
     * @throws Exception Si l'utilisateur n'existe pas
     */
    public static function getUser($uid) {
        try {
            $auth = self::getAuth();
            $userRecord = $auth->getUser($uid);
            
            return [
                'uid' => $userRecord->uid,
                'email' => $userRecord->email,
                'email_verified' => $userRecord->emailVerified,
                'disabled' => $userRecord->disabled,
                'custom_claims' => $userRecord->customClaims,
                'created_at' => $userRecord->metadata->createdAt,
                'last_sign_in' => $userRecord->metadata->lastSignInAt
            ];
            
        } catch (Exception $e) {
            error_log("Get user failed: " . $e->getMessage());
            throw new Exception("Utilisateur non trouvé");
        }
    }
}

/**
 * FONCTIONS UTILITAIRES FIRESTORE
 */

/**
 * Fonction helper pour obtenir une connexion Firestore
 * 
 * @return FirestoreClient Instance Firestore
 */
function getFirestoreConnection() {
    return FirebaseConfig::getFirestore();
}

/**
 * Fonction helper pour obtenir une connexion Storage
 * 
 * @return StorageClient Instance Storage
 */
function getStorageConnection() {
    return FirebaseConfig::getStorage();
}

/**
 * Fonction helper pour obtenir une connexion Firebase générale
 * 
 * @return Factory Factory Firebase
 */
function getFirebaseConnection() {
    return FirebaseConfig::getFactory();
}

/**
 * Récupère tous les produits depuis Firestore
 * 
 * @param array $filters Filtres à appliquer
 * @param int $limit Nombre maximum de résultats
 * @return array Liste des produits
 */
function getProductsFromFirestore($filters = [], $limit = 50) {
    try {
        $firestore = getFirestoreConnection();
        $collection = $firestore->collection('products');
        
        // Construction de la requête
        $query = $collection;
        
        // Application des filtres
        if (isset($filters['status'])) {
            $query = $query->where('status', '=', $filters['status']);
        }
        
        if (isset($filters['category'])) {
            $query = $query->where('category', '=', $filters['category']);
        }
        
        // Tri par date de création (plus récents en premier)
        $query = $query->orderBy('created_at', 'DESC');
        
        // Limite
        if ($limit > 0) {
            $query = $query->limit($limit);
        }
        
        // Exécution de la requête
        $documents = $query->documents();
        
        $products = [];
        foreach ($documents as $document) {
            if ($document->exists()) {
                $data = $document->data();
                $data['id'] = $document->id();
                
                // Conversion des timestamps
                if (isset($data['created_at'])) {
                    $data['created_at'] = $data['created_at']->get()->format('c');
                }
                if (isset($data['updated_at'])) {
                    $data['updated_at'] = $data['updated_at']->get()->format('c');
                }
                if (isset($data['date_published'])) {
                    $data['date_published'] = $data['date_published']->get()->format('c');
                }
                
                $products[] = $data;
            }
        }
        
        return $products;
        
    } catch (Exception $e) {
        error_log("Get products from Firestore failed: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération des produits");
    }
}

/**
 * Récupère un produit spécifique depuis Firestore
 * 
 * @param string $productId ID du produit
 * @return array|null Données du produit ou null si non trouvé
 */
function getProductFromFirestore($productId) {
    try {
        $firestore = getFirestoreConnection();
        $document = $firestore->collection('products')->document($productId);
        $snapshot = $document->snapshot();
        
        if (!$snapshot->exists()) {
            return null;
        }
        
        $data = $snapshot->data();
        $data['id'] = $snapshot->id();
        
        // Conversion des timestamps
        if (isset($data['created_at'])) {
            $data['created_at'] = $data['created_at']->get()->format('c');
        }
        if (isset($data['updated_at'])) {
            $data['updated_at'] = $data['updated_at']->get()->format('c');
        }
        if (isset($data['date_published'])) {
            $data['date_published'] = $data['date_published']->get()->format('c');
        }
        
        return $data;
        
    } catch (Exception $e) {
        error_log("Get product from Firestore failed: " . $e->getMessage());
        throw new Exception("Erreur lors de la récupération du produit");
    }
}

/**
 * Sauvegarde un produit dans Firestore
 * 
 * @param array $productData Données du produit
 * @param string $productId ID du produit (null pour création)
 * @return string ID du produit sauvegardé
 */
function saveProductToFirestore($productData, $productId = null) {
    try {
        $firestore = getFirestoreConnection();
        $collection = $firestore->collection('products');
        
        // Ajout des timestamps
        $now = new DateTime();
        $timestamp = $firestore->timestamp($now);
        
        if ($productId) {
            // Mise à jour
            $productData['updated_at'] = $timestamp;
            $document = $collection->document($productId);
            $document->update($productData);
            
            return $productId;
        } else {
            // Création
            $productData['created_at'] = $timestamp;
            $productData['updated_at'] = $timestamp;
            
            $document = $collection->add($productData);
            return $document->id();
        }
        
    } catch (Exception $e) {
        error_log("Save product to Firestore failed: " . $e->getMessage());
        throw new Exception("Erreur lors de la sauvegarde du produit");
    }
}

/**
 * Supprime un produit de Firestore
 * 
 * @param string $productId ID du produit à supprimer
 * @throws Exception En cas d'erreur
 */
function deleteProductFromFirestore($productId) {
    try {
        $firestore = getFirestoreConnection();
        $document = $firestore->collection('products')->document($productId);
        $document->delete();
        
        error_log("Product deleted from Firestore: $productId");
        
    } catch (Exception $e) {
        error_log("Delete product from Firestore failed: " . $e->getMessage());
        throw new Exception("Erreur lors de la suppression du produit");
    }
}

/**
 * FONCTIONS UTILITAIRES STORAGE
 */

/**
 * Upload un fichier vers Firebase Storage
 * 
 * @param string $localPath Chemin local du fichier
 * @param string $remotePath Chemin distant dans Storage
 * @param array $metadata Métadonnées du fichier
 * @return string URL publique du fichier
 */
function uploadToFirebaseStorage($localPath, $remotePath, $metadata = []) {
    try {
        $storage = getStorageConnection();
        $bucket = $storage->bucket(FirebaseConfig::$config['storage_bucket']);
        
        // Upload du fichier
        $object = $bucket->upload(
            fopen($localPath, 'r'),
            [
                'name' => $remotePath,
                'metadata' => $metadata
            ]
        );
        
        // Génération de l'URL publique
        $object->update(['acl' => []], ['predefinedAcl' => 'publicRead']);
        
        return $object->signedUrl(new DateTime('+1 year'));
        
    } catch (Exception $e) {
        error_log("Upload to Firebase Storage failed: " . $e->getMessage());
        throw new Exception("Erreur lors de l'upload du fichier");
    }
}

/**
 * Supprime un fichier de Firebase Storage
 * 
 * @param string $remotePath Chemin distant du fichier
 * @throws Exception En cas d'erreur
 */
function deleteFromFirebaseStorage($remotePath) {
    try {
        $storage = getStorageConnection();
        $bucket = $storage->bucket(FirebaseConfig::$config['storage_bucket']);
        
        $object = $bucket->object($remotePath);
        $object->delete();
        
        error_log("File deleted from Firebase Storage: $remotePath");
        
    } catch (Exception $e) {
        error_log("Delete from Firebase Storage failed: " . $e->getMessage());
        throw new Exception("Erreur lors de la suppression du fichier");
    }
}

?>