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
    
    // Update order status
    order.status = status;
    
    // Update payment status based on order status
    if (status === 'delivered') {
      order.paymentStatus = 'completed';
    } else if (status === 'cancelled') {
      order.paymentStatus = 'cancelled';
    } else if (['pending', 'processing', 'shipped'].includes(status)) {
      order.paymentStatus = 'pending';
    }
    
    await order.save();
    
    // Create notification
    const notificationMessage = status === 'cancelled' 
      ? `Order ${order._id} has been cancelled by admin`
      : status === 'processing'
      ? `Order ${order._id} has been approved and is being processed`
      : `Order ${order._id} marked ${status}`;
      
    await Notification.create({ 
      message: notificationMessage, 
      type: "order", 
      related: order._id, 
      relatedModel: "Order" 
    });
    
    res.json({ success: true, data: order, msg: `Order status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
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
