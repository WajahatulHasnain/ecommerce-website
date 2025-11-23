import { useState } from 'react';
import Card from './ui/Card';

export default function ProductFilters({ filters, onFilterChange, onClearAll }) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFilterCount = [
    filters.search,
    filters.category !== 'all',
    filters.discount !== 'all',
    filters.minPrice,
    filters.maxPrice
  ].filter(Boolean).length;

  const FilterInputs = () => (
    <>
      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-warm-gray-700">Category</label>
        <select
          name="category"
          value={filters.category}
          onChange={onFilterChange}
          className="w-full px-4 py-3 border border-warm-gray-300 rounded-xl focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange bg-white transition-all duration-200 hover:shadow-sm"
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="home">Home & Garden</option>
          <option value="sports">Sports & Fitness</option>
          <option value="books">Books</option>
          <option value="beauty">Beauty & Care</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Deals */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-warm-gray-700">Deals</label>
        <select
          name="discount"
          value={filters.discount}
          onChange={onFilterChange}
          className="w-full px-4 py-3 border border-warm-gray-300 rounded-xl focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange bg-white transition-all duration-200 hover:shadow-sm"
        >
          <option value="all">All Products</option>
          <option value="discount">On Sale</option>
        </select>
      </div>

      {/* Min Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-warm-gray-700">Min Price</label>
        <input
          type="number"
          name="minPrice"
          value={filters.minPrice}
          onChange={onFilterChange}
          placeholder="0"
          min="0"
          step="0.01"
          className="w-full px-4 py-3 border border-warm-gray-300 rounded-xl focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange transition-all duration-200 hover:shadow-sm"
        />
      </div>

      {/* Max Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-warm-gray-700">Max Price</label>
        <input
          type="number"
          name="maxPrice"
          value={filters.maxPrice}
          onChange={onFilterChange}
          placeholder="1000"
          min="0"
          step="0.01"
          className="w-full px-4 py-3 border border-warm-gray-300 rounded-xl focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange transition-all duration-200 hover:shadow-sm"
        />
      </div>
    </>
  );

  return (
    <Card className="card-primary p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold text-warm-gray-900 mb-3 sm:mb-4 md:mb-6">
        Search & Filters
      </h3>
      
      {/* Search Bar - Always Visible */}
      <div className="mb-3 sm:mb-4">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={onFilterChange}
            placeholder="Search for products..."
            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg border-2 border-warm-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange transition-all duration-200 bg-white shadow-sm hover:shadow-md"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ target: { name: 'search', value: '' } })}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-warm-gray-400 hover:text-etsy-orange transition-colors"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Filter Button */}
      <div className="md:hidden mb-3 sm:mb-4">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-warm-gray-300 rounded-lg sm:rounded-xl font-medium text-warm-gray-700 hover:border-etsy-orange transition-colors text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-etsy-orange text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: Inline Filters */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <FilterInputs />
      </div>

      {/* Mobile: Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-warm-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-base sm:text-lg font-semibold text-warm-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 sm:p-2 hover:bg-warm-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-warm-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Inputs */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <FilterInputs />
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-warm-gray-200 p-3 sm:p-4 flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  onClearAll();
                  setShowMobileFilters(false);
                }}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-warm-gray-300 rounded-lg sm:rounded-xl font-medium text-warm-gray-700 hover:bg-warm-gray-50 transition-colors text-sm sm:text-base"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-etsy-orange text-white rounded-lg sm:rounded-xl font-medium hover:bg-etsy-orange-dark transition-colors text-sm sm:text-base"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-warm-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 space-y-2 sm:space-y-0">
            <span className="text-xs sm:text-sm font-medium text-warm-gray-700">Active Filters:</span>
            <button
              onClick={onClearAll}
              className="text-xs sm:text-sm text-etsy-orange hover:text-etsy-orange-dark font-medium transition-colors self-start sm:self-auto"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-etsy-orange/10 text-etsy-orange rounded-full text-xs sm:text-sm">
                <span className="hidden sm:inline">Search: "</span><span className="sm:hidden">"</span>{filters.search}<span className="hidden sm:inline">"</span><span className="sm:hidden">"</span>
                <button 
                  onClick={() => onFilterChange({ target: { name: 'search', value: '' } })}
                  className="hover:text-etsy-orange-dark transition-colors p-0.5"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {filters.category !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-sage/10 text-sage-dark rounded-full text-xs sm:text-sm">
                {filters.category}
                <button 
                  onClick={() => onFilterChange({ target: { name: 'category', value: 'all' } })}
                  className="ml-1 hover:text-sage transition-colors p-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {filters.discount !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-dusty-rose/10 text-dusty-rose-dark rounded-full text-xs sm:text-sm">
                On Sale
                <button 
                  onClick={() => onFilterChange({ target: { name: 'discount', value: 'all' } })}
                  className="ml-1 hover:text-dusty-rose transition-colors p-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-lavender/10 text-lavender-dark rounded-full text-xs sm:text-sm">
                ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
                <button 
                  onClick={() => {
                    onFilterChange({ target: { name: 'minPrice', value: '' } });
                    onFilterChange({ target: { name: 'maxPrice', value: '' } });
                  }}
                  className="ml-1 hover:text-lavender transition-colors p-0.5"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}