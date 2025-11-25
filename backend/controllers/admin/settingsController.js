const Settings = require("../../models/Settings");

// Get store settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Add currency symbol to the response
    const currencySymbol = settings.getCurrencySymbol();
    const responseData = {
      ...settings.toObject(),
      currencySymbol
    };
    
    res.json({ 
      success: true, 
      data: responseData 
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ 
      success: false, 
      msg: "Failed to fetch settings" 
    });
  }
};

// Update store settings
exports.updateSettings = async (req, res) => {
  try {
    const { 
      storeName, 
      storeDescription, 
      currency, 
      taxRate, 
      shippingFee, 
      freeShippingThreshold 
    } = req.body;

    // Validate required fields
    if (!storeName || !currency) {
      return res.status(400).json({ 
        success: false, 
        msg: "Store name and currency are required" 
      });
    }

    // Validate currency code
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'PKR'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ 
        success: false, 
        msg: "Invalid currency code" 
      });
    }

    // Validate numeric fields
    if (taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ 
        success: false, 
        msg: "Tax rate must be between 0 and 100" 
      });
    }

    if (shippingFee < 0 || freeShippingThreshold < 0) {
      return res.status(400).json({ 
        success: false, 
        msg: "Shipping fee and free shipping threshold must be positive" 
      });
    }

    // Get current settings
    let settings = await Settings.getSettings();

    // Get currency symbol for the selected currency
    const currencySymbols = {
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

    // Update settings fields
    settings.storeName = storeName;
    settings.storeDescription = storeDescription;
    settings.currency = {
      code: currency,
      symbol: currencySymbols[currency] || '$',
      rate: settings.exchangeRates[currency] || 1.0
    };
    settings.taxRate = Number(taxRate);
    settings.shippingFee = Number(shippingFee);
    settings.freeShippingThreshold = Number(freeShippingThreshold);

    // Save updated settings
    await settings.save();

    // Return updated settings with currency symbol
    const currencySymbol = settings.getCurrencySymbol();
    const responseData = {
      ...settings.toObject(),
      currencySymbol
    };

    res.json({ 
      success: true, 
      data: responseData,
      msg: "Settings updated successfully"
    });

  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ 
      success: false, 
      msg: "Failed to update settings: " + error.message 
    });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    // Delete existing settings
    await Settings.deleteMany({});
    
    // Create new default settings
    const settings = await Settings.getSettings();
    
    const currencySymbol = settings.getCurrencySymbol();
    const responseData = {
      ...settings.toObject(),
      currencySymbol
    };

    res.json({ 
      success: true, 
      data: responseData,
      msg: "Settings reset to default values"
    });

  } catch (error) {
    console.error('Settings reset error:', error);
    res.status(500).json({ 
      success: false, 
      msg: "Failed to reset settings" 
    });
  }
}; 