const express = require("express");
const { listNotifications, markAsRead, sendNotification } = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const { sendNotificationSchema } = require("../validation/schemas");

const router = express.Router();

router.post("/send", protect, requireAdmin, validate(sendNotificationSchema), sendNotification);
router.get("/", protect, listNotifications);
router.patch("/:notificationId/read", protect, markAsRead);

module.exports = router;
