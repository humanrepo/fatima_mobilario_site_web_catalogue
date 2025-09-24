<?php
/**
 * CONFIGURATION BASE DE DONNÉES - FATIMA MOBILIÁRIO
 * 
 * Configuration et connexion à la base de données.
 * Utilise PDO pour une connexion sécurisée et flexible.
 * 
 * Note: Dans cette implémentation, Firebase Firestore est utilisé comme base principale,
 * mais une base SQL peut servir pour les caches, sessions ou données complémentaires.
 */

/**
 * Configuration de la base de données
 */
class DatabaseConfig {
    // Configuration par défaut (à modifier selon l'environnement)
    private static $config = [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'fatima_mobiliario',
        'username' => 'fatima_user',
        'password' => 'secure_password_here',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    ];
    
    private static $connection = null;
    
    /**
     * Charge la configuration depuis les variables d'environnement
     */
    public static function loadFromEnvironment() {
        // Chargement des variables d'environnement si disponibles
        if (getenv('DB_HOST')) {
            self::$config['host'] = getenv('DB_HOST');
        }
        
        if (getenv('DB_PORT')) {
            self::$config['port'] = (int)getenv('DB_PORT');
        }
        
        if (getenv('DB_DATABASE')) {
            self::$config['database'] = getenv('DB_DATABASE');
        }
        
        if (getenv('DB_USERNAME')) {
            self::$config['username'] = getenv('DB_USERNAME');
        }
        
        if (getenv('DB_PASSWORD')) {
            self::$config['password'] = getenv('DB_PASSWORD');
        }
        
        // Log de la configuration (sans mot de passe)
        error_log("Database config loaded: " . self::$config['host'] . ":" . self::$config['port']);
    }
    
    /**
     * Établit la connexion à la base de données
     * 
     * @return PDO Instance de connexion PDO
     * @throws PDOException En cas d'erreur de connexion
     */
    public static function getConnection() {
        // Connexion singleton
        if (self::$connection !== null) {
            return self::$connection;
        }
        
        try {
            // Chargement de la config depuis l'environnement
            self::loadFromEnvironment();
            
            // Construction du DSN
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                self::$config['host'],
                self::$config['port'],
                self::$config['database'],
                self::$config['charset']
            );
            
            // Création de la connexion PDO
            self::$connection = new PDO(
                $dsn,
                self::$config['username'],
                self::$config['password'],
                self::$config['options']
            );
            
            // Test de la connexion
            self::$connection->query('SELECT 1');
            
            error_log("Database connection established successfully");
            return self::$connection;
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Erreur de connexion à la base de données");
        }
    }
    
    /**
     * Ferme la connexion à la base de données
     */
    public static function closeConnection() {
        self::$connection = null;
        error_log("Database connection closed");
    }
    
    /**
     * Vérifie si la connexion est active
     * 
     * @return bool True si la connexion est active
     */
    public static function isConnected() {
        try {
            if (self::$connection === null) {
                return false;
            }
            
            // Test ping de la connexion
            self::$connection->query('SELECT 1');
            return true;
            
        } catch (PDOException $e) {
            error_log("Database connection check failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Exécute une requête préparée avec gestion d'erreurs
     * 
     * @param string $query Requête SQL avec placeholders
     * @param array $params Paramètres à lier
     * @return PDOStatement Résultat de la requête
     * @throws Exception En cas d'erreur SQL
     */
    public static function executeQuery($query, $params = []) {
        try {
            $connection = self::getConnection();
            $statement = $connection->prepare($query);
            
            // Liaison des paramètres avec types appropriés
            foreach ($params as $key => $value) {
                $type = PDO::PARAM_STR; // Type par défaut
                
                if (is_int($value)) {
                    $type = PDO::PARAM_INT;
                } elseif (is_bool($value)) {
                    $type = PDO::PARAM_BOOL;
                } elseif ($value === null) {
                    $type = PDO::PARAM_NULL;
                }
                
                $statement->bindValue($key, $value, $type);
            }
            
            // Exécution de la requête
            $statement->execute();
            
            return $statement;
            
        } catch (PDOException $e) {
            error_log("Query execution failed: " . $e->getMessage() . " | Query: " . $query);
            throw new Exception("Erreur lors de l'exécution de la requête");
        }
    }
    
    /**
     * Démarre une transaction
     * 
     * @return bool True si la transaction a démarré
     */
    public static function beginTransaction() {
        try {
            $connection = self::getConnection();
            return $connection->beginTransaction();
        } catch (PDOException $e) {
            error_log("Transaction start failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Valide une transaction
     * 
     * @return bool True si la transaction a été validée
     */
    public static function commit() {
        try {
            $connection = self::getConnection();
            return $connection->commit();
        } catch (PDOException $e) {
            error_log("Transaction commit failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Annule une transaction
     * 
     * @return bool True si la transaction a été annulée
     */
    public static function rollback() {
        try {
            $connection = self::getConnection();
            return $connection->rollback();
        } catch (PDOException $e) {
            error_log("Transaction rollback failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Retourne le dernier ID inséré
     * 
     * @return string Dernier ID inséré
     */
    public static function getLastInsertId() {
        try {
            $connection = self::getConnection();
            return $connection->lastInsertId();
        } catch (PDOException $e) {
            error_log("Get last insert ID failed: " . $e->getMessage());
            return null;
        }
    }
}

/**
 * FONCTIONS UTILITAIRES POUR LA BASE DE DONNÉES
 */

/**
 * Fonction helper pour obtenir une connexion à la base de données
 * 
 * @return PDO Instance de connexion
 */
function getDatabaseConnection() {
    return DatabaseConfig::getConnection();
}

/**
 * Fonction helper pour exécuter une requête
 * 
 * @param string $query Requête SQL
 * @param array $params Paramètres
 * @return PDOStatement Résultat
 */
function executeQuery($query, $params = []) {
    return DatabaseConfig::executeQuery($query, $params);
}

/**
 * SCHÉMA DE BASE DE DONNÉES (pour référence)
 * 
 * Note: Les données principales sont stockées dans Firestore,
 * mais ces tables peuvent servir pour le cache, les sessions, etc.
 */

/**
 * Crée les tables nécessaires si elles n'existent pas
 */
function createDatabaseTables() {
    try {
        $connection = getDatabaseConnection();
        
        // Table des sessions admin
        $connection->exec("
            CREATE TABLE IF NOT EXISTS admin_sessions (
                id VARCHAR(128) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Table de cache des produits (pour performances)
        $connection->exec("
            CREATE TABLE IF NOT EXISTS product_cache (
                id VARCHAR(255) PRIMARY KEY,
                data JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Table des logs d'audit
        $connection->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(100) NOT NULL,
                resource_id VARCHAR(255),
                old_data JSON,
                new_data JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_resource (resource_type, resource_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Table des statistiques (cache)
        $connection->exec("
            CREATE TABLE IF NOT EXISTS statistics_cache (
                metric_name VARCHAR(100) PRIMARY KEY,
                metric_value JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        error_log("Database tables created/verified successfully");
        
    } catch (PDOException $e) {
        error_log("Database table creation failed: " . $e->getMessage());
        throw new Exception("Erreur lors de la création des tables");
    }
}

/**
 * NETTOYAGE AUTOMATIQUE
 */

/**
 * Nettoie les données expirées de la base
 */
function cleanupExpiredData() {
    try {
        $connection = getDatabaseConnection();
        
        // Nettoyage des sessions expirées
        $stmt = $connection->prepare("DELETE FROM admin_sessions WHERE expires_at < NOW()");
        $stmt->execute();
        $deletedSessions = $stmt->rowCount();
        
        // Nettoyage du cache expiré
        $stmt = $connection->prepare("DELETE FROM product_cache WHERE expires_at < NOW()");
        $stmt->execute();
        $deletedCache = $stmt->rowCount();
        
        // Nettoyage des logs anciens (garder 6 mois)
        $stmt = $connection->prepare("DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)");
        $stmt->execute();
        $deletedLogs = $stmt->rowCount();
        
        error_log("Database cleanup completed: $deletedSessions sessions, $deletedCache cache entries, $deletedLogs old logs");
        
    } catch (PDOException $e) {
        error_log("Database cleanup failed: " . $e->getMessage());
    }
}

/**
 * INITIALISATION
 */

// Création des tables au premier chargement
if (!defined('SKIP_DB_INIT')) {
    try {
        createDatabaseTables();
    } catch (Exception $e) {
        error_log("Database initialization failed: " . $e->getMessage());
    }
}

// Nettoyage périodique (1% de chance à chaque requête)
if (mt_rand(1, 100) === 1) {
    cleanupExpiredData();
}

?>