const express = require("express");
const { listNotifications, markAsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, listNotifications);
router.patch("/:notificationId/read", protect, markAsRead);

module.exports = router;
