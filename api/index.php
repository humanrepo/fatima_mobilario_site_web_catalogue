<?php
/**
 * API REST FATIMA MOBILIÁRIO
 * 
 * Point d'entrée principal de l'API REST pour le site catalogue.
 * Gère le routage des requêtes vers les endpoints appropriés.
 * 
 * Endpoints disponibles:
 * - GET /api/products - Liste des produits
 * - GET /api/products/{id} - Détail d'un produit
 * - POST /api/products - Création d'un produit (admin)
 * - PUT /api/products/{id} - Modification d'un produit (admin)
 * - DELETE /api/products/{id} - Suppression d'un produit (admin)
 * - POST /api/upload - Upload d'images (admin)
 * - POST /api/auth/login - Connexion admin
 * - POST /api/auth/logout - Déconnexion admin
 */

// Configuration des headers CORS pour permettre les requêtes cross-origin
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Gestion des requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Chargement de l'autoloader Composer
require_once __DIR__ . '/../vendor/autoload.php';

// Chargement des configurations et utilitaires
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/firebase.php';
require_once __DIR__ . '/utils/security.php';
require_once __DIR__ . '/utils/helpers.php';

// Chargement des endpoints
require_once __DIR__ . '/endpoints/products.php';
require_once __DIR__ . '/endpoints/upload.php';
require_once __DIR__ . '/endpoints/auth.php';

/**
 * Classe principale de routage de l'API
 */
class ApiRouter {
    private $method;
    private $path;
    private $segments;
    
    /**
     * Constructeur - Initialise le routeur avec la requête courante
     */
    public function __construct() {
        // Récupération de la méthode HTTP
        $this->method = $_SERVER['REQUEST_METHOD'];
        
        // Récupération et nettoyage du chemin
        $requestUri = $_SERVER['REQUEST_URI'];
        $path = parse_url($requestUri, PHP_URL_PATH);
        
        // Suppression du préfixe /api si présent
        $this->path = preg_replace('#^/api#', '', $path);
        
        // Division du chemin en segments
        $this->segments = array_filter(explode('/', $this->path));
        
        // Log de la requête pour debug
        error_log("API Request: {$this->method} {$this->path}");
    }
    
    /**
     * Route la requête vers le bon endpoint
     */
    public function route() {
        try {
            // Vérification de la validité de la requête
            $this->validateRequest();
            
            // Routage selon le premier segment
            $endpoint = $this->segments[0] ?? '';
            
            switch ($endpoint) {
                case 'products':
                    $this->handleProducts();
                    break;
                    
                case 'upload':
                    $this->handleUpload();
                    break;
                    
                case 'auth':
                    $this->handleAuth();
                    break;
                    
                case 'health':
                    $this->handleHealthCheck();
                    break;
                    
                default:
                    $this->sendError('Endpoint non trouvé', 404);
            }
            
        } catch (Exception $e) {
            // Gestion globale des erreurs
            error_log("API Error: " . $e->getMessage());
            $this->sendError($e->getMessage(), 500);
        }
    }
    
    /**
     * Valide la requête entrante
     */
    private function validateRequest() {
        // Vérification de la taille du payload pour éviter les attaques
        $maxSize = 50 * 1024 * 1024; // 50MB
        if (isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > $maxSize) {
            throw new Exception('Payload trop volumineux');
        }
        
        // Vérification du Content-Type pour les requêtes POST/PUT
        if (in_array($this->method, ['POST', 'PUT'])) {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            // Autoriser JSON et multipart/form-data (pour uploads)
            if (!preg_match('#^(application/json|multipart/form-data)#', $contentType)) {
                // Tolérer les requêtes sans Content-Type pour compatibilité
                if (!empty($contentType)) {
                    throw new Exception('Content-Type non supporté');
                }
            }
        }
    }
    
    /**
     * Gère les requêtes relatives aux produits
     */
    private function handleProducts() {
        $productsHandler = new ProductsEndpoint();
        
        // Récupération de l'ID produit si présent
        $productId = $this->segments[1] ?? null;
        
        switch ($this->method) {
            case 'GET':
                if ($productId) {
                    // GET /api/products/{id} - Détail d'un produit
                    $productsHandler->getProduct($productId);
                } else {
                    // GET /api/products - Liste des produits
                    $productsHandler->getProducts();
                }
                break;
                
            case 'POST':
                // POST /api/products - Création d'un produit (admin uniquement)
                $productsHandler->createProduct();
                break;
                
            case 'PUT':
                // PUT /api/products/{id} - Modification d'un produit (admin uniquement)
                if (!$productId) {
                    $this->sendError('ID produit manquant', 400);
                }
                $productsHandler->updateProduct($productId);
                break;
                
            case 'DELETE':
                // DELETE /api/products/{id} - Suppression d'un produit (admin uniquement)
                if (!$productId) {
                    $this->sendError('ID produit manquant', 400);
                }
                $productsHandler->deleteProduct($productId);
                break;
                
            default:
                $this->sendError('Méthode non autorisée', 405);
        }
    }
    
    /**
     * Gère les requêtes d'upload
     */
    private function handleUpload() {
        if ($this->method !== 'POST') {
            $this->sendError('Méthode non autorisée', 405);
        }
        
        $uploadHandler = new UploadEndpoint();
        $uploadHandler->uploadImages();
    }
    
    /**
     * Gère les requêtes d'authentification
     */
    private function handleAuth() {
        $authHandler = new AuthEndpoint();
        
        $action = $this->segments[1] ?? '';
        
        switch ($action) {
            case 'login':
                if ($this->method !== 'POST') {
                    $this->sendError('Méthode non autorisée', 405);
                }
                $authHandler->login();
                break;
                
            case 'logout':
                if ($this->method !== 'POST') {
                    $this->sendError('Méthode non autorisée', 405);
                }
                $authHandler->logout();
                break;
                
            case 'verify':
                if ($this->method !== 'GET') {
                    $this->sendError('Méthode non autorisée', 405);
                }
                $authHandler->verifyToken();
                break;
                
            default:
                $this->sendError('Action d\'authentification inconnue', 404);
        }
    }
    
    /**
     * Gère le health check de l'API
     */
    private function handleHealthCheck() {
        if ($this->method !== 'GET') {
            $this->sendError('Méthode non autorisée', 405);
        }
        
        $health = [
            'status' => 'OK',
            'timestamp' => date('c'),
            'version' => '1.0.0',
            'services' => [
                'database' => $this->checkDatabaseHealth(),
                'firebase' => $this->checkFirebaseHealth(),
                'storage' => $this->checkStorageHealth()
            ]
        ];
        
        $this->sendResponse($health);
    }
    
    /**
     * Vérifie la santé de la base de données
     */
    private function checkDatabaseHealth() {
        try {
            // Test de connexion basique
            $pdo = getDatabaseConnection();
            $stmt = $pdo->query('SELECT 1');
            return $stmt ? 'OK' : 'ERROR';
        } catch (Exception $e) {
            return 'ERROR';
        }
    }
    
    /**
     * Vérifie la santé de Firebase
     */
    private function checkFirebaseHealth() {
        try {
            // Test de connexion Firebase
            $firebase = getFirebaseConnection();
            return $firebase ? 'OK' : 'ERROR';
        } catch (Exception $e) {
            return 'ERROR';
        }
    }
    
    /**
     * Vérifie la santé du stockage
     */
    private function checkStorageHealth() {
        try {
            // Vérification de l'espace disque disponible
            $freeBytes = disk_free_space(__DIR__);
            $totalBytes = disk_total_space(__DIR__);
            
            if ($freeBytes === false || $totalBytes === false) {
                return 'ERROR';
            }
            
            $freePercent = ($freeBytes / $totalBytes) * 100;
            
            // Alerte si moins de 10% d'espace libre
            if ($freePercent < 10) {
                return 'WARNING';
            }
            
            return 'OK';
        } catch (Exception $e) {
            return 'ERROR';
        }
    }
    
    /**
     * Envoie une réponse JSON de succès
     */
    public function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        
        $response = [
            'success' => true,
            'data' => $data,
            'timestamp' => date('c')
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }
    
    /**
     * Envoie une réponse JSON d'erreur
     */
    public function sendError($message, $statusCode = 400, $details = null) {
        http_response_code($statusCode);
        
        $response = [
            'success' => false,
            'error' => [
                'message' => $message,
                'code' => $statusCode,
                'timestamp' => date('c')
            ]
        ];
        
        if ($details !== null) {
            $response['error']['details'] = $details;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }
}

/**
 * GESTION GLOBALE DES ERREURS
 */

// Configuration de la gestion d'erreurs
set_error_handler(function($severity, $message, $file, $line) {
    // Log de l'erreur
    error_log("PHP Error: $message in $file on line $line");
    
    // Si c'est une erreur fatale, envoyer une réponse d'erreur
    if ($severity === E_ERROR || $severity === E_CORE_ERROR || $severity === E_COMPILE_ERROR) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => [
                'message' => 'Erreur interne du serveur',
                'code' => 500,
                'timestamp' => date('c')
            ]
        ]);
        exit();
    }
});

// Gestion des exceptions non capturées
set_exception_handler(function($exception) {
    error_log("Uncaught Exception: " . $exception->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'message' => 'Erreur interne du serveur',
            'code' => 500,
            'timestamp' => date('c')
        ]
    ]);
    exit();
});

/**
 * POINT D'ENTRÉE PRINCIPAL
 */

try {
    // Création et exécution du routeur
    $router = new ApiRouter();
    $router->route();
    
} catch (Exception $e) {
    // Gestion d'erreur de dernier recours
    error_log("Fatal API Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'message' => 'Erreur critique de l\'API',
            'code' => 500,
            'timestamp' => date('c')
        ]
    ]);
}
?>