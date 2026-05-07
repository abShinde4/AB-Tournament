const express = require("express");
const { listResults, publishResults, myRecentResults } = require("../controllers/resultController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const { resultsPublishSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", listResults);
router.get("/me/recent", protect, myRecentResults);
router.post("/", protect, requireAdmin, validate(resultsPublishSchema), publishResults);

module.exports = router;
