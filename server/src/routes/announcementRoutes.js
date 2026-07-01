const express = require("express");
const { z } = require("zod");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const {
  listActiveAnnouncements,
  createAnnouncement,
  listAllAnnouncements,
  deactivateAnnouncement,
} = require("../controllers/announcementController");

const router = express.Router();

const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(120),
    message: z.string().trim().min(2).max(2000),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(["normal", "important", "urgent"]).optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    imageUrl: z.string().trim().max(500).optional(),
    buttonText: z.string().trim().max(40).optional(),
    buttonLink: z.string().trim().max(500).optional(),
  }),
});

router.get("/active", listActiveAnnouncements);
router.get("/", protect, requireAdmin, listAllAnnouncements);
router.post("/", protect, requireAdmin, validate(createAnnouncementSchema), createAnnouncement);
router.patch("/:id/deactivate", protect, requireAdmin, deactivateAnnouncement);

module.exports = router;
