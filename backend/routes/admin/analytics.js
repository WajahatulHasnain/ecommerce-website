const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/analyticsController");
const { auth, adminOnly } = require("../../middleware/auth");

router.use(auth, adminOnly);
router.get("/summary", ctrl.summary);

module.exports = router;
