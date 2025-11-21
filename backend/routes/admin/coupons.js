const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/couponsController");
const { auth, adminOnly } = require("../../middleware/auth");

router.use(auth, adminOnly);
router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update); // NEW: Edit coupon route
router.put("/:id/toggle", ctrl.toggleStatus);
router.delete("/:id", ctrl.delete);
router.get("/validate/:code", ctrl.validate);

module.exports = router;
