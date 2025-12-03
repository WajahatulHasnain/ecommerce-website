import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'electronics',
    stock: '',
    tags: '',
    discount: {
      type: '',
      value: 0,
      maxDiscount: '',
      startDate: '',
      endDate: ''
    },
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('discount.')) {
      const discountField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          [discountField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.price || !formData.stock) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const submitData = new FormData();
      
      // Append basic fields correctly
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('category', formData.category);
      submitData.append('stock', formData.stock);
      submitData.append('tags', formData.tags);
      
      // Handle discount object correctly - only add if discount has valid data
      if (formData.discount && formData.discount.type && formData.discount.value && formData.discount.value > 0) {
        submitData.append('discount', JSON.stringify(formData.discount));
      } else {
        // Explicitly don't send discount if it's empty or invalid
        console.log('No valid discount data, creating product without discount');
      }
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      console.log('Submitting product data:', {
        title: formData.title,
        price: formData.price,
        category: formData.category,
        hasDiscount: !!(formData.discount && formData.discount.type),
        isEdit: !!editingProduct
      });

      let response;
      if (editingProduct) {
        response = await api.put(`/admin/products/${editingProduct._id}`, submitData, config);
      } else {
        response = await api.post('/admin/products', submitData, config);
      }

      if (response.data.success) {
        await fetchProducts();
        resetForm();
        setShowModal(false);
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      } else {
        throw new Error(response.data.msg || 'Save failed');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product: ' + (error.response?.data?.msg || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      tags: product.tags?.join(', ') || '',
      discount: {
        type: product.discount?.type || '',
        value: product.discount?.value || 0,
        maxDiscount: product.discount?.maxDiscount || '',
        startDate: product.discount?.startDate ? new Date(product.discount.startDate).toISOString().split('T')[0] : '',
        endDate: product.discount?.endDate ? new Date(product.discount.endDate).toISOString().split('T')[0] : ''
      }
    });
    // Display existing ImgBB image or fallback
    setImagePreview(product.imageUrl || '');
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      await api.delete(`/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'electronics',
      stock: '',
      tags: '',
      discount: {
        type: '',
        value: 0,
        maxDiscount: '',
        startDate: '',
        endDate: ''
      },
    });
    setImageFile(null);
    setImagePreview('');
    setEditingProduct(null);
  };

  if (loading && products.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <Button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Add New Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
            {/* Full-height product image with gradient overlay */}
            <div className="relative w-full h-80 bg-gray-100 overflow-hidden">
              {product.imageUrl ? (
                <>
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Dark gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Edit Button - Top Right */}
              <button
                onClick={() => handleEdit(product)}
                className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-blue-500/90 text-white hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              
              {/* Delete Button - Top Left */}
              <button
                onClick={() => handleDelete(product._id)}
                className="absolute top-3 left-3 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500/90 hover:border-red-400 transition-all duration-300 group shadow-lg hover:shadow-xl hover:scale-110"
                title="Delete product"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              {/* Discount badge */}
              {product.discount?.type && product.discount.value > 0 && (
                <div className="absolute top-3 right-16 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm">
                  {product.discount.type === 'percentage' 
                    ? `${product.discount.value}% OFF`
                    : `$${product.discount.value} OFF`
                  }
                </div>
              )}
              
              {/* Product Title - Bottom with transparency */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="font-semibold text-white text-base mb-3 line-clamp-2 drop-shadow-lg">
                  {product.title}
                </h3>
                
                {/* Price and Stock Row */}
                <div className="flex items-end justify-between">
                  {/* Price Display */}
                  <div className="flex items-center gap-2">
                    {product.discount?.type && product.discount.value > 0 ? (
                      <>
                        <span className="text-gray-300 text-sm line-through">
                          ${product.price}
                        </span>
                        <span className="text-white text-2xl font-bold drop-shadow-lg">
                          ${product.finalPrice ? product.finalPrice.toFixed(2) : (
                            product.discount.type === 'percentage' 
                              ? (product.price * (1 - product.discount.value / 100)).toFixed(2)
                              : Math.max(0, product.price - product.discount.value).toFixed(2)
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-white text-2xl font-bold drop-shadow-lg">
                        ${product.price}
                      </span>
                    )}
                  </div>
                  
                  {/* Stock Badge */}
                  <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-lg ${
                    product.stock > 10 
                      ? 'bg-green-500/90 text-white'
                      : product.stock > 0 
                      ? 'bg-yellow-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    Stock: {product.stock}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first product</p>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Product
          </Button>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Product Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Price ($)"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    label="Stock Quantity"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="home">Home & Garden</option>
                    <option value="sports">Sports & Fitness</option>
                    <option value="books">Books</option>
                    <option value="beauty">Beauty & Personal Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  label="Tags (comma separated)"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., smartphone, android, mobile"
                />

                {/* Discount Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Type
                      </label>
                      <select
                        name="discount.type"
                        value={formData.discount.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No Discount</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    {formData.discount.type && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label={`Discount ${formData.discount.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}`}
                            name="discount.value"
                            type="number"
                            step={formData.discount.type === 'percentage' ? '1' : '0.01'}
                            min="0"
                            max={formData.discount.type === 'percentage' ? '100' : undefined}
                            value={formData.discount.value}
                            onChange={handleInputChange}
                            placeholder={formData.discount.type === 'percentage' ? 'e.g., 15' : 'e.g., 10.00'}
                          />

                          {formData.discount.type === 'percentage' && (
                            <Input
                              label="Max Discount ($) (Optional)"
                              name="discount.maxDiscount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.discount.maxDiscount}
                              onChange={handleInputChange}
                              placeholder="e.g., 50.00"
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date (Optional)
                            </label>
                            <input
                              type="date"
                              name="discount.startDate"
                              value={formData.discount.startDate}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date (Optional)
                            </label>
                            <input
                              type="date"
                              name="discount.endDate"
                              value={formData.discount.endDate}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {formData.discount.type && formData.discount.value && formData.price && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm font-medium text-blue-800 mb-1">Discount Preview:</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-600">Original Price: ${formData.price}</span>
                              <span className="text-sm font-semibold text-blue-800">
                                Final Price: ${
                                  formData.discount.type === 'percentage' 
                                    ? (formData.price * (1 - formData.discount.value / 100)).toFixed(2)
                                    : Math.max(0, formData.price - formData.discount.value).toFixed(2)
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
