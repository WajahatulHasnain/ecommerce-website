const Order = require("../../models/Order");
const Notification = require("../../models/Notification");

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("user", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) return res.status(404).json({ msg: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    order.status = status;
    await order.save();
    await Notification.create({ message: `Order ${order._id} marked ${status}`, type: "order", related: order._id, relatedModel: "Order" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    res.json({ msg: "Order deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
