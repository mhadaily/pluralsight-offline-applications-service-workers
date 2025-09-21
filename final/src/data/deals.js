/**
 * Deals Service
 * Handles travel deals data with caching and offline support
 */

import apiClient from './api-client.js';

class DealsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastFetch = null;
  }

  /**
   * Get all travel deals
   * @param {Object} options - Query options
   * @param {boolean} options.forceRefresh - Force refresh from server
   * @param {string} options.category - Filter by category
   * @param {number} options.maxPrice - Maximum price filter
   * @param {string} options.sortBy - Sort order (price, popularity, date)
   */
  async getDeals(options = {}) {
    const {
      forceRefresh = false,
      category,
      maxPrice,
      sortBy = 'popularity',
    } = options;

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh && this.isCacheValid()) {
        console.log('[Deals] 💾 Returning cached deals');
        return this.applyFilters(this.cache.get('deals'), {
          category,
          maxPrice,
          sortBy,
        });
      }

      // Fetch from server
      console.log('[Deals] 🌐 Fetching deals from server');
      const deals = await apiClient.get('/deals');

      // Transform and enhance deals data
      const enhancedDeals = deals.map((deal) => ({
        ...deal,
        // Add computed properties
        discountPercentage: deal.originalPrice
          ? Math.round((1 - deal.price / deal.originalPrice) * 100)
          : 0,
        isPopular: deal.bookings > 100,
        isNew:
          Date.now() - new Date(deal.createdAt).getTime() <
          7 * 24 * 60 * 60 * 1000, // 7 days
        // Ensure required fields
        id: deal.id || Date.now(),
        title: deal.title || 'Untitled Deal',
        price: deal.price || 0,
        description: deal.description || '',
        imageUrl: deal.imageUrl || '/fallback-image.png',
        category: deal.category || 'other',
        rating: deal.rating || 0,
        reviewCount: deal.reviewCount || 0,
        bookings: deal.bookings || 0,
        createdAt: deal.createdAt || new Date().toISOString(),
      }));

      // Cache the results
      this.cache.set('deals', enhancedDeals);
      this.lastFetch = Date.now();

      console.log(`[Deals] ✅ Fetched ${enhancedDeals.length} deals`);
      return this.applyFilters(enhancedDeals, { category, maxPrice, sortBy });
    } catch (error) {
      console.error('[Deals] ❌ Failed to fetch deals:', error);

      // Fallback to cache if available
      if (this.cache.has('deals')) {
        console.log('[Deals] 📴 Using cached deals as fallback');
        return this.applyFilters(this.cache.get('deals'), {
          category,
          maxPrice,
          sortBy,
        });
      }

      // Return mock data as last resort
      console.log('[Deals] 🎭 Using mock deals as fallback');
      return this.getMockDeals();
    }
  }

  /**
   * Get deal by ID
   * @param {number|string} id - Deal ID
   */
  async getDeal(id) {
    try {
      const deal = await apiClient.get(`/deals/${id}`);
      console.log(`[Deals] ✅ Fetched deal ${id}`);
      return deal;
    } catch (error) {
      console.error(`[Deals] ❌ Failed to fetch deal ${id}:`, error);

      // Check cache
      const cachedDeals = this.cache.get('deals');
      if (cachedDeals) {
        const deal = cachedDeals.find((d) => d.id == id);
        if (deal) {
          console.log(`[Deals] 💾 Found deal ${id} in cache`);
          return deal;
        }
      }

      throw error;
    }
  }

  /**
   * Search deals
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async searchDeals(query, options = {}) {
    const deals = await this.getDeals(options);

    if (!query || query.trim() === '') {
      return deals;
    }

    const searchTerm = query.toLowerCase().trim();

    return deals.filter((deal) => {
      return (
        deal.title.toLowerCase().includes(searchTerm) ||
        deal.description.toLowerCase().includes(searchTerm) ||
        deal.category.toLowerCase().includes(searchTerm) ||
        (deal.destination &&
          deal.destination.toLowerCase().includes(searchTerm))
      );
    });
  }

  /**
   * Get deals by category
   * @param {string} category - Category name
   */
  async getDealsByCategory(category) {
    return this.getDeals({ category });
  }

  /**
   * Get popular deals
   * @param {number} limit - Maximum number of deals
   */
  async getPopularDeals(limit = 10) {
    const deals = await this.getDeals({ sortBy: 'popularity' });
    return deals.filter((deal) => deal.isPopular).slice(0, limit);
  }

  /**
   * Get new deals
   * @param {number} limit - Maximum number of deals
   */
  async getNewDeals(limit = 10) {
    const deals = await this.getDeals({ sortBy: 'date' });
    return deals.filter((deal) => deal.isNew).slice(0, limit);
  }

  /**
   * Book a deal (placeholder for future implementation)
   * @param {number|string} dealId - Deal ID
   * @param {Object} bookingData - Booking information
   */
  async bookDeal(dealId, bookingData) {
    try {
      const booking = await apiClient.post(
        `/deals/${dealId}/book`,
        bookingData
      );
      console.log(`[Deals] ✅ Booked deal ${dealId}`);
      return booking;
    } catch (error) {
      console.error(`[Deals] ❌ Failed to book deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Get deal categories
   */
  async getCategories() {
    try {
      return await apiClient.get('/deals/categories');
    } catch (error) {
      // Return default categories
      return [
        { id: 'beach', name: 'Beach', icon: '🏖️' },
        { id: 'mountain', name: 'Mountain', icon: '🏔️' },
        { id: 'city', name: 'City', icon: '🏛️' },
        { id: 'adventure', name: 'Adventure', icon: '🎢' },
        { id: 'culture', name: 'Culture', icon: '🎭' },
        { id: 'food', name: 'Food & Wine', icon: '🍷' },
      ];
    }
  }

  /**
   * Apply filters and sorting to deals
   * @param {Array} deals - Deals array
   * @param {Object} filters - Filter options
   */
  applyFilters(deals, { category, maxPrice, sortBy = 'popularity' } = {}) {
    let filteredDeals = [...deals];

    // Apply category filter
    if (category && category !== 'all') {
      filteredDeals = filteredDeals.filter(
        (deal) => deal.category === category
      );
    }

    // Apply price filter
    if (maxPrice && maxPrice > 0) {
      filteredDeals = filteredDeals.filter((deal) => deal.price <= maxPrice);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filteredDeals.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filteredDeals.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        filteredDeals.sort((a, b) => b.bookings - a.bookings);
        break;
      case 'rating':
        filteredDeals.sort((a, b) => b.rating - a.rating);
        break;
      case 'date':
      case 'recent':
        filteredDeals.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
      // Keep original order
    }

    return filteredDeals;
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    return (
      this.cache.has('deals') &&
      this.lastFetch &&
      Date.now() - this.lastFetch < this.cacheExpiry
    );
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.lastFetch = null;
    console.log('[Deals] 🧹 Cache cleared');
  }

  /**
   * Get mock deals for offline use
   */
  getMockDeals() {
    return [
      {
        id: 1,
        title: 'Weekend in Rome',
        description:
          'Experience the eternal city with our amazing weekend package including flights, hotel, and guided tours.',
        price: 299,
        originalPrice: 399,
        discountPercentage: 25,
        category: 'city',
        destination: 'Rome, Italy',
        imageUrl: '/fallback-image.png',
        rating: 4.8,
        reviewCount: 142,
        bookings: 1250,
        isPopular: true,
        isNew: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        title: 'Bali Beach Retreat',
        description:
          'Relax on pristine beaches with our 5-day Bali package. Includes luxury resort accommodation and spa treatments.',
        price: 599,
        originalPrice: 799,
        discountPercentage: 25,
        category: 'beach',
        destination: 'Bali, Indonesia',
        imageUrl: '/fallback-image.png',
        rating: 4.9,
        reviewCount: 89,
        bookings: 856,
        isPopular: true,
        isNew: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        title: 'Swiss Alps Adventure',
        description:
          'Hiking and skiing in the beautiful Swiss Alps. Perfect for adventure seekers and nature lovers.',
        price: 899,
        originalPrice: 1199,
        discountPercentage: 25,
        category: 'mountain',
        destination: 'Swiss Alps, Switzerland',
        imageUrl: '/fallback-image.png',
        rating: 4.7,
        reviewCount: 203,
        bookings: 432,
        isPopular: false,
        isNew: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      hasCachedDeals: this.cache.has('deals'),
      cachedDealsCount: this.cache.has('deals')
        ? this.cache.get('deals').length
        : 0,
      lastFetch: this.lastFetch,
      cacheAge: this.lastFetch ? Date.now() - this.lastFetch : null,
      cacheValid: this.isCacheValid(),
    };
  }
}

// Create singleton instance
const dealsService = new DealsService();

export { DealsService };
export default dealsService;
