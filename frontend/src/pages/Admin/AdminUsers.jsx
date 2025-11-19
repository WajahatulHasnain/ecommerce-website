import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, admin, customer

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.put(`/admin/users/${userId}/status`, 
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setUsers(users.map(user => 
          user._id === userId ? { ...user, isActive: !isActive } : user
        ));
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
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
          <p className="text-gray-600">Manage platform users and their access</p>
        </div>

        {/* Filter */}
        <div className="flex space-x-2 mt-4 sm:mt-0">
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
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <div>Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                {user.lastLogin && (
                  <div>Last Login: {new Date(user.lastLogin).toLocaleDateString()}</div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => toggleUserStatus(user._id, user.isActive)}
                  className={`text-sm px-3 py-1 ${
                    user.isActive 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button className="bg-blue-600 text-white text-sm px-3 py-1">
                  View Profile
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No users found</p>
            <p className="text-gray-400 mt-2">
              {filter === 'all' 
                ? 'No users registered yet' 
                : `No ${filter}s found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
