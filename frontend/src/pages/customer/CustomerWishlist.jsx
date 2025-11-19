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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              {/* Full-height product image with gradient overlay */}
              <div className="relative w-full h-80 bg-gray-100 overflow-hidden">
                {item.productId.imageUrl ? (
                  <>
                    <img
                      src={item.productId.imageUrl}
                      alt={item.productId.title}
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
                
                {/* Remove from Wishlist Button - Top Right - Always Visible */}
                <button
                  onClick={() => removeFromWishlist(item.productId._id)}
                  className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-red-500/90 text-white hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 z-20"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Discount badge - Top Left */}
                {item.productId.discount?.type && item.productId.discount.value > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg backdrop-blur-sm">
                    {item.productId.discount.type === 'percentage' 
                      ? `${item.productId.discount.value}% OFF`
                      : `$${item.productId.discount.value} OFF`
                    }
                  </div>
                )}
                
                {/* Product Title - Bottom with transparency */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-semibold text-white text-base mb-3 line-clamp-2 drop-shadow-lg">
                    {item.productId.title}
                  </h3>
                  
                  {/* Price and Stock Row */}
                  <div className="flex items-end justify-between">
                    {/* Price Display */}
                    <div className="flex items-center gap-2">
                      {item.productId.discount?.type && item.productId.discount?.value > 0 && item.productId.finalPrice < item.productId.price ? (
                        <>
                          <span className="text-gray-300 text-sm line-through">
                            ${item.productId.price}
                          </span>
                          <span className="text-white text-2xl font-bold drop-shadow-lg">
                            ${item.productId.finalPrice}
                          </span>
                        </>
                      ) : (
                        <span className="text-white text-2xl font-bold drop-shadow-lg">
                          ${item.productId.price}
                        </span>
                      )}
                    </div>
                    
                    {/* Stock Badge */}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md ${
                      item.productId.stock > 0 
                        ? 'bg-green-500/90 text-white' 
                        : 'bg-red-500/90 text-white'
                    } shadow-lg`}>
                      {item.productId.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                
                {/* Add to Cart Button - Appears on hover - Lower z-index */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm z-10">
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.productId.stock === 0}
                    className="bg-orange-500 text-white hover:bg-orange-600 text-sm py-3 px-8 rounded-lg font-semibold transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                  >
                    {item.productId.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
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
