const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/ordersController");
const { auth, adminOnly } = require("../../middleware/auth");

router.use(auth, adminOnly);
router.get("/", ctrl.listOrders);
router.get("/:id", ctrl.getOrder);
router.put("/:id/status", ctrl.updateStatus);
router.delete("/:id", ctrl.deleteOrder);

module.exports = router;
