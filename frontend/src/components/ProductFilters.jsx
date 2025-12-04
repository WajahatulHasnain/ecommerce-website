import { useState, useRef, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

export default function ProductFilters({ 
  filters, 
  onFiltersChange, 
  onSearchChange,
  searchTerm 
}) {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [tempFilters, setTempFilters] = useState(filters);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  useEffect(() => {
    // Initialize price range from filters
    setPriceRange([
      parseFloat(tempFilters.minPrice) || 0,
      parseFloat(tempFilters.maxPrice) || 0
    ]);
  }, [tempFilters.minPrice, tempFilters.maxPrice]);

  const activeFilterCount = [
    searchTerm && searchTerm.trim(),
    filters.category !== 'all',
    filters.discount !== 'all',
    filters.minPrice && filters.minPrice.trim(),
    filters.maxPrice && filters.maxPrice.trim()
  ].filter(Boolean).length;

  const toggleFilterPanel = () => {
    setShowFilterPanel(!showFilterPanel);
  };

  // Handle filter changes
  const onTempFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative">
      {/* Compact Search Bar with Filter Button */}
      <Card className="p-4 mb-6 bg-white border border-warm-gray-200 shadow-soft">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm || ''}
              onChange={(e) => {
                const newSearchTerm = e.target.value;
                onSearchChange(newSearchTerm);
                // Debounce the search to avoid too many API calls
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(() => {
                  // The search will automatically trigger a new API call via useEffect
                }, 300);
              }}
              className="w-full pl-10 pr-4 py-3 border border-warm-gray-300 rounded-xl focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange bg-white transition-all duration-200"
            />
          </div>
          
          {/* Filter Menu Button */}
          <button
            onClick={toggleFilterPanel}
            className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-2 font-medium ${
              showFilterPanel 
                ? 'border-etsy-orange bg-etsy-orange text-white shadow-lg' 
                : 'border-warm-gray-300 bg-white text-warm-gray-700 hover:border-etsy-orange hover:shadow-md'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </Card>

      {/* Slide-out Filter Panel */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${showFilterPanel ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            showFilterPanel ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setShowFilterPanel(false)}
        />
        
        {/* Filter Panel */}
        <div 
          ref={filterPanelRef}
          className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            showFilterPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="sticky top-0 bg-white border-b border-warm-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-warm-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="p-2 hover:bg-warm-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-warm-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-warm-gray-900 mb-3">Category</label>
              <div className="space-y-2">
                {['all', 'electronics', 'clothing', 'home', 'sports', 'books', 'beauty', 'other'].map((cat) => (
                  <label key={cat} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={tempFilters.category === cat}
                      onChange={(e) => onTempFilterChange('category', e.target.value)}
                      className="w-4 h-4 text-etsy-orange focus:ring-etsy-orange border-warm-gray-300"
                    />
                    <span className="text-warm-gray-700 capitalize">
                      {cat === 'all' ? 'All Categories' : cat}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range - User-friendly Input Fields */}
            <div>
              <label className="block text-sm font-semibold text-warm-gray-900 mb-3">Price Range</label>
              <div className="space-y-3">
                {/* Min Price Input */}
                <div>
                  <label className="block text-xs text-warm-gray-600 mb-1">Minimum Price</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="0"
                    value={priceRange[0] || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setPriceRange([value, priceRange[1]]);
                      const newFilters = { ...tempFilters, minPrice: value.toString() };
                      setTempFilters(newFilters);
                      // Debounce the filter application for price inputs
                      clearTimeout(window.priceFilterTimeout);
                      window.priceFilterTimeout = setTimeout(() => {
                        onFiltersChange(newFilters);
                      }, 500);
                    }}
                    className="w-full px-3 py-2 border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange bg-white text-sm"
                  />
                </div>
                
                {/* Max Price Input */}
                <div>
                  <label className="block text-xs text-warm-gray-600 mb-1">Maximum Price</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="Max price"
                    value={priceRange[1] === 0 ? '' : priceRange[1]}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setPriceRange([priceRange[0], value]);
                      const newFilters = { ...tempFilters, maxPrice: value ? value.toString() : '' };
                      setTempFilters(newFilters);
                      // Debounce the filter application for price inputs
                      clearTimeout(window.priceFilterTimeout);
                      window.priceFilterTimeout = setTimeout(() => {
                        onFiltersChange(newFilters);
                      }, 500);
                    }}
                    className="w-full px-3 py-2 border border-warm-gray-300 rounded-lg focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange bg-white text-sm"
                  />
                </div>
                
                {/* Price Range Display */}
                <div className="px-3 py-2 bg-warm-gray-50 rounded-lg text-center">
                  <span className="text-sm text-warm-gray-700">
                    ${priceRange[0]} - {priceRange[1] === 0 ? 'No max' : '$' + priceRange[1]}
                  </span>
                </div>
              </div>
            </div>

            {/* Deals */}
            <div>
              <label className="block text-sm font-semibold text-warm-gray-900 mb-3">Deals</label>
              <div className="space-y-2">
                {['all', 'discount'].map((deal) => (
                  <label key={deal} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="discount"
                      value={deal}
                      checked={tempFilters.discount === deal}
                      onChange={(e) => {
                        const newFilters = { ...tempFilters, discount: e.target.value };
                        setTempFilters(newFilters);
                        onFiltersChange(newFilters);
                      }}
                      className="w-4 h-4 text-etsy-orange focus:ring-etsy-orange border-warm-gray-300"
                    />
                    <span className="text-warm-gray-700">
                      {deal === 'all' ? 'All Products' : 'On Sale Only'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-warm-gray-900 mb-3">Sort</label>
              <select 
                value={tempFilters.sort || 'newest'}
                onChange={(e) => {
                  const newFilters = { ...tempFilters, sort: e.target.value };
                  setTempFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
                className="w-full px-4 py-3 border border-warm-gray-300 rounded-xl focus:ring-2 focus:ring-etsy-orange focus:border-etsy-orange bg-white"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-warm-gray-200 px-6 py-4 space-y-3">
            <button
              onClick={() => {
                const resetFilters = {
                  category: 'all',
                  minPrice: '',
                  maxPrice: '',
                  discount: 'all'
                };
                setTempFilters(resetFilters);
                setPriceRange([0, 0]);
                onFiltersChange(resetFilters);
                onSearchChange('');
                setShowFilterPanel(false);
              }}
              className="w-full px-6 py-3 bg-warm-gray-200 text-warm-gray-700 rounded-xl hover:bg-warm-gray-300 transition-all duration-200 font-medium"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="w-full px-6 py-3 bg-etsy-orange text-white rounded-xl hover:bg-etsy-orange-dark transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}