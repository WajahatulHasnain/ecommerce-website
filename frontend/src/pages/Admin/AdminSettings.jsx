import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Ecommerce Store',
    storeDescription: 'Your one-stop shop for amazing products',
    currency: 'USD',
    taxRate: '10',
    shippingFee: '5.99'
  });

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleStoreChange = (e) => {
    setStoreSettings({
      ...storeSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // Handle profile update
    console.log('Profile update:', profileData);
  };

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    // Handle store settings update
    console.log('Store settings update:', storeSettings);
  };

  const tabs = [
    { id: 'profile', name: 'Profile Settings', icon: '👤' },
    { id: 'store', name: 'Store Settings', icon: '🏪' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and store preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Navigation */}
        <div className="lg:w-64">
          <Card className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                />
                <hr className="my-6" />
                <h4 className="font-semibold text-gray-900">Change Password</h4>
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={profileData.currentPassword}
                  onChange={handleProfileChange}
                />
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={profileData.newPassword}
                  onChange={handleProfileChange}
                />
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={handleProfileChange}
                />
                <Button type="submit" className="bg-blue-600 text-white">
                  Save Changes
                </Button>
              </form>
            </Card>
          )}

          {activeTab === 'store' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Store Configuration</h3>
              <form onSubmit={handleStoreSubmit} className="space-y-4">
                <Input
                  label="Store Name"
                  name="storeName"
                  value={storeSettings.storeName}
                  onChange={handleStoreChange}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Description
                  </label>
                  <textarea
                    name="storeDescription"
                    value={storeSettings.storeDescription}
                    onChange={handleStoreChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Currency"
                    name="currency"
                    value={storeSettings.currency}
                    onChange={handleStoreChange}
                    placeholder="USD"
                  />
                  <Input
                    label="Tax Rate (%)"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    value={storeSettings.taxRate}
                    onChange={handleStoreChange}
                  />
                  <Input
                    label="Shipping Fee ($)"
                    name="shippingFee"
                    type="number"
                    step="0.01"
                    value={storeSettings.shippingFee}
                    onChange={handleStoreChange}
                  />
                </div>
                <Button type="submit" className="bg-green-600 text-white">
                  Save Store Settings
                </Button>
              </form>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Button className="bg-blue-600 text-white text-sm">
                    Enable 2FA
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Login Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified of new logins</p>
                  </div>
                  <Button className="bg-green-600 text-white text-sm">
                    Enabled
                  </Button>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Session Management</h4>
                    <p className="text-sm text-gray-600">View active sessions</p>
                  </div>
                  <Button className="bg-gray-600 text-white text-sm">
                    Manage
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { name: 'New Orders', description: 'Get notified when new orders are placed' },
                  { name: 'Low Stock', description: 'Alert when products are low in stock' },
                  { name: 'Customer Reviews', description: 'Notify when customers leave reviews' },
                  { name: 'Sales Reports', description: 'Daily and weekly sales summaries' }
                ].map((notification, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium">{notification.name}</h4>
                      <p className="text-sm text-gray-600">{notification.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
