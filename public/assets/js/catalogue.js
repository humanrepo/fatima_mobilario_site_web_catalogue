/**
 * SCRIPT CATALOGUE FATIMA MOBILIÁRIO
 * 
 * Ce fichier gère toute la logique spécifique à la page catalogue :
 * - Chargement et affichage des produits
 * - Filtrage et recherche
 * - Pagination
 * - Tri des résultats
 * - Gestion de l'état des filtres
 */

/**
 * VARIABLES GLOBALES DU CATALOGUE
 */

// État du catalogue
let catalogueState = {
    products: [],           // Tous les produits chargés
    filteredProducts: [],   // Produits après filtrage
    currentPage: 1,         // Page actuelle
    productsPerPage: 12,    // Nombre de produits par page
    totalProducts: 0,       // Total des produits filtrés
    isLoading: false,       // État de chargement
    filters: {              // Filtres actifs
        search: '',
        category: '',
        priceMin: null,
        priceMax: null,
        status: '',
        sort: 'name-asc'
    }
};

// Éléments DOM du catalogue
let catalogueElements = {};

// Debounce timer pour la recherche
let searchDebounceTimer = null;

/**
 * INITIALISATION DU CATALOGUE
 */

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛍️ Initialisation du catalogue');
    
    // Initialisation des éléments et événements
    initializeCatalogueElements();
    initializeCatalogueEvents();
    
    // Chargement initial des produits
    loadCatalogueProducts();
    
    console.log('✅ Catalogue initialisé');
});

/**
 * Initialise les références aux éléments DOM du catalogue
 */
function initializeCatalogueElements() {
    catalogueElements = {
        // Conteneurs principaux
        productsContainer: document.getElementById('products-container'),
        loadingIndicator: document.getElementById('loading-indicator'),
        errorMessage: document.getElementById('error-message'),
        noResults: document.getElementById('no-results'),
        resultsCount: document.getElementById('results-count'),
        
        // Filtres et recherche
        searchInput: document.getElementById('search-input'),
        searchButton: document.querySelector('.search-bar__button'),
        categoryFilter: document.getElementById('category-filter'),
        priceFilter: document.getElementById('price-filter'),
        statusFilter: document.getElementById('status-filter'),
        sortFilter: document.getElementById('sort-filter'),
        resetFiltersButton: document.getElementById('reset-filters'),
        clearSearchButton: document.getElementById('clear-search'),
        
        // Pagination
        paginationContainer: document.getElementById('pagination-container'),
        paginationPages: document.getElementById('pagination-pages'),
        prevPageButton: document.getElementById('prev-page'),
        nextPageButton: document.getElementById('next-page'),
        
        // Boutons d'action
        retryButton: document.getElementById('retry-button')
    };
    
    // Vérification des éléments critiques
    const criticalElements = [
        'productsContainer', 'loadingIndicator', 'searchInput'
    ];
    
    criticalElements.forEach(elementKey => {
        if (!catalogueElements[elementKey]) {
            console.error(`❌ Élément critique manquant: ${elementKey}`);
        }
    });
}

/**
 * Initialise les événements du catalogue
 */
function initializeCatalogueEvents() {
    // Recherche
    if (catalogueElements.searchInput) {
        catalogueElements.searchInput.addEventListener('input', handleSearchInput);
        catalogueElements.searchInput.addEventListener('keypress', handleSearchKeypress);
    }
    
    if (catalogueElements.searchButton) {
        catalogueElements.searchButton.addEventListener('click', handleSearchClick);
    }
    
    // Filtres
    if (catalogueElements.categoryFilter) {
        catalogueElements.categoryFilter.addEventListener('change', handleFilterChange);
    }
    
    if (catalogueElements.priceFilter) {
        catalogueElements.priceFilter.addEventListener('change', handleFilterChange);
    }
    
    if (catalogueElements.statusFilter) {
        catalogueElements.statusFilter.addEventListener('change', handleFilterChange);
    }
    
    if (catalogueElements.sortFilter) {
        catalogueElements.sortFilter.addEventListener('change', handleSortChange);
    }
    
    // Boutons d'action
    if (catalogueElements.resetFiltersButton) {
        catalogueElements.resetFiltersButton.addEventListener('click', resetAllFilters);
    }
    
    if (catalogueElements.clearSearchButton) {
        catalogueElements.clearSearchButton.addEventListener('click', clearSearch);
    }
    
    if (catalogueElements.retryButton) {
        catalogueElements.retryButton.addEventListener('click', reloadCatalogue);
    }
    
    // Pagination
    if (catalogueElements.prevPageButton) {
        catalogueElements.prevPageButton.addEventListener('click', () => goToPage(catalogueState.currentPage - 1));
    }
    
    if (catalogueElements.nextPageButton) {
        catalogueElements.nextPageButton.addEventListener('click', () => goToPage(catalogueState.currentPage + 1));
    }
}

/**
 * CHARGEMENT DES PRODUITS
 */

/**
 * Charge les produits depuis Firebase
 */
async function loadCatalogueProducts() {
    try {
        showLoading();
        catalogueState.isLoading = true;
        
        // Vérification de Firebase
        if (!window.FirebaseUtils || !window.FirebaseUtils.isFirebaseReady()) {
            throw new Error('Firebase n\'est pas disponible');
        }
        
        // Chargement des produits (tous les produits publiés)
        const result = await window.FirebaseUtils.getProducts(
            { status: 'published' },
            { limit: 100, offset: 0 } // Chargement de tous les produits côté client pour filtrage
        );
        
        catalogueState.products = result.products;
        
        // Application des filtres et affichage
        applyFiltersAndDisplay();
        
        hideLoading();
        
        console.log(`✅ ${catalogueState.products.length} produits chargés`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des produits:', error);
        showError();
    } finally {
        catalogueState.isLoading = false;
    }
}

/**
 * Recharge le catalogue
 */
function reloadCatalogue() {
    loadCatalogueProducts();
}

/**
 * FILTRAGE ET RECHERCHE
 */

/**
 * Gère la saisie dans le champ de recherche avec debounce
 * @param {Event} event - Événement input
 */
function handleSearchInput(event) {
    const searchTerm = event.target.value.trim();
    
    // Debounce pour éviter trop d'appels
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }
    
    searchDebounceTimer = setTimeout(() => {
        catalogueState.filters.search = searchTerm;
        catalogueState.currentPage = 1; // Reset de la pagination
        applyFiltersAndDisplay();
    }, 300);
}

/**
 * Gère l'appui sur Entrée dans le champ de recherche
 * @param {KeyboardEvent} event - Événement keypress
 */
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        // Annulation du debounce et recherche immédiate
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        handleSearchClick();
    }
}

/**
 * Gère le clic sur le bouton de recherche
 */
function handleSearchClick() {
    const searchTerm = catalogueElements.searchInput.value.trim();
    catalogueState.filters.search = searchTerm;
    catalogueState.currentPage = 1;
    applyFiltersAndDisplay();
}

/**
 * Gère les changements de filtres
 * @param {Event} event - Événement change
 */
function handleFilterChange(event) {
    const filterType = event.target.id.replace('-filter', '');
    const filterValue = event.target.value;
    
    // Mise à jour du filtre selon le type
    switch (filterType) {
        case 'category':
            catalogueState.filters.category = filterValue;
            break;
            
        case 'price':
            // Parsing de la valeur prix (ex: "500-1000" ou "5000+")
            if (filterValue) {
                const priceParts = filterValue.split('-');
                if (priceParts.length === 2) {
                    catalogueState.filters.priceMin = parseInt(priceParts[0]);
                    catalogueState.filters.priceMax = parseInt(priceParts[1]);
                } else if (filterValue.endsWith('+')) {
                    catalogueState.filters.priceMin = parseInt(filterValue.replace('+', ''));
                    catalogueState.filters.priceMax = null;
                }
            } else {
                catalogueState.filters.priceMin = null;
                catalogueState.filters.priceMax = null;
            }
            break;
            
        case 'status':
            catalogueState.filters.status = filterValue;
            break;
    }
    
    // Reset de la pagination et application des filtres
    catalogueState.currentPage = 1;
    applyFiltersAndDisplay();
}

/**
 * Gère les changements de tri
 * @param {Event} event - Événement change
 */
function handleSortChange(event) {
    catalogueState.filters.sort = event.target.value;
    applyFiltersAndDisplay();
}

/**
 * Remet à zéro tous les filtres
 */
function resetAllFilters() {
    // Reset des valeurs des filtres
    catalogueState.filters = {
        search: '',
        category: '',
        priceMin: null,
        priceMax: null,
        status: '',
        sort: 'name-asc'
    };
    
    // Reset des champs du formulaire
    if (catalogueElements.searchInput) catalogueElements.searchInput.value = '';
    if (catalogueElements.categoryFilter) catalogueElements.categoryFilter.value = '';
    if (catalogueElements.priceFilter) catalogueElements.priceFilter.value = '';
    if (catalogueElements.statusFilter) catalogueElements.statusFilter.value = '';
    if (catalogueElements.sortFilter) catalogueElements.sortFilter.value = 'name-asc';
    
    // Reset de la pagination
    catalogueState.currentPage = 1;
    
    // Application des filtres
    applyFiltersAndDisplay();
    
    // Annonce pour les lecteurs d'écran
    if (window.announceToScreenReader) {
        window.announceToScreenReader('Filtres réinitialisés');
    }
}

/**
 * Efface la recherche
 */
function clearSearch() {
    catalogueState.filters.search = '';
    if (catalogueElements.searchInput) {
        catalogueElements.searchInput.value = '';
    }
    catalogueState.currentPage = 1;
    applyFiltersAndDisplay();
}

/**
 * Applique les filtres et affiche les résultats
 */
function applyFiltersAndDisplay() {
    // Filtrage des produits
    catalogueState.filteredProducts = filterProducts(catalogueState.products, catalogueState.filters);
    
    // Tri des produits
    sortProducts(catalogueState.filteredProducts, catalogueState.filters.sort);
    
    // Mise à jour du compteur
    catalogueState.totalProducts = catalogueState.filteredProducts.length;
    updateResultsCount();
    
    // Affichage des produits de la page courante
    displayCurrentPageProducts();
    
    // Mise à jour de la pagination
    updatePagination();
    
    // Gestion de l'affichage selon les résultats
    if (catalogueState.totalProducts === 0) {
        showNoResults();
    } else {
        showResults();
    }
}

/**
 * Filtre les produits selon les critères
 * @param {Array} products - Liste des produits
 * @param {Object} filters - Filtres à appliquer
 * @returns {Array} Produits filtrés
 */
function filterProducts(products, filters) {
    return products.filter(product => {
        // Filtre par recherche (nom et code)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(searchTerm);
            const matchesCode = product.code.toLowerCase().includes(searchTerm);
            
            if (!matchesName && !matchesCode) {
                return false;
            }
        }
        
        // Filtre par catégorie
        if (filters.category && product.category !== filters.category) {
            return false;
        }
        
        // Filtre par prix
        if (filters.priceMin !== null && product.price < filters.priceMin) {
            return false;
        }
        
        if (filters.priceMax !== null && product.price > filters.priceMax) {
            return false;
        }
        
        // Filtre par statut
        if (filters.status && product.status !== filters.status) {
            return false;
        }
        
        return true;
    });
}

/**
 * Trie les produits selon le critère
 * @param {Array} products - Produits à trier
 * @param {string} sortBy - Critère de tri
 */
function sortProducts(products, sortBy) {
    products.sort((a, b) => {
        switch (sortBy) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'price-asc':
                return (a.price || 0) - (b.price || 0);
            case 'price-desc':
                return (b.price || 0) - (a.price || 0);
            case 'date-desc':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'date-asc':
                return new Date(a.created_at) - new Date(b.created_at);
            default:
                return 0;
        }
    });
}

/**
 * AFFICHAGE DES PRODUITS
 */

/**
 * Affiche les produits de la page courante
 */
function displayCurrentPageProducts() {
    if (!catalogueElements.productsContainer) return;
    
    // Calcul des indices de pagination
    const startIndex = (catalogueState.currentPage - 1) * catalogueState.productsPerPage;
    const endIndex = startIndex + catalogueState.productsPerPage;
    
    // Produits à afficher pour cette page
    const productsToDisplay = catalogueState.filteredProducts.slice(startIndex, endIndex);
    
    // Génération du HTML des produits
    const productsHTML = productsToDisplay.map(product => generateProductHTML(product)).join('');
    
    // Insertion dans le DOM
    catalogueElements.productsContainer.innerHTML = productsHTML;
    
    // Animation d'entrée des cartes
    const productCards = catalogueElements.productsContainer.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

/**
 * Génère le HTML d'une carte produit
 * @param {Object} product - Données du produit
 * @returns {string} HTML de la carte
 */
function generateProductHTML(product) {
    // Image principale (première image ou image par défaut)
    const mainImage = product.images && product.images.length > 0 
        ? product.images[0].url 
        : '/assets/images/default-product.jpg';
    
    // Alt text pour l'image
    const imageAlt = product.images && product.images.length > 0 && product.images[0].alt
        ? product.images[0].alt
        : product.name;
    
    // Formatage du prix
    const formattedPrice = window.FirebaseUtils 
        ? window.FirebaseUtils.formatPrice(product.price)
        : (product.price ? `${product.price}€` : 'Prix sur demande');
    
    // Texte du statut
    const statusText = getStatusText(product.status);
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-card__image-container">
                <img src="${mainImage}" 
                     alt="${imageAlt}" 
                     class="product-card__image" 
                     loading="lazy"
                     onerror="this.src='/assets/images/default-product.jpg'">
                <span class="product-card__status product-card__status--${product.status}">
                    ${statusText}
                </span>
            </div>
            <div class="product-card__content">
                <h3 class="product-card__name">${escapeHtml(product.name)}</h3>
                <p class="product-card__code">Code: ${escapeHtml(product.code)}</p>
                <p class="product-card__price">${formattedPrice}</p>
                <a href="/produit.html?id=${product.id}" class="btn btn--primary btn--sm">
                    Voir Détails
                </a>
            </div>
        </div>
    `;
}

/**
 * Retourne le texte du statut en français
 * @param {string} status - Statut du produit
 * @returns {string} Texte du statut
 */
function getStatusText(status) {
    const statusTexts = {
        'published': 'Disponible',
        'draft': 'Brouillon',
        'out_of_stock': 'Rupture de stock'
    };
    return statusTexts[status] || status;
}

/**
 * Échappe les caractères HTML dangereux
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * PAGINATION
 */

/**
 * Met à jour l'affichage de la pagination
 */
function updatePagination() {
    if (!catalogueElements.paginationContainer) return;
    
    const totalPages = Math.ceil(catalogueState.totalProducts / catalogueState.productsPerPage);
    
    // Masquage de la pagination si pas nécessaire
    if (totalPages <= 1) {
        catalogueElements.paginationContainer.style.display = 'none';
        return;
    }
    
    // Affichage de la pagination
    catalogueElements.paginationContainer.style.display = 'block';
    
    // Mise à jour des boutons précédent/suivant
    updatePaginationButtons(totalPages);
    
    // Génération des numéros de page
    generatePageNumbers(totalPages);
}

/**
 * Met à jour les boutons précédent/suivant
 * @param {number} totalPages - Nombre total de pages
 */
function updatePaginationButtons(totalPages) {
    if (catalogueElements.prevPageButton) {
        catalogueElements.prevPageButton.disabled = catalogueState.currentPage <= 1;
    }
    
    if (catalogueElements.nextPageButton) {
        catalogueElements.nextPageButton.disabled = catalogueState.currentPage >= totalPages;
    }
}

/**
 * Génère les numéros de page
 * @param {number} totalPages - Nombre total de pages
 */
function generatePageNumbers(totalPages) {
    if (!catalogueElements.paginationPages) return;
    
    const currentPage = catalogueState.currentPage;
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustement si on est près de la fin
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    let pagesHTML = '';
    
    // Première page si pas visible
    if (startPage > 1) {
        pagesHTML += `<button class="pagination__number" data-page="1">1</button>`;
        if (startPage > 2) {
            pagesHTML += `<span class="pagination__ellipsis">...</span>`;
        }
    }
    
    // Pages visibles
    for (let page = startPage; page <= endPage; page++) {
        const isActive = page === currentPage;
        pagesHTML += `
            <button class="pagination__number ${isActive ? 'pagination__number--active' : ''}" 
                    data-page="${page}" 
                    ${isActive ? 'aria-current="page"' : ''}>
                ${page}
            </button>
        `;
    }
    
    // Dernière page si pas visible
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagesHTML += `<span class="pagination__ellipsis">...</span>`;
        }
        pagesHTML += `<button class="pagination__number" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    catalogueElements.paginationPages.innerHTML = pagesHTML;
    
    // Ajout des événements sur les boutons de page
    const pageButtons = catalogueElements.paginationPages.querySelectorAll('.pagination__number');
    pageButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const page = parseInt(event.target.dataset.page);
            goToPage(page);
        });
    });
}

/**
 * Navigue vers une page spécifique
 * @param {number} page - Numéro de la page
 */
function goToPage(page) {
    const totalPages = Math.ceil(catalogueState.totalProducts / catalogueState.productsPerPage);
    
    // Validation de la page
    if (page < 1 || page > totalPages || page === catalogueState.currentPage) {
        return;
    }
    
    catalogueState.currentPage = page;
    
    // Affichage des produits de la nouvelle page
    displayCurrentPageProducts();
    
    // Mise à jour de la pagination
    updatePagination();
    
    // Scroll vers le haut des résultats
    if (catalogueElements.productsContainer) {
        catalogueElements.productsContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    // Annonce pour les lecteurs d'écran
    if (window.announceToScreenReader) {
        window.announceToScreenReader(`Page ${page} sur ${totalPages} affichée`);
    }
}

/**
 * GESTION DE L'AFFICHAGE
 */

/**
 * Affiche l'indicateur de chargement
 */
function showLoading() {
    if (catalogueElements.loadingIndicator) {
        catalogueElements.loadingIndicator.style.display = 'flex';
    }
    
    hideError();
    hideNoResults();
    hideResults();
}

/**
 * Masque l'indicateur de chargement
 */
function hideLoading() {
    if (catalogueElements.loadingIndicator) {
        catalogueElements.loadingIndicator.style.display = 'none';
    }
}

/**
 * Affiche le message d'erreur
 */
function showError() {
    if (catalogueElements.errorMessage) {
        catalogueElements.errorMessage.style.display = 'block';
    }
    
    hideLoading();
    hideNoResults();
    hideResults();
}

/**
 * Masque le message d'erreur
 */
function hideError() {
    if (catalogueElements.errorMessage) {
        catalogueElements.errorMessage.style.display = 'none';
    }
}

/**
 * Affiche le message "aucun résultat"
 */
function showNoResults() {
    if (catalogueElements.noResults) {
        catalogueElements.noResults.style.display = 'block';
    }
    
    hideLoading();
    hideError();
    hideResults();
    
    // Masquage de la pagination
    if (catalogueElements.paginationContainer) {
        catalogueElements.paginationContainer.style.display = 'none';
    }
}

/**
 * Masque le message "aucun résultat"
 */
function hideNoResults() {
    if (catalogueElements.noResults) {
        catalogueElements.noResults.style.display = 'none';
    }
}

/**
 * Affiche les résultats
 */
function showResults() {
    hideLoading();
    hideError();
    hideNoResults();
}

/**
 * Masque les résultats
 */
function hideResults() {
    if (catalogueElements.productsContainer) {
        catalogueElements.productsContainer.innerHTML = '';
    }
}

/**
 * Met à jour le compteur de résultats
 */
function updateResultsCount() {
    if (!catalogueElements.resultsCount) return;
    
    const count = catalogueState.totalProducts;
    const text = count === 0 ? 'Aucun produit trouvé' :
                 count === 1 ? '1 produit trouvé' :
                 `${count} produits trouvés`;
    
    catalogueElements.resultsCount.textContent = text;
}

/**
 * FONCTIONS UTILITAIRES EXPORTÉES
 */

// Export des fonctions pour utilisation externe
window.CatalogueUtils = {
    // État
    getState: () => ({ ...catalogueState }),
    
    // Actions
    reloadCatalogue,
    resetAllFilters,
    clearSearch,
    goToPage,
    
    // Filtres
    applyFiltersAndDisplay,
    
    // Utilitaires
    getStatusText,
    escapeHtml
};

// Log de fin d'initialisation
console.log('🛍️ Catalogue.js chargé et prêt à l\'utilisation');