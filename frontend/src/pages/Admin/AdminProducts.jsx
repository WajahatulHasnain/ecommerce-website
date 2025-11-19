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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.map(product => (
          <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative w-full h-40 bg-gray-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Stock badge */}
              <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                product.stock > 10 ? 'bg-green-500 text-white' :
                product.stock > 0 ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {product.stock}
              </span>
              
              {/* Discount badge */}
              {product.discount?.type && product.discount.value > 0 && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  {product.discount.type === 'percentage' 
                    ? `${product.discount.value}%`
                    : `$${product.discount.value}`
                  }
                </div>
              )}
            </div>
            
            <div className="p-3">
              <h3 className="font-medium text-gray-900 mb-2 text-sm truncate">{product.title}</h3>
              
              {/* Price in white background */}
              <div className="bg-gray-800 rounded-md p-2 mb-3">
                {product.discount?.type && product.discount.value > 0 ? (
                  <div className="text-center">
                    <div className="text-xs text-gray-300 line-through relative">
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-400 font-bold">×</span>
                      ${product.price}
                    </div>
                    <div className="text-lg font-bold text-white">
                      ${product.finalPrice ? product.finalPrice.toFixed(2) : (
                        product.discount.type === 'percentage' 
                          ? (product.price * (1 - product.discount.value / 100)).toFixed(2)
                          : Math.max(0, product.price - product.discount.value).toFixed(2)
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-bold text-white text-center">${product.price}</div>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-yellow-500 text-white hover:bg-yellow-600 text-xs py-2"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 bg-red-500 text-white hover:bg-red-600 text-xs py-2"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
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
