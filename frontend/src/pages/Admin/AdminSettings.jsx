import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../utils/api';

export default function AdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    storeDescription: '',
    currency: 'USD',
    taxRate: 10,
    shippingFee: 5.99,
    freeShippingThreshold: 50
  });

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const settings = response.data.data;
        setStoreSettings({
          storeName: settings.storeName || '',
          storeDescription: settings.storeDescription || '',
          currency: settings.currency?.code || 'USD',
          taxRate: settings.taxRate || 10,
          shippingFee: settings.shippingFee || 5.99,
          freeShippingThreshold: settings.freeShippingThreshold || 50
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreSettings({
      ...storeSettings,
      [name]: name === 'taxRate' || name === 'shippingFee' || name === 'freeShippingThreshold' 
        ? parseFloat(value) || 0 
        : value
    });
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.put('/admin/settings', storeSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Store settings updated successfully! Currency changes will update all product prices.');
        // Optionally refresh the page to see currency changes
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">🏪 Store Configuration</h1>
        <p className="text-orange-100">Configure your store settings, currency, and pricing</p>
      </div>

      {/* Store Settings Form */}
      <Card className="p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Store Settings</h3>
          <p className="text-gray-600">Configure your store's basic information and financial settings</p>
        </div>
        
        <form onSubmit={handleStoreSubmit} className="space-y-6">
          {/* Store Information Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🏷️ Store Information
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Store Name"
                name="storeName"
                value={storeSettings.storeName}
                onChange={handleStoreChange}
                placeholder="Enter your store name"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Description
                </label>
                <textarea
                  name="storeDescription"
                  value={storeSettings.storeDescription}
                  onChange={handleStoreChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your store..."
                />
              </div>
            </div>
          </div>

          {/* Currency & Financial Settings Section */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              💰 Currency & Financial Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={storeSettings.currency}
                  onChange={handleStoreChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  {currencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Changing currency will update all product prices
                </p>
              </div>
              
              <Input
                label="Tax Rate (%)"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={storeSettings.taxRate}
                onChange={handleStoreChange}
                placeholder="10.00"
              />
              
              <Input
                label="Shipping Fee"
                name="shippingFee"
                type="number"
                step="0.01"
                min="0"
                value={storeSettings.shippingFee}
                onChange={handleStoreChange}
                placeholder="5.99"
              />
              
              <Input
                label="Free Shipping Threshold"
                name="freeShippingThreshold"
                type="number"
                step="0.01"
                min="0"
                value={storeSettings.freeShippingThreshold}
                onChange={handleStoreChange}
                placeholder="50.00"
              />
            </div>
          </div>

          {/* Current Settings Preview */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              👁️ Current Settings Preview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Store Name:</span>
                  <span className="font-semibold">{storeSettings.storeName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-semibold">
                    {currencies.find(c => c.code === storeSettings.currency)?.symbol} {storeSettings.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Rate:</span>
                  <span className="font-semibold">{storeSettings.taxRate}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Fee:</span>
                  <span className="font-semibold">
                    {currencies.find(c => c.code === storeSettings.currency)?.symbol}{storeSettings.shippingFee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Free Shipping Over:</span>
                  <span className="font-semibold">
                    {currencies.find(c => c.code === storeSettings.currency)?.symbol}{storeSettings.freeShippingThreshold}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Settings...
                </>
              ) : (
                <>
                  💾 Save Store Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
