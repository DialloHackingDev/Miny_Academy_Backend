/**
 * 📄 Pagination Helper
 * Utilitaires pour la pagination des résultats
 */

// ✅ Calculer pagination info (page, limit, skip)
const calculatePagination = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 par page
    const skip = (pageNum - 1) * limitNum;

    return {
        page: pageNum,
        limit: limitNum,
        skip
    };
};

// ✅ Formater les résultats avec metadata
const formatPaginatedResponse = (data, totalCount, page, limit) => {
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
        data,
        pagination: {
            currentPage: page,
            totalItems: totalCount,
            totalPages,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
};

// ✅ Middleware pour extraire et valider query params
const extractPaginationParams = (req) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    
    return calculatePagination(page, limit);
};

module.exports = {
    calculatePagination,
    formatPaginatedResponse,
    extractPaginationParams
};
