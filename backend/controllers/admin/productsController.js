const Product = require("../../models/Product");
const Notification = require("../../models/Notification");
const mongoose = require("mongoose");

// helper to check DB ready state
const isDBConnected = () => mongoose.connection.readyState === 1;

// List products — return 503 if DB disconnected
exports.listProducts = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    console.log("Admin requested product list", { adminId: req.admin ? req.admin._id : null, dbState });

    if (!isDBConnected()) {
      return res.status(503).json({ msg: "Database is not connected. Please try again later." });
    }

    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update sale flags — check DB before operations
exports.updateSale = async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ msg: "Database is not connected. Please try again later." });
    }

    const { productId } = req.params;
    const { onSale, saleStart, saleEnd, discountPercent } = req.body;
    console.log("Admin updateSale", { productId, onSale, discountPercent });

    const p = await Product.findById(productId);
    if (!p) return res.status(404).json({ msg: "Product not found" });

    p.onSale = !!onSale;
    p.saleStart = saleStart || null;
    p.saleEnd = saleEnd || null;
    p.discountPercent = discountPercent || 0;
    await p.save();

    if (p.onSale) {
      await Notification.create({ message: `Product "${p.name}" is on sale (${p.discountPercent}%)`, type: "sale", related: p._id, relatedModel: "Product" });
    }
    res.json(p);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Remove sale — check DB before operations
exports.removeSale = async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ msg: "Database is not connected. Please try again later." });
    }

    console.log("Admin removeSale", { productId: req.params.productId });
    const p = await Product.findById(req.params.productId);
    if (!p) return res.status(404).json({ msg: "Product not found" });

    p.onSale = false;
    p.saleStart = null;
    p.saleEnd = null;
    p.discountPercent = 0;
    await p.save();
    res.json(p);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
