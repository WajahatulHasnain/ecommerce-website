// Test file to validate the new filter system
import { useState } from 'react';

export default function TestFilters() {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    discount: 'all'
  });

  const [tempFilters, setTempFilters] = useState({
    search: '',
    category: 'all', 
    minPrice: '',
    maxPrice: '',
    discount: 'all'
  });

  const handleTempFilterChange = (name, value) => {
    console.log(`Temp filter changed: ${name} = ${value}`);
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', tempFilters);
    setFilters(tempFilters);
  };

  const handleClearAll = () => {
    const cleared = {
      search: '',
      category: 'all',
      minPrice: '',
      maxPrice: '',
      discount: 'all'
    };
    setFilters(cleared);
    setTempFilters(cleared);
  };

  return (
    <div className="p-6">
      <h1>Filter System Test</h1>
      
      <div className="mb-4">
        <h2>Current Applied Filters:</h2>
        <pre>{JSON.stringify(filters, null, 2)}</pre>
      </div>

      <div className="mb-4">
        <h2>Temporary Filters (user editing):</h2>
        <pre>{JSON.stringify(tempFilters, null, 2)}</pre>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search"
          value={tempFilters.search}
          onChange={(e) => handleTempFilterChange('search', e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Min Price"
          value={tempFilters.minPrice}
          onChange={(e) => handleTempFilterChange('minPrice', e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Max Price"
          value={tempFilters.maxPrice}
          onChange={(e) => handleTempFilterChange('maxPrice', e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={handleApplyFilters}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Apply Filters
        </button>

        <button
          onClick={handleClearAll}
          className="bg-red-500 text-white p-2 rounded"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}