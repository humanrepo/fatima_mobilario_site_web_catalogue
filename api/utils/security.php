<?php
/**
 * UTILITAIRES DE SÉCURITÉ - FATIMA MOBILIÁRIO
 * 
 * Fonctions de sécurité pour protéger l'API et l'application
 * contre les attaques communes (XSS, CSRF, injection, etc.)
 */

/**
 * PROTECTION CONTRE LES ATTAQUES
 */

/**
 * Valide et nettoie les données d'entrée
 * 
 * @param mixed $data Données à valider
 * @param array $rules Règles de validation
 * @return array Résultat de validation
 */
function validateInput($data, $rules = []) {
    $errors = [];
    $sanitized = [];
    
    foreach ($rules as $field => $fieldRules) {
        $value = $data[$field] ?? null;
        $fieldErrors = [];
        
        // Validation des règles
        foreach ($fieldRules as $rule => $ruleValue) {
            switch ($rule) {
                case 'required':
                    if ($ruleValue && ($value === null || $value === '')) {
                        $fieldErrors[] = "Le champ $field est obligatoire";
                    }
                    break;
                    
                case 'type':
                    if ($value !== null && !validateType($value, $ruleValue)) {
                        $fieldErrors[] = "Le champ $field doit être de type $ruleValue";
                    }
                    break;
                    
                case 'min_length':
                    if ($value !== null && strlen($value) < $ruleValue) {
                        $fieldErrors[] = "Le champ $field doit contenir au moins $ruleValue caractères";
                    }
                    break;
                    
                case 'max_length':
                    if ($value !== null && strlen($value) > $ruleValue) {
                        $fieldErrors[] = "Le champ $field ne peut pas dépasser $ruleValue caractères";
                    }
                    break;
                    
                case 'min_value':
                    if ($value !== null && is_numeric($value) && $value < $ruleValue) {
                        $fieldErrors[] = "Le champ $field doit être supérieur ou égal à $ruleValue";
                    }
                    break;
                    
                case 'max_value':
                    if ($value !== null && is_numeric($value) && $value > $ruleValue) {
                        $fieldErrors[] = "Le champ $field doit être inférieur ou égal à $ruleValue";
                    }
                    break;
                    
                case 'pattern':
                    if ($value !== null && !preg_match($ruleValue, $value)) {
                        $fieldErrors[] = "Le format du champ $field est invalide";
                    }
                    break;
                    
                case 'in':
                    if ($value !== null && !in_array($value, $ruleValue)) {
                        $fieldErrors[] = "La valeur du champ $field n'est pas autorisée";
                    }
                    break;
            }
        }
        
        // Sanitisation si pas d'erreurs
        if (empty($fieldErrors)) {
            $sanitized[$field] = sanitizeValue($value, $fieldRules);
        } else {
            $errors[$field] = $fieldErrors;
        }
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'data' => $sanitized
    ];
}

/**
 * Valide le type d'une valeur
 * 
 * @param mixed $value Valeur à valider
 * @param string $type Type attendu
 * @return bool True si le type correspond
 */
function validateType($value, $type) {
    switch ($type) {
        case 'string':
            return is_string($value);
        case 'integer':
            return is_int($value) || (is_string($value) && ctype_digit($value));
        case 'float':
            return is_float($value) || is_numeric($value);
        case 'boolean':
            return is_bool($value) || in_array($value, ['true', 'false', '1', '0'], true);
        case 'email':
            return filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
        case 'url':
            return filter_var($value, FILTER_VALIDATE_URL) !== false;
        case 'array':
            return is_array($value);
        default:
            return true;
    }
}

/**
 * Sanitise une valeur selon les règles
 * 
 * @param mixed $value Valeur à sanitiser
 * @param array $rules Règles de sanitisation
 * @return mixed Valeur sanitisée
 */
function sanitizeValue($value, $rules) {
    if ($value === null) {
        return null;
    }
    
    // Conversion de type si nécessaire
    if (isset($rules['type'])) {
        switch ($rules['type']) {
            case 'integer':
                $value = (int)$value;
                break;
            case 'float':
                $value = (float)$value;
                break;
            case 'boolean':
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                break;
            case 'string':
                $value = (string)$value;
                break;
        }
    }
    
    // Sanitisation des chaînes
    if (is_string($value)) {
        // Suppression des espaces en début/fin
        $value = trim($value);
        
        // Protection XSS par défaut
        if (!isset($rules['allow_html']) || !$rules['allow_html']) {
            $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        }
        
        // Troncature si longueur max définie
        if (isset($rules['max_length'])) {
            $value = mb_substr($value, 0, $rules['max_length'], 'UTF-8');
        }
    }
    
    return $value;
}

/**
 * PROTECTION CSRF
 */

/**
 * Génère un token CSRF
 * 
 * @return string Token CSRF
 */
function generateCSRFToken() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $token = bin2hex(random_bytes(32));
    $_SESSION['csrf_token'] = $token;
    $_SESSION['csrf_token_time'] = time();
    
    return $token;
}

/**
 * Valide un token CSRF
 * 
 * @param string $token Token à valider
 * @param int $maxAge Âge maximum du token en secondes
 * @return bool True si le token est valide
 */
function validateCSRFToken($token, $maxAge = 3600) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Vérification de l'existence du token en session
    if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
        return false;
    }
    
    // Vérification de l'âge du token
    if ((time() - $_SESSION['csrf_token_time']) > $maxAge) {
        unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
        return false;
    }
    
    // Comparaison sécurisée des tokens
    $valid = hash_equals($_SESSION['csrf_token'], $token);
    
    // Suppression du token après utilisation (single-use)
    if ($valid) {
        unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
    }
    
    return $valid;
}

/**
 * PROTECTION CONTRE LES INJECTIONS
 */

/**
 * Échappe les données pour une requête SQL
 * 
 * @param mixed $value Valeur à échapper
 * @param PDO $pdo Instance PDO pour l'échappement
 * @return mixed Valeur échappée
 */
function escapeSQLValue($value, $pdo = null) {
    if ($value === null) {
        return null;
    }
    
    if ($pdo instanceof PDO) {
        return $pdo->quote($value);
    }
    
    // Fallback basique (non recommandé en production)
    if (is_string($value)) {
        return "'" . addslashes($value) . "'";
    }
    
    return $value;
}

/**
 * Valide une requête SQL pour détecter les injections
 * 
 * @param string $query Requête à valider
 * @return bool True si la requête semble sûre
 */
function validateSQLQuery($query) {
    // Mots-clés dangereux dans les requêtes utilisateur
    $dangerousKeywords = [
        'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE',
        'EXEC', 'EXECUTE', 'UNION', 'INSERT', 'UPDATE',
        'REPLACE', 'LOAD_FILE', 'OUTFILE', 'DUMPFILE'
    ];
    
    $upperQuery = strtoupper($query);
    
    foreach ($dangerousKeywords as $keyword) {
        if (strpos($upperQuery, $keyword) !== false) {
            return false;
        }
    }
    
    return true;
}

/**
 * LIMITATION DE TAUX (RATE LIMITING)
 */

/**
 * Vérifie et applique la limitation de taux
 * 
 * @param string $identifier Identifiant unique
 * @param array $limits Configuration des limites
 * @return array Résultat de la vérification
 */
function checkRateLimit($identifier, $limits = []) {
    $defaultLimits = [
        'requests_per_minute' => 60,
        'requests_per_hour' => 1000,
        'requests_per_day' => 10000
    ];
    
    $limits = array_merge($defaultLimits, $limits);
    $now = time();
    $cacheKey = 'rate_limit_' . md5($identifier);
    
    // Récupération des données de rate limiting
    $data = getRateLimitData($cacheKey);
    
    // Vérification des différentes limites
    foreach ($limits as $period => $maxRequests) {
        $timeWindow = getPeriodDuration($period);
        
        if (!$timeWindow) continue;
        
        // Nettoyage des requêtes expirées pour cette période
        $data[$period] = array_filter($data[$period] ?? [], function($timestamp) use ($now, $timeWindow) {
            return ($now - $timestamp) < $timeWindow;
        });
        
        // Vérification de la limite
        if (count($data[$period]) >= $maxRequests) {
            return [
                'allowed' => false,
                'limit' => $maxRequests,
                'remaining' => 0,
                'reset_time' => $now + $timeWindow,
                'period' => $period
            ];
        }
        
        // Ajout de la requête courante
        $data[$period][] = $now;
    }
    
    // Sauvegarde des données mises à jour
    saveRateLimitData($cacheKey, $data);
    
    return [
        'allowed' => true,
        'limit' => $limits['requests_per_minute'],
        'remaining' => $limits['requests_per_minute'] - count($data['requests_per_minute'] ?? []),
        'reset_time' => $now + 60
    ];
}

/**
 * Récupère les données de rate limiting depuis le cache
 * 
 * @param string $cacheKey Clé de cache
 * @return array Données de rate limiting
 */
function getRateLimitData($cacheKey) {
    $cacheFile = sys_get_temp_dir() . '/' . $cacheKey . '.json';
    
    if (file_exists($cacheFile)) {
        $content = file_get_contents($cacheFile);
        $data = json_decode($content, true);
        
        if (is_array($data)) {
            return $data;
        }
    }
    
    return [];
}

/**
 * Sauvegarde les données de rate limiting dans le cache
 * 
 * @param string $cacheKey Clé de cache
 * @param array $data Données à sauvegarder
 */
function saveRateLimitData($cacheKey, $data) {
    $cacheFile = sys_get_temp_dir() . '/' . $cacheKey . '.json';
    file_put_contents($cacheFile, json_encode($data));
}

/**
 * Retourne la durée en secondes d'une période
 * 
 * @param string $period Période (requests_per_minute, etc.)
 * @return int|false Durée en secondes ou false
 */
function getPeriodDuration($period) {
    switch ($period) {
        case 'requests_per_minute':
            return 60;
        case 'requests_per_hour':
            return 3600;
        case 'requests_per_day':
            return 86400;
        default:
            return false;
    }
}

/**
 * PROTECTION CONTRE LES ATTAQUES PAR FORCE BRUTE
 */

/**
 * Enregistre une tentative de connexion
 * 
 * @param string $identifier Identifiant (IP, email, etc.)
 * @param bool $success Succès de la tentative
 * @param string $type Type de tentative (login, api, etc.)
 */
function recordLoginAttempt($identifier, $success, $type = 'login') {
    $cacheKey = 'login_attempts_' . md5($identifier . '_' . $type);
    $now = time();
    
    // Récupération des tentatives existantes
    $attempts = getLoginAttempts($cacheKey);
    
    // Nettoyage des tentatives expirées (24h)
    $attempts = array_filter($attempts, function($attempt) use ($now) {
        return ($now - $attempt['timestamp']) < 86400;
    });
    
    // Ajout de la nouvelle tentative
    $attempts[] = [
        'timestamp' => $now,
        'success' => $success,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    // Limitation du nombre d'enregistrements (100 max)
    if (count($attempts) > 100) {
        $attempts = array_slice($attempts, -100);
    }
    
    // Sauvegarde
    saveLoginAttempts($cacheKey, $attempts);
    
    // Log de sécurité
    logSecurityEvent('login_attempt', $identifier, [
        'success' => $success,
        'type' => $type,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
}

/**
 * Vérifie si un identifiant est bloqué pour tentatives excessives
 * 
 * @param string $identifier Identifiant à vérifier
 * @param string $type Type de tentative
 * @param array $config Configuration des limites
 * @return array Résultat de la vérification
 */
function isLoginBlocked($identifier, $type = 'login', $config = []) {
    $defaultConfig = [
        'max_attempts' => 5,        // Tentatives max
        'time_window' => 900,       // Fenêtre de temps (15 min)
        'block_duration' => 3600    // Durée de blocage (1h)
    ];
    
    $config = array_merge($defaultConfig, $config);
    $cacheKey = 'login_attempts_' . md5($identifier . '_' . $type);
    $now = time();
    
    // Récupération des tentatives
    $attempts = getLoginAttempts($cacheKey);
    
    // Filtrage des tentatives dans la fenêtre de temps
    $recentAttempts = array_filter($attempts, function($attempt) use ($now, $config) {
        return ($now - $attempt['timestamp']) < $config['time_window'];
    });
    
    // Comptage des échecs récents
    $failedAttempts = array_filter($recentAttempts, function($attempt) {
        return !$attempt['success'];
    });
    
    $failedCount = count($failedAttempts);
    
    // Vérification du blocage
    if ($failedCount >= $config['max_attempts']) {
        $lastFailure = max(array_column($failedAttempts, 'timestamp'));
        $unblockTime = $lastFailure + $config['block_duration'];
        
        if ($now < $unblockTime) {
            return [
                'blocked' => true,
                'attempts' => $failedCount,
                'max_attempts' => $config['max_attempts'],
                'unblock_time' => $unblockTime,
                'remaining_time' => $unblockTime - $now
            ];
        }
    }
    
    return [
        'blocked' => false,
        'attempts' => $failedCount,
        'max_attempts' => $config['max_attempts'],
        'remaining_attempts' => max(0, $config['max_attempts'] - $failedCount)
    ];
}

/**
 * Récupère les tentatives de connexion depuis le cache
 * 
 * @param string $cacheKey Clé de cache
 * @return array Tentatives de connexion
 */
function getLoginAttempts($cacheKey) {
    $cacheFile = sys_get_temp_dir() . '/' . $cacheKey . '.json';
    
    if (file_exists($cacheFile)) {
        $content = file_get_contents($cacheFile);
        $data = json_decode($content, true);
        
        if (is_array($data)) {
            return $data;
        }
    }
    
    return [];
}

/**
 * Sauvegarde les tentatives de connexion dans le cache
 * 
 * @param string $cacheKey Clé de cache
 * @param array $attempts Tentatives à sauvegarder
 */
function saveLoginAttempts($cacheKey, $attempts) {
    $cacheFile = sys_get_temp_dir() . '/' . $cacheKey . '.json';
    file_put_contents($cacheFile, json_encode($attempts));
}

/**
 * LOGGING DE SÉCURITÉ
 */

/**
 * Log un événement de sécurité
 * 
 * @param string $event Type d'événement
 * @param string $identifier Identifiant concerné
 * @param array $data Données supplémentaires
 */
function logSecurityEvent($event, $identifier, $data = []) {
    $logEntry = [
        'timestamp' => date('c'),
        'event' => $event,
        'identifier' => $identifier,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'data' => $data
    ];
    
    $logMessage = '[SECURITY] ' . json_encode($logEntry, JSON_UNESCAPED_UNICODE);
    error_log($logMessage);
    
    // Sauvegarde en base si critique
    $criticalEvents = ['login_blocked', 'injection_attempt', 'rate_limit_exceeded'];
    
    if (in_array($event, $criticalEvents)) {
        try {
            if (function_exists('executeQuery')) {
                executeQuery(
                    "INSERT INTO security_logs (event, identifier, ip_address, user_agent, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
                    [
                        $event,
                        $identifier,
                        $_SERVER['REMOTE_ADDR'] ?? null,
                        $_SERVER['HTTP_USER_AGENT'] ?? null,
                        json_encode($data)
                    ]
                );
            }
        } catch (Exception $e) {
            error_log("Failed to log security event to database: " . $e->getMessage());
        }
    }
}

/**
 * NETTOYAGE ET MAINTENANCE
 */

/**
 * Nettoie les fichiers de cache de sécurité expirés
 */
function cleanupSecurityCache() {
    $tempDir = sys_get_temp_dir();
    $now = time();
    $maxAge = 86400; // 24 heures
    
    // Nettoyage des fichiers de rate limiting et login attempts
    $patterns = ['rate_limit_*.json', 'login_attempts_*.json'];
    
    foreach ($patterns as $pattern) {
        $files = glob($tempDir . '/' . $pattern);
        
        foreach ($files as $file) {
            if (file_exists($file) && (filemtime($file) + $maxAge) < $now) {
                unlink($file);
            }
        }
    }
    
    error_log("Security cache cleanup completed");
}

// Nettoyage automatique (1% de chance à chaque chargement)
if (mt_rand(1, 100) === 1) {
    cleanupSecurityCache();
}

?>