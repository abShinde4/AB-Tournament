const express = require("express");
const { z } = require("zod");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const {
  getEligibilityHandler,
  getMyLicenseHandler,
  claimLicenseHandler,
  verifyLicenseHandler,
  adminListLicenses,
  adminSearchUsers,
  adminUpdateLicenseHandler,
  adminCreateLicenseHandler,
  adminGetConfig,
  adminUpdateConfig,
} = require("../controllers/gamerLicenseController");

const router = express.Router();

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID");

const adminUpdateSchema = z.object({
  body: z.object({
    status: z.enum(["active", "pending", "disabled", "rejected"]).optional(),
    tier: z.enum(["Bronze", "Silver", "Gold", "Elite"]).optional(),
    imageUrl: z.string().trim().max(500).optional(),
    instagramUrl: z.string().trim().max(500).optional(),
    cdnUrl: z.string().trim().max(500).optional(),
    driveUrl: z.string().trim().max(500).optional(),
    rejectionReason: z.string().trim().max(300).optional(),
    playerName: z.string().trim().max(60).optional(),
    bgmiUid: z.string().trim().max(32).optional(),
  }),
});

const adminCreateSchema = z.object({
  body: z.object({
    userId: objectId,
    tier: z.enum(["Bronze", "Silver", "Gold", "Elite"]).optional(),
  }),
});

const adminConfigSchema = z.object({
  body: z.object({
    foundingMemberLimit: z.number().int().min(1).max(100).optional(),
    foundingRequiredMatches: z.number().int().min(1).max(50).optional(),
    regularRequiredMatches: z.number().int().min(1).max(50).optional(),
    defaultTier: z.enum(["Bronze", "Silver", "Gold", "Elite"]).optional(),
  }),
});

router.get("/verify/:licenseId", verifyLicenseHandler);
router.get("/verify", verifyLicenseHandler);

router.get("/eligibility", protect, getEligibilityHandler);
router.get("/me", protect, getMyLicenseHandler);
router.post("/claim", protect, claimLicenseHandler);

router.get("/admin/list", protect, requireAdmin, adminListLicenses);
router.get("/admin/search-users", protect, requireAdmin, adminSearchUsers);
router.get("/admin/config", protect, requireAdmin, adminGetConfig);
router.patch("/admin/config", protect, requireAdmin, validate(adminConfigSchema), adminUpdateConfig);
router.post("/admin/issue", protect, requireAdmin, validate(adminCreateSchema), adminCreateLicenseHandler);
router.patch("/admin/:id", protect, requireAdmin, validate(adminUpdateSchema), adminUpdateLicenseHandler);

module.exports = router;
