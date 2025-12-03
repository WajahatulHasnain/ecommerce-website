import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    storeName: 'Ecommerce Store',
    storeDescription: 'Your online shopping destination',
    currency: { code: 'USD', symbol: '$', rate: 1.0 },
    taxRate: 10,
    shippingFee: 5.99,
    freeShippingThreshold: 50,
    exchangeRates: {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.5,
      PKR: 278.0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/public/settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings(prev => ({
          ...prev,
          ...data,
          currency: data.currency || prev.currency,
          exchangeRates: prev.exchangeRates // Keep default exchange rates
        }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  // Convert price from USD to current currency
  const convertPrice = (usdPrice) => {
    if (!usdPrice || usdPrice === 0) return '0.00';
    const rate = settings.exchangeRates[settings.currency.code] || 1.0;
    return (usdPrice * rate).toFixed(2);
  };

  // Convert price from current currency to USD
  const convertToUSD = (localPrice) => {
    if (!localPrice || localPrice === 0) return 0;
    const rate = settings.exchangeRates[settings.currency.code] || 1.0;
    return (localPrice / rate);
  };

  // Format price with currency symbol
  const formatPrice = (usdPrice) => {
    const convertedPrice = convertPrice(usdPrice);
    return `${settings.currency.symbol}${convertedPrice}`;
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    const symbols = {
      'USD': '$',
      'EUR': '€', 
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹',
      'PKR': '₨'
    };
    return symbols[settings.currency.code] || '$';
  };

  const value = {
    settings,
    setSettings,
    loading,
    convertPrice,
    convertToUSD,
    formatPrice,
    getCurrencySymbol,
    refreshSettings: fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};