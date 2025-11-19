const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/admin/notificationsController");
const { auth, adminOnly } = require("../../middleware/auth");

router.use(auth, adminOnly);
router.get("/", ctrl.list);
router.put("/:id/read", ctrl.markRead);

module.exports = router;
