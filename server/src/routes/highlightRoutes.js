const express = require("express");
const {
  listHighlights,
  getMatchHighlights,
  createUpdateHighlight,
  getHighlight,
  deleteHighlight,
  getUserHighlights,
} = require("../controllers/highlightController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const {
  createUpdateHighlightSchema,
  highlightIdParamSchema,
  matchIdParamSchema,
  userIdParamSchema,
} = require("../validation/schemas");

const router = express.Router();

// Public routes
router.get("/", listHighlights);
router.get("/match/:matchId", validate(matchIdParamSchema), getMatchHighlights);
router.get("/user/:userId", validate(userIdParamSchema), getUserHighlights);
router.get("/:highlightId", validate(highlightIdParamSchema), getHighlight);

// Admin routes
router.post(
  "/",
  protect,
  requireAdmin,
  validate(createUpdateHighlightSchema),
  createUpdateHighlight
);
router.delete(
  "/:highlightId",
  protect,
  requireAdmin,
  validate(highlightIdParamSchema),
  deleteHighlight
);

module.exports = router;
