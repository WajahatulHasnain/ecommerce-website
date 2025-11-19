const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/productsController");
const { auth, adminOnly } = require("../../middleware/auth");

router.use(auth, adminOnly);
router.get("/", ctrl.listProducts);
router.put("/:productId/sale", ctrl.updateSale);
router.delete("/:productId/sale", ctrl.removeSale);

module.exports = router;
