const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Notification = require("../models/Notification");

// create order (public/simple)
router.post("/", async (req, res) => {
  try {
    const { userId, items, total, address } = req.body;
    const order = new Order({ user: userId, items, total, address });
    await order.save();
    await Notification.create({ message: `New order ${order._id} placed`, type: "order", related: order._id, relatedModel: "Order" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
