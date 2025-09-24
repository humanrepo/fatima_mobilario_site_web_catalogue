<?php
/**
 * FONCTIONS UTILITAIRES - FATIMA MOBILIÁRIO
 * 
 * Collection de fonctions helper utilisées dans toute l'application.
 * Inclut la validation, formatage, manipulation de données, etc.
 */

/**
 * VALIDATION ET SANITISATION
 */

/**
 * Valide et nettoie une adresse email
 * 
 * @param string $email Email à valider
 * @return string|false Email nettoyé ou false si invalide
 */
function validateEmail($email) {
    $email = trim($email);
    
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return strtolower($email);
    }
    
    return false;
}

/**
 * Valide un mot de passe selon les critères de sécurité
 * 
 * @param string $password Mot de passe à valider
 * @return array Résultat de validation avec erreurs
 */
function validatePassword($password) {
    $errors = [];
    
    if (strlen($password) < 8) {
        $errors[] = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Le mot de passe doit contenir au moins une majuscule';
    }
    
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Le mot de passe doit contenir au moins une minuscule';
    }
    
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Le mot de passe doit contenir au moins un chiffre';
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors
    ];
}

/**
 * Nettoie et valide une chaîne de texte
 * 
 * @param string $text Texte à nettoyer
 * @param int $maxLength Longueur maximum (0 = illimité)
 * @param bool $allowHtml Autoriser les balises HTML
 * @return string Texte nettoyé
 */
function sanitizeText($text, $maxLength = 0, $allowHtml = false) {
    // Suppression des espaces en début/fin
    $text = trim($text);
    
    // Nettoyage HTML si non autorisé
    if (!$allowHtml) {
        $text = strip_tags($text);
    } else {
        // Liste des balises autorisées pour le contenu riche
        $allowedTags = '<p><br><strong><em><u><h1><h2><h3><h4><h5><h6><ul><ol><li><a>';
        $text = strip_tags($text, $allowedTags);
    }
    
    // Décodage des entités HTML
    $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
    
    // Limitation de la longueur
    if ($maxLength > 0 && mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength, 'UTF-8');
    }
    
    // Encodage pour la sécurité
    if (!$allowHtml) {
        $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    }
    
    return $text;
}

/**
 * Valide et nettoie un prix
 * 
 * @param mixed $price Prix à valider
 * @return float|false Prix validé ou false si invalide
 */
function validatePrice($price) {
    // Conversion en float
    $price = floatval($price);
    
    // Vérification que c'est un nombre positif
    if ($price < 0 || !is_finite($price)) {
        return false;
    }
    
    // Arrondi à 2 décimales
    return round($price, 2);
}

/**
 * FORMATAGE ET AFFICHAGE
 */

/**
 * Formate un prix pour l'affichage
 * 
 * @param float $price Prix à formater
 * @param string $currency Code de devise
 * @param string $locale Locale pour le formatage
 * @return string Prix formaté
 */
function formatPrice($price, $currency = 'EUR', $locale = 'pt_PT') {
    if ($price === null || $price === '') {
        return 'Prix sur demande';
    }
    
    // Utilisation de NumberFormatter si disponible
    if (class_exists('NumberFormatter')) {
        $formatter = new NumberFormatter($locale, NumberFormatter::CURRENCY);
        return $formatter->formatCurrency($price, $currency);
    }
    
    // Fallback simple
    return number_format($price, 2, ',', ' ') . ' €';
}

/**
 * Formate une date pour l'affichage
 * 
 * @param DateTime|string $date Date à formater
 * @param string $format Format de sortie
 * @param string $locale Locale pour le formatage
 * @return string Date formatée
 */
function formatDate($date, $format = 'long', $locale = 'fr_FR') {
    // Conversion en DateTime si nécessaire
    if (is_string($date)) {
        try {
            $date = new DateTime($date);
        } catch (Exception $e) {
            return 'Date invalide';
        }
    }
    
    if (!$date instanceof DateTime) {
        return 'Date invalide';
    }
    
    // Formats prédéfinis
    $formats = [
        'short' => 'd/m/Y',
        'medium' => 'd M Y',
        'long' => 'd F Y',
        'full' => 'l d F Y',
        'datetime' => 'd/m/Y H:i',
        'time' => 'H:i'
    ];
    
    $formatString = $formats[$format] ?? $format;
    
    // Formatage avec locale française
    $months = [
        1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril',
        5 => 'mai', 6 => 'juin', 7 => 'juillet', 8 => 'août',
        9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre'
    ];
    
    $days = [
        1 => 'lundi', 2 => 'mardi', 3 => 'mercredi', 4 => 'jeudi',
        5 => 'vendredi', 6 => 'samedi', 0 => 'dimanche'
    ];
    
    $formatted = $date->format($formatString);
    
    // Remplacement des noms de mois et jours
    if (strpos($formatString, 'F') !== false) {
        $month = $months[(int)$date->format('n')];
        $formatted = str_replace($date->format('F'), $month, $formatted);
    }
    
    if (strpos($formatString, 'M') !== false) {
        $month = substr($months[(int)$date->format('n')], 0, 3);
        $formatted = str_replace($date->format('M'), $month, $formatted);
    }
    
    if (strpos($formatString, 'l') !== false) {
        $day = $days[(int)$date->format('w')];
        $formatted = str_replace($date->format('l'), $day, $formatted);
    }
    
    return $formatted;
}

/**
 * Génère un slug URL-friendly à partir d'un texte
 * 
 * @param string $text Texte à convertir
 * @param int $maxLength Longueur maximum
 * @return string Slug généré
 */
function generateSlug($text, $maxLength = 100) {
    // Conversion en minuscules
    $slug = strtolower($text);
    
    // Remplacement des caractères accentués
    $accents = [
        'à' => 'a', 'á' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'å' => 'a',
        'è' => 'e', 'é' => 'e', 'ê' => 'e', 'ë' => 'e',
        'ì' => 'i', 'í' => 'i', 'î' => 'i', 'ï' => 'i',
        'ò' => 'o', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
        'ù' => 'u', 'ú' => 'u', 'û' => 'u', 'ü' => 'u',
        'ç' => 'c', 'ñ' => 'n'
    ];
    
    $slug = strtr($slug, $accents);
    
    // Suppression des caractères non alphanumériques
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    
    // Remplacement des espaces et tirets multiples par un seul tiret
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    
    // Suppression des tirets en début/fin
    $slug = trim($slug, '-');
    
    // Limitation de la longueur
    if (strlen($slug) > $maxLength) {
        $slug = substr($slug, 0, $maxLength);
        $slug = rtrim($slug, '-');
    }
    
    return $slug;
}

/**
 * MANIPULATION DE FICHIERS ET IMAGES
 */

/**
 * Valide un fichier image uploadé
 * 
 * @param array $file Informations du fichier ($_FILES)
 * @return array Résultat de validation
 */
function validateImageFile($file) {
    $errors = [];
    $maxSize = 10 * 1024 * 1024; // 10MB
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    // Vérification de l'upload
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        $errors[] = 'Erreur lors de l\'upload du fichier';
        return ['valid' => false, 'errors' => $errors];
    }
    
    // Vérification de la taille
    if ($file['size'] > $maxSize) {
        $errors[] = 'Le fichier est trop volumineux (maximum 10MB)';
    }
    
    // Vérification du type MIME
    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, $allowedTypes)) {
        $errors[] = 'Type de fichier non autorisé (JPEG, PNG, WebP uniquement)';
    }
    
    // Vérification de l'extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, $allowedExtensions)) {
        $errors[] = 'Extension de fichier non autorisée';
    }
    
    // Vérification que c'est vraiment une image
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        $errors[] = 'Le fichier n\'est pas une image valide';
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'info' => $imageInfo,
        'mime_type' => $mimeType,
        'extension' => $extension
    ];
}

/**
 * Génère un nom de fichier unique et sécurisé
 * 
 * @param string $originalName Nom original du fichier
 * @param string $prefix Préfixe optionnel
 * @return string Nom de fichier généré
 */
function generateSecureFilename($originalName, $prefix = '') {
    // Extraction de l'extension
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    
    // Génération d'un nom unique
    $timestamp = time();
    $random = bin2hex(random_bytes(8));
    
    $filename = $prefix . $timestamp . '_' . $random;
    
    if ($extension) {
        $filename .= '.' . $extension;
    }
    
    return $filename;
}

/**
 * UTILITAIRES GÉNÉRAUX
 */

/**
 * Génère un UUID v4
 * 
 * @return string UUID généré
 */
function generateUUID() {
    if (function_exists('random_bytes')) {
        $data = random_bytes(16);
    } else {
        $data = openssl_random_pseudo_bytes(16);
    }
    
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * Vérifie si une chaîne est un UUID valide
 * 
 * @param string $uuid UUID à vérifier
 * @return bool True si valide
 */
function isValidUUID($uuid) {
    $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
    return preg_match($pattern, $uuid) === 1;
}

/**
 * Convertit un tableau en objet JSON sécurisé
 * 
 * @param mixed $data Données à convertir
 * @param int $flags Flags JSON
 * @return string JSON généré
 */
function toSecureJSON($data, $flags = JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) {
    // Suppression des clés sensibles
    if (is_array($data)) {
        $sensitiveKeys = ['password', 'token', 'secret', 'key', 'credentials'];
        $data = removeSensitiveKeys($data, $sensitiveKeys);
    }
    
    return json_encode($data, $flags);
}

/**
 * Supprime récursivement les clés sensibles d'un tableau
 * 
 * @param array $data Données à nettoyer
 * @param array $sensitiveKeys Clés à supprimer
 * @return array Données nettoyées
 */
function removeSensitiveKeys($data, $sensitiveKeys) {
    if (!is_array($data)) {
        return $data;
    }
    
    foreach ($data as $key => $value) {
        // Suppression des clés sensibles
        foreach ($sensitiveKeys as $sensitiveKey) {
            if (stripos($key, $sensitiveKey) !== false) {
                $data[$key] = '[HIDDEN]';
                continue 2;
            }
        }
        
        // Récursion pour les tableaux imbriqués
        if (is_array($value)) {
            $data[$key] = removeSensitiveKeys($value, $sensitiveKeys);
        }
    }
    
    return $data;
}

/**
 * Limite le taux de requêtes (rate limiting simple)
 * 
 * @param string $identifier Identifiant unique (IP, user ID, etc.)
 * @param int $maxRequests Nombre maximum de requêtes
 * @param int $timeWindow Fenêtre de temps en secondes
 * @return bool True si la requête est autorisée
 */
function isRateLimited($identifier, $maxRequests = 100, $timeWindow = 3600) {
    $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($identifier);
    $now = time();
    
    // Lecture du cache existant
    $requests = [];
    if (file_exists($cacheFile)) {
        $content = file_get_contents($cacheFile);
        $requests = json_decode($content, true) ?: [];
    }
    
    // Nettoyage des requêtes expirées
    $requests = array_filter($requests, function($timestamp) use ($now, $timeWindow) {
        return ($now - $timestamp) < $timeWindow;
    });
    
    // Vérification de la limite
    if (count($requests) >= $maxRequests) {
        return true; // Rate limited
    }
    
    // Ajout de la requête courante
    $requests[] = $now;
    
    // Sauvegarde du cache
    file_put_contents($cacheFile, json_encode($requests));
    
    return false; // Requête autorisée
}

/**
 * Log sécurisé d'une action utilisateur
 * 
 * @param string $action Action effectuée
 * @param string $userId ID de l'utilisateur
 * @param array $data Données associées
 * @param string $level Niveau de log
 */
function logUserAction($action, $userId = null, $data = [], $level = 'info') {
    $logEntry = [
        'timestamp' => date('c'),
        'action' => $action,
        'user_id' => $userId,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'data' => removeSensitiveKeys($data, ['password', 'token'])
    ];
    
    $logMessage = '[' . strtoupper($level) . '] ' . toSecureJSON($logEntry, JSON_UNESCAPED_UNICODE);
    
    error_log($logMessage);
    
    // Sauvegarde en base si configuré
    try {
        if (function_exists('executeQuery')) {
            executeQuery(
                "INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_data, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
                [
                    $userId,
                    $action,
                    $data['resource_type'] ?? 'unknown',
                    $data['resource_id'] ?? null,
                    json_encode($data),
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null
                ]
            );
        }
    } catch (Exception $e) {
        error_log("Failed to log to database: " . $e->getMessage());
    }
}

/**
 * Génère un hash sécurisé pour les mots de passe
 * 
 * @param string $password Mot de passe à hasher
 * @return string Hash généré
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_ARGON2ID, [
        'memory_cost' => 65536, // 64MB
        'time_cost' => 4,       // 4 iterations
        'threads' => 3          // 3 threads
    ]);
}

/**
 * Vérifie un mot de passe contre son hash
 * 
 * @param string $password Mot de passe à vérifier
 * @param string $hash Hash de référence
 * @return bool True si le mot de passe correspond
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Génère un token sécurisé
 * 
 * @param int $length Longueur du token
 * @return string Token généré
 */
function generateSecureToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Vérifie la validité d'un token avec protection contre les attaques timing
 * 
 * @param string $token Token à vérifier
 * @param string $expected Token attendu
 * @return bool True si les tokens correspondent
 */
function verifyToken($token, $expected) {
    return hash_equals($expected, $token);
}

?>