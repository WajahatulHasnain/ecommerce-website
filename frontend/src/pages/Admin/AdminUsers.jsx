import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, admin, customer
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date()); // ✅ Enhanced: Track last update time

  useEffect(() => {
    fetchUsers();
    
    // ✅ Enhanced: Real-time event listeners
    const handleProfileUpdate = (event) => {
      const updatedUser = event.detail;
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === updatedUser._id || user.id === updatedUser.id
            ? { ...user, ...updatedUser, updatedAt: new Date().toISOString() }
            : user
        )
      );
      setLastUpdated(new Date());
      console.log('✅ Admin received profile update:', updatedUser.email);
    };

    const handlePasswordChange = (event) => {
      const { userId, timestamp, userEmail } = event.detail;
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId || user.id === userId
            ? { ...user, lastPasswordChange: timestamp }
            : user
        )
      );
      setLastUpdated(new Date());
      console.log('✅ Admin received password change for:', userEmail);
    };

    // ✅ Enhanced: Listen for real-time updates
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('passwordChanged', handlePasswordChange);

    // ✅ Enhanced: Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('passwordChanged', handlePasswordChange);
      clearInterval(interval);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.data);
        setLastUpdated(new Date()); // ✅ Enhanced: Update timestamp
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced: Manual refresh function
  const handleRefresh = () => {
    setLoading(true);
    fetchUsers();
  };

  const viewUserProfile = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setSelectedUser(null);
    setShowProfileModal(false);
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  const getRoleBadgeColor = (role) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">
            Manage platform users and their access
            {/* ✅ Enhanced: Show last updated time */}
            <span className="ml-2 text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </p>
        </div>

        {/* ✅ Enhanced: Refresh controls */}
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span className={`${loading ? 'animate-spin' : ''}`}>🔄</span>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* ✅ Enhanced: Real-time indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 text-sm font-medium">
            Real-time updates enabled • Auto-refresh every 30 seconds
          </span>
          <span className="text-green-600 text-xs">
            ({users.length} users loaded)
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        <Button
          onClick={() => setFilter('all')}
          className={`text-sm px-4 py-2 ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({users.length})
        </Button>
        <Button
          onClick={() => setFilter('customer')}
          className={`text-sm px-4 py-2 ${
            filter === 'customer' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Customers ({users.filter(u => u.role === 'customer').length})
        </Button>
        <Button
          onClick={() => setFilter('admin')}
          className={`text-sm px-4 py-2 ${
            filter === 'admin' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Admins ({users.filter(u => u.role === 'admin').length})
        </Button>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user._id} className="p-4 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 flex flex-col">
              {/* User Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{user.name}</h3>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} title={user.isActive ? 'Active' : 'Inactive'}></span>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2 mb-3 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Status:</span>
                  <span className={`text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {user.isActive ? '✓ Active' : '✕ Inactive'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Joined:</span>
                  <span className="text-xs text-gray-700 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {user.lastLogin && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Last Login:</span>
                    <span className="text-xs text-gray-700 whitespace-nowrap">
                      {new Date(user.lastLogin).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Updated:</span>
                  <span className="text-xs text-gray-700 whitespace-nowrap">
                    {new Date(user.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => viewUserProfile(user)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg transition-colors mt-auto"
              >
                👤 View Profile
              </Button>
            </Card>
          ))
        ) : (
          <Card className="col-span-full p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No users registered yet' 
                : `No ${filter}s found`}
            </p>
          </Card>
        )}
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Customer Profile</h2>
                <button
                  onClick={closeProfileModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    👤 Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Full Name:</span>
                      <p className="text-gray-900 font-semibold">{selectedUser.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900 font-semibold">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Role:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedUser.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedUser.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    📅 Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Account Created:</span>
                      <p className="text-gray-900 font-semibold">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                      <p className="text-gray-900 font-semibold">
                        {new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {selectedUser.lastLogin && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Last Login:</span>
                        <p className="text-gray-900 font-semibold">
                          {new Date(selectedUser.lastLogin).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-600">User ID:</span>
                      <p className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {selectedUser._id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {selectedUser.phone && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📞 Contact Information
                    </h3>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <p className="text-gray-900 font-semibold">{selectedUser.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={closeProfileModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
