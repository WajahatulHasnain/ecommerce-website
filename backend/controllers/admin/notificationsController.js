const Notification = require("../../models/Notification");

exports.list = async (req, res) => {
  try {
    const notes = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(n);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
