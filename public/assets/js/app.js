/**
 * SCRIPT PRINCIPAL FATIMA MOBILIÁRIO
 * 
 * Ce fichier contient toute la logique JavaScript commune à toutes les pages :
 * - Navigation responsive
 * - Carrousels et interactions
 * - Animations et effets visuels
 * - Utilitaires généraux
 * - Gestion des erreurs globales
 */

/**
 * VARIABLES GLOBALES
 */

// État de l'application
let isMenuOpen = false;
let currentCarouselIndex = 0;
let carouselIntervals = new Map(); // Pour gérer plusieurs carrousels

// Éléments DOM fréquemment utilisés
let navToggle, navMenu, header;

/**
 * INITIALISATION DE L'APPLICATION
 */

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de l\'application Fatima Mobiliário');
    
    // Initialisation des composants principaux
    initializeNavigation();
    initializeCarousels();
    initializeAnimations();
    initializeUtilities();
    initializeErrorHandling();
    
    console.log('✅ Application initialisée avec succès');
});

/**
 * NAVIGATION RESPONSIVE
 */

/**
 * Initialise la navigation mobile et les interactions du header
 */
function initializeNavigation() {
    // Récupération des éléments DOM
    navToggle = document.querySelector('.nav-toggle');
    navMenu = document.querySelector('.nav');
    header = document.querySelector('.header');
    
    if (!navToggle || !navMenu) {
        console.warn('⚠️ Éléments de navigation non trouvés');
        return;
    }
    
    // Gestionnaire du bouton menu mobile
    navToggle.addEventListener('click', toggleMobileMenu);
    
    // Fermeture du menu lors du clic sur un lien
    const navLinks = navMenu.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) {
                closeMobileMenu();
            }
        });
    });
    
    // Fermeture du menu lors du clic en dehors
    document.addEventListener('click', (event) => {
        if (isMenuOpen && !navToggle.contains(event.target) && !navMenu.contains(event.target)) {
            closeMobileMenu();
        }
    });
    
    // Gestion du scroll pour le header
    initializeHeaderScroll();
    
    console.log('✅ Navigation initialisée');
}

/**
 * Bascule l'état du menu mobile
 */
function toggleMobileMenu() {
    if (isMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Ouvre le menu mobile
 */
function openMobileMenu() {
    isMenuOpen = true;
    navToggle.classList.add('nav-toggle--active');
    navToggle.setAttribute('aria-expanded', 'true');
    navMenu.classList.add('nav--open');
    
    // Empêche le scroll du body
    document.body.style.overflow = 'hidden';
    
    // Animation des liens du menu
    const navLinks = navMenu.querySelectorAll('.nav__link');
    navLinks.forEach((link, index) => {
        link.style.animationDelay = `${index * 0.1}s`;
        link.classList.add('fade-in');
    });
}

/**
 * Ferme le menu mobile
 */
function closeMobileMenu() {
    isMenuOpen = false;
    navToggle.classList.remove('nav-toggle--active');
    navToggle.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('nav--open');
    
    // Réactive le scroll du body
    document.body.style.overflow = 'auto';
    
    // Supprime les classes d'animation
    const navLinks = navMenu.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.classList.remove('fade-in');
        link.style.animationDelay = '';
    });
}

/**
 * Initialise les effets de scroll sur le header
 */
function initializeHeaderScroll() {
    if (!header) return;
    
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    function updateHeaderOnScroll() {
        const currentScrollY = window.scrollY;
        
        // Masquage/affichage du header selon le sens de scroll
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scroll vers le bas - masquer le header
            header.classList.add('header--hidden');
        } else {
            // Scroll vers le haut - afficher le header
            header.classList.remove('header--hidden');
        }
        
        // Ajout d'une ombre au header si scroll > 0
        if (currentScrollY > 0) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }
    
    // Utilisation de requestAnimationFrame pour optimiser les performances
    function requestScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateHeaderOnScroll);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
}

/**
 * CARROUSELS ET GALERIES
 */

/**
 * Initialise tous les carrousels de la page
 */
function initializeCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    
    carousels.forEach((carousel, index) => {
        initializeCarousel(carousel, `carousel-${index}`);
    });
    
    if (carousels.length > 0) {
        console.log(`✅ ${carousels.length} carrousel(s) initialisé(s)`);
    }
}

/**
 * Initialise un carrousel spécifique
 * @param {HTMLElement} carousel - Élément carrousel
 * @param {string} carouselId - ID unique du carrousel
 */
function initializeCarousel(carousel, carouselId) {
    const track = carousel.querySelector('.carousel__track');
    const slides = carousel.querySelectorAll('.carousel__slide');
    const dots = carousel.querySelectorAll('.carousel__dot');
    const prevButton = carousel.querySelector('.carousel__arrow--prev');
    const nextButton = carousel.querySelector('.carousel__arrow--next');
    
    if (!track || slides.length === 0) {
        console.warn('⚠️ Carrousel invalide:', carousel);
        return;
    }
    
    // État du carrousel
    let currentIndex = 0;
    let isTransitioning = false;
    let autoplayInterval = null;
    
    // Configuration du carrousel
    const config = {
        autoplay: carousel.dataset.autoplay === 'true',
        autoplayDelay: parseInt(carousel.dataset.autoplayDelay) || 5000,
        loop: carousel.dataset.loop !== 'false',
        swipe: carousel.dataset.swipe !== 'false'
    };
    
    /**
     * Va à un slide spécifique
     * @param {number} index - Index du slide
     * @param {boolean} animate - Si l'animation doit être appliquée
     */
    function goToSlide(index, animate = true) {
        if (isTransitioning || index === currentIndex) return;
        
        // Validation de l'index
        if (index < 0) {
            index = config.loop ? slides.length - 1 : 0;
        } else if (index >= slides.length) {
            index = config.loop ? 0 : slides.length - 1;
        }
        
        if (!animate) {
            track.style.transition = 'none';
        }
        
        isTransitioning = true;
        currentIndex = index;
        
        // Animation du track
        const translateX = -index * 100;
        track.style.transform = `translateX(${translateX}%)`;
        
        // Mise à jour des points indicateurs
        updateDots();
        
        // Mise à jour des boutons de navigation
        updateNavigationButtons();
        
        // Événement personnalisé
        carousel.dispatchEvent(new CustomEvent('slideChange', {
            detail: { currentIndex, totalSlides: slides.length }
        }));
        
        // Réactivation des transitions après animation
        setTimeout(() => {
            isTransitioning = false;
            if (!animate) {
                track.style.transition = '';
            }
        }, 300);
    }
    
    /**
     * Met à jour les points indicateurs
     */
    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('carousel__dot--active', index === currentIndex);
        });
    }
    
    /**
     * Met à jour les boutons de navigation
     */
    function updateNavigationButtons() {
        if (!config.loop) {
            if (prevButton) {
                prevButton.disabled = currentIndex === 0;
            }
            if (nextButton) {
                nextButton.disabled = currentIndex === slides.length - 1;
            }
        }
    }
    
    /**
     * Démarre l'autoplay
     */
    function startAutoplay() {
        if (!config.autoplay) return;
        
        stopAutoplay(); // Arrêt de l'éventuel autoplay précédent
        
        autoplayInterval = setInterval(() => {
            const nextIndex = currentIndex + 1;
            goToSlide(nextIndex);
        }, config.autoplayDelay);
    }
    
    /**
     * Arrête l'autoplay
     */
    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }
    
    // Gestionnaires d'événements
    
    // Navigation par flèches
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
            stopAutoplay(); // Arrêt de l'autoplay lors d'interaction manuelle
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
            stopAutoplay();
        });
    }
    
    // Navigation par points
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            stopAutoplay();
        });
    });
    
    // Navigation au clavier
    carousel.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                goToSlide(currentIndex - 1);
                stopAutoplay();
                break;
            case 'ArrowRight':
                event.preventDefault();
                goToSlide(currentIndex + 1);
                stopAutoplay();
                break;
            case 'Home':
                event.preventDefault();
                goToSlide(0);
                stopAutoplay();
                break;
            case 'End':
                event.preventDefault();
                goToSlide(slides.length - 1);
                stopAutoplay();
                break;
        }
    });
    
    // Support tactile (swipe) sur mobile
    if (config.swipe) {
        initializeSwipeSupport(carousel, goToSlide, () => stopAutoplay());
    }
    
    // Pause/reprise de l'autoplay au survol
    if (config.autoplay) {
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
        
        // Pause lors de la perte de focus de la page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoplay();
            } else if (config.autoplay) {
                startAutoplay();
            }
        });
    }
    
    // Initialisation
    goToSlide(0, false);
    updateNavigationButtons();
    
    if (config.autoplay) {
        startAutoplay();
    }
    
    // Stockage de l'instance pour nettoyage ultérieur
    carouselIntervals.set(carouselId, {
        element: carousel,
        stop: stopAutoplay,
        goToSlide: goToSlide
    });
}

/**
 * Initialise le support tactile pour un carrousel
 * @param {HTMLElement} carousel - Élément carrousel
 * @param {Function} goToSlide - Fonction de navigation
 * @param {Function} onInteraction - Callback d'interaction
 */
function initializeSwipeSupport(carousel, goToSlide, onInteraction) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    // Début du toucher
    carousel.addEventListener('touchstart', (event) => {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
    
    // Fin du toucher
    carousel.addEventListener('touchend', (event) => {
        if (!isDragging) return;
        
        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Vérification que c'est un swipe horizontal (pas vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            onInteraction();
            
            if (deltaX > 0) {
                // Swipe vers la droite - slide précédent
                goToSlide(getCurrentIndex() - 1);
            } else {
                // Swipe vers la gauche - slide suivant
                goToSlide(getCurrentIndex() + 1);
            }
        }
        
        isDragging = false;
    }, { passive: true });
    
    // Fonction helper pour obtenir l'index actuel (simplifiée)
    function getCurrentIndex() {
        const track = carousel.querySelector('.carousel__track');
        const transform = track.style.transform;
        const match = transform.match(/translateX\((-?\d+)%\)/);
        return match ? Math.abs(parseInt(match[1]) / 100) : 0;
    }
}

/**
 * ANIMATIONS ET EFFETS VISUELS
 */

/**
 * Initialise les animations au scroll et autres effets
 */
function initializeAnimations() {
    // Intersection Observer pour les animations d'entrée
    initializeScrollAnimations();
    
    // Effets de parallaxe légers
    initializeParallaxEffects();
    
    // Animations de hover sur les cartes
    initializeHoverEffects();
    
    console.log('✅ Animations initialisées');
}

/**
 * Initialise les animations déclenchées par le scroll
 */
function initializeScrollAnimations() {
    // Configuration de l'observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    // Callback pour les éléments qui entrent dans le viewport
    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Ajout de la classe d'animation avec un délai
                setTimeout(() => {
                    element.classList.add('animate-in');
                }, getAnimationDelay(element));
                
                // Arrêt de l'observation pour cet élément
                observer.unobserve(element);
            }
        });
    };
    
    // Création de l'observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observation de tous les éléments avec des classes d'animation
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    /**
     * Calcule le délai d'animation basé sur l'attribut data-delay
     * @param {HTMLElement} element - Élément à animer
     * @returns {number} Délai en millisecondes
     */
    function getAnimationDelay(element) {
        const delay = element.dataset.animationDelay;
        return delay ? parseInt(delay) : 0;
    }
}

/**
 * Initialise les effets de parallaxe légers
 */
function initializeParallaxEffects() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;
    
    let ticking = false;
    
    function updateParallax() {
        const scrollY = window.scrollY;
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
        
        ticking = false;
    }
    
    function requestParallaxUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
}

/**
 * Initialise les effets de hover sur les éléments interactifs
 */
function initializeHoverEffects() {
    // Effet de tilt léger sur les cartes
    const cards = document.querySelectorAll('.card, .product-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
    
    // Effet de ripple sur les boutons
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', createRippleEffect);
    });
}

/**
 * Crée un effet de ripple sur un élément
 * @param {Event} event - Événement de clic
 */
function createRippleEffect(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    
    // Calcul de la position et de la taille du ripple
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    // Style du ripple
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
    `;
    
    // Ajout du ripple au bouton
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    // Suppression du ripple après l'animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * UTILITAIRES GÉNÉRAUX
 */

/**
 * Initialise les utilitaires et fonctions helper
 */
function initializeUtilities() {
    // Lazy loading des images
    initializeLazyLoading();
    
    // Amélioration de l'accessibilité
    initializeAccessibilityEnhancements();
    
    // Optimisations de performance
    initializePerformanceOptimizations();
    
    console.log('✅ Utilitaires initialisés');
}

/**
 * Initialise le lazy loading des images
 */
function initializeLazyLoading() {
    // Vérification du support natif du lazy loading
    if ('loading' in HTMLImageElement.prototype) {
        // Support natif - ajout de l'attribut loading="lazy" aux images
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
        });
    } else {
        // Fallback avec Intersection Observer
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

/**
 * Améliore l'accessibilité de l'application
 */
function initializeAccessibilityEnhancements() {
    // Ajout de skip links pour la navigation au clavier
    addSkipLinks();
    
    // Amélioration du focus visible
    enhanceFocusVisibility();
    
    // Gestion des régions live pour les lecteurs d'écran
    initializeLiveRegions();
}

/**
 * Ajoute des liens de navigation rapide pour l'accessibilité
 */
function addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Aller au contenu principal</a>
        <a href="#navigation" class="skip-link">Aller à la navigation</a>
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
}

/**
 * Améliore la visibilité du focus pour la navigation au clavier
 */
function enhanceFocusVisibility() {
    // Détection de la navigation au clavier
    let isUsingKeyboard = false;
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            isUsingKeyboard = true;
            document.body.classList.add('using-keyboard');
        }
    });
    
    document.addEventListener('mousedown', () => {
        isUsingKeyboard = false;
        document.body.classList.remove('using-keyboard');
    });
}

/**
 * Initialise les régions live pour les annonces aux lecteurs d'écran
 */
function initializeLiveRegions() {
    // Création d'une région live pour les annonces
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    
    document.body.appendChild(liveRegion);
    
    // Fonction globale pour annoncer des messages
    window.announceToScreenReader = function(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Nettoyage après annonce
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    };
}

/**
 * Initialise les optimisations de performance
 */
function initializePerformanceOptimizations() {
    // Préchargement des ressources critiques
    preloadCriticalResources();
    
    // Optimisation des événements de scroll et resize
    optimizeScrollEvents();
    
    // Nettoyage automatique des event listeners
    setupAutomaticCleanup();
}

/**
 * Précharge les ressources critiques
 */
function preloadCriticalResources() {
    // Préchargement des polices critiques
    const criticalFonts = [
        'https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap'
    ];
    
    criticalFonts.forEach(fontUrl => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = fontUrl;
        document.head.appendChild(link);
    });
}

/**
 * Optimise les événements de scroll pour de meilleures performances
 */
function optimizeScrollEvents() {
    // Throttling des événements de scroll
    let scrollTimeout;
    
    const optimizedScrollHandler = () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            // Logique de scroll optimisée
            document.dispatchEvent(new CustomEvent('optimizedScroll', {
                detail: { scrollY: window.scrollY }
            }));
        }, 16); // ~60fps
    };
    
    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
}

/**
 * Configure le nettoyage automatique des ressources
 */
function setupAutomaticCleanup() {
    // Nettoyage lors de la fermeture de la page
    window.addEventListener('beforeunload', () => {
        // Arrêt de tous les carrousels
        carouselIntervals.forEach(carousel => {
            carousel.stop();
        });
        
        // Nettoyage des observers
        if (window.intersectionObservers) {
            window.intersectionObservers.forEach(observer => observer.disconnect());
        }
    });
}

/**
 * GESTION D'ERREURS GLOBALE
 */

/**
 * Initialise la gestion d'erreurs globale
 */
function initializeErrorHandling() {
    // Gestion des erreurs JavaScript non capturées
    window.addEventListener('error', handleGlobalError);
    
    // Gestion des promesses rejetées
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Configuration du reporting d'erreurs (si service externe)
    setupErrorReporting();
    
    console.log('✅ Gestion d\'erreurs initialisée');
}

/**
 * Gère les erreurs JavaScript globales
 * @param {ErrorEvent} event - Événement d'erreur
 */
function handleGlobalError(event) {
    console.error('❌ Erreur JavaScript:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
    });
    
    // Affichage d'un message utilisateur si erreur critique
    if (isCriticalError(event.error)) {
        showUserErrorMessage('Une erreur inattendue s\'est produite. Veuillez recharger la page.');
    }
}

/**
 * Gère les promesses rejetées non capturées
 * @param {PromiseRejectionEvent} event - Événement de rejet
 */
function handleUnhandledRejection(event) {
    console.error('❌ Promesse rejetée:', event.reason);
    
    // Évite l'affichage de l'erreur dans la console du navigateur
    event.preventDefault();
    
    // Gestion spécifique selon le type d'erreur
    if (event.reason && event.reason.code) {
        // Erreur Firebase ou API
        const userMessage = window.FirebaseUtils ? 
            window.FirebaseUtils.handleFirebaseError(event.reason) :
            'Erreur de connexion. Veuillez vérifier votre connexion internet.';
        
        showUserErrorMessage(userMessage);
    }
}

/**
 * Détermine si une erreur est critique
 * @param {Error} error - Erreur à évaluer
 * @returns {boolean} True si l'erreur est critique
 */
function isCriticalError(error) {
    if (!error) return false;
    
    const criticalPatterns = [
        /Cannot read property/,
        /is not a function/,
        /Script error/,
        /Network Error/
    ];
    
    return criticalPatterns.some(pattern => pattern.test(error.message));
}

/**
 * Affiche un message d'erreur à l'utilisateur
 * @param {string} message - Message à afficher
 */
function showUserErrorMessage(message) {
    // Création d'une notification d'erreur
    const errorNotification = document.createElement('div');
    errorNotification.className = 'error-notification';
    errorNotification.innerHTML = `
        <div class="error-notification__content">
            <svg class="error-notification__icon" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span class="error-notification__message">${message}</span>
            <button class="error-notification__close" type="button" aria-label="Fermer">&times;</button>
        </div>
    `;
    
    // Ajout au DOM
    document.body.appendChild(errorNotification);
    
    // Gestion de la fermeture
    const closeButton = errorNotification.querySelector('.error-notification__close');
    closeButton.addEventListener('click', () => {
        errorNotification.remove();
    });
    
    // Auto-suppression après 10 secondes
    setTimeout(() => {
        if (errorNotification.parentNode) {
            errorNotification.remove();
        }
    }, 10000);
    
    // Animation d'entrée
    setTimeout(() => {
        errorNotification.classList.add('error-notification--visible');
    }, 100);
}

/**
 * Configure le reporting d'erreurs vers un service externe
 */
function setupErrorReporting() {
    // Configuration pour un service comme Sentry, LogRocket, etc.
    // À implémenter selon le service choisi
    
    // Exemple basique de logging local
    window.logError = function(error, context = {}) {
        const errorData = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('📊 Error logged:', errorData);
        
        // Ici, vous pourriez envoyer les données à votre service de monitoring
        // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });
    };
}

/**
 * FONCTIONS UTILITAIRES EXPORTÉES
 */

// Export des fonctions utilitaires pour utilisation dans d'autres scripts
window.FatimaUtils = {
    // Navigation
    toggleMobileMenu,
    closeMobileMenu,
    
    // Carrousels
    initializeCarousel,
    
    // Animations
    createRippleEffect,
    
    // Notifications
    showUserErrorMessage,
    announceToScreenReader: () => window.announceToScreenReader,
    
    // Utilitaires
    formatPrice: (price) => window.FirebaseUtils ? window.FirebaseUtils.formatPrice(price) : price,
    formatDate: (date) => window.FirebaseUtils ? window.FirebaseUtils.formatDate(date) : date
};

// Log de fin d'initialisation
console.log('🎯 App.js chargé et prêt à l\'utilisation');