import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function CustomerWishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/customer/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWishlistItems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/customer/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWishlistItems(prev => prev.filter(item => item.productId._id !== productId));
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      alert('Failed to remove item from wishlist');
    }
  };

  const addToCart = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/customer/cart/${item.productId._id}`, 
        { quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(`${item.productId.title} added to cart!`);
        // Optionally remove from wishlist after adding to cart
        // await removeFromWishlist(item.productId._id);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      if (error.response?.data?.msg) {
        alert(`Failed to add to cart: ${error.response.data.msg}`);
      } else {
        alert('Failed to add to cart. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-gray-600">{wishlistItems.length} items saved for later</p>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-200">
                {item.productId.imageUrl ? (
                  <img
                    src={item.productId.imageUrl}
                    alt={item.productId.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{item.productId.title}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{item.productId.description}</p>
                <p className="text-xs text-gray-400 mb-2">{item.productId.category}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-green-600">${item.productId.price}</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    item.productId.stock > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.productId.stock > 0 ? `${item.productId.stock} in stock` : 'Out of Stock'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => addToCart(item)}
                    className="flex-1 bg-blue-600 text-white text-sm py-2 hover:bg-blue-700"
                    disabled={item.productId.stock === 0}
                  >
                    {item.productId.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  <Button
                    onClick={() => removeFromWishlist(item.productId._id)}
                    className="bg-red-100 text-red-600 hover:bg-red-200 text-sm py-2 px-3"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-600 mb-6">Save items you love for easy shopping later</p>
          <Button
            onClick={() => navigate('/customer/products')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Browse Products
          </Button>
        </Card>
      )}
    </div>
  );
}
