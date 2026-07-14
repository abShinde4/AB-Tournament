const { z } = require("zod");

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID");

const upiIdRegex = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9._-]{2,64}$/;

const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|m\.youtube\.com|youtu\.be)\/(watch\?v=[\w-]{11}|shorts\/[\w-]{11}|embed\/[\w-]{11}|[\w-]{11})(\S*)?$/i;
const instagramReelUrlRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?(\S*)?$/i;

const nonEmptyUrl = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}, z.string().trim().url());

const phoneNumberSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return value.replace(/\D/g, "").slice(-10);
  }
  return value;
}, z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid phone number."));

const optionalGameUid = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
}, z.string().trim().max(20).optional());

const registerSchema = z.object({
  body: z
    .object({
      username: z.string().trim().min(3).max(24),
      email: z.string().email().transform((value) => value.toLowerCase()),
      phoneNumber: phoneNumberSchema,
      password: z.string().min(6).max(64),
      confirmPassword: z.string().min(6).max(64),
      bgmiUid: optionalGameUid,
      freeFireUid: optionalGameUid,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z
    .object({
      username: z.string().trim().min(3).max(24).optional(),
      email: z.string().email().transform((value) => value.toLowerCase()).optional(),
      phoneNumber: phoneNumberSchema.optional(),
      password: z.string().min(6).max(64),
    })
    .superRefine((data, ctx) => {
      if (!data.username && !data.email && !data.phoneNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["username"],
          message: "Enter username, email, or phone number.",
        });
      }
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const createMatchSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(80),
    game: z.enum(["Free Fire", "BGMI"]),
    entryFee: z.number().min(0).max(10000).default(20),
    prizePool: z.number().min(1).max(500000),
    startTime: z.string().datetime(),
    status: z.enum(["Upcoming", "Live", "Completed"]).optional(),
    matchType: z.enum(["Solo", "Duo", "Squad", "TDM", "Arena", "Custom"]).optional(),
    map: z.enum(["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa", "Random"]).optional(),
    perspective: z.enum(["TPP", "FPP"]).optional(),
    maxPlayers: z.number().int().min(2).max(500).default(100),
    roomId: z.string().trim().max(60).optional(),
    roomPassword: z.string().trim().max(60).optional(),
    description: z.string().trim().max(5000).optional(),
    bannerImage: z.string().trim().max(500).optional(),
    rules: z.string().trim().max(5000).optional(),
    requirements: z.string().trim().max(5000).optional(),
    discordLink: z.string().trim().max(300).optional(),
    youtubeLink: z.string().trim().max(300).optional(),
    instagramLink: z.string().trim().max(300).optional(),
    roomNotes: z.string().trim().max(2000).optional(),
    prizeDetails: z.string().trim().max(5000).optional(),
    thumbnailImage: z.string().trim().max(500).optional(),
    whatsappLink: z.string().trim().max(300).optional(),
    streamLink: z.string().trim().max(300).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateMatchSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(80).optional(),
    game: z.enum(["Free Fire", "BGMI"]).optional(),
    entryFee: z.number().min(0).max(10000).optional(),
    prizePool: z.number().min(1).max(500000).optional(),
    startTime: z.string().datetime().optional(),
    status: z.enum(["Upcoming", "Live", "Completed"]).optional(),
    maxPlayers: z.number().int().min(2).max(500).optional(),
    matchType: z.enum(["Solo", "Duo", "Squad", "TDM", "Arena", "Custom"]).optional(),
    map: z.enum(["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa", "Random"]).optional(),
    perspective: z.enum(["TPP", "FPP"]).optional(),
    roomId: z.string().trim().max(60).optional(),
    roomPassword: z.string().trim().max(60).optional(),
    isRoomVisible: z.boolean().optional(),
    description: z.string().trim().max(5000).optional(),
    bannerImage: z.string().trim().max(500).optional(),
    rules: z.string().trim().max(5000).optional(),
    requirements: z.string().trim().max(5000).optional(),
    discordLink: z.string().trim().max(300).optional(),
    youtubeLink: z.string().trim().max(300).optional(),
    instagramLink: z.string().trim().max(300).optional(),
    roomNotes: z.string().trim().max(2000).optional(),
    prizeDetails: z.string().trim().max(5000).optional(),
    thumbnailImage: z.string().trim().max(500).optional(),
    whatsappLink: z.string().trim().max(300).optional(),
    streamLink: z.string().trim().max(300).optional(),
  }),
  params: z.object({ matchId: objectId }),
  query: z.object({}).optional(),
});

const idParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ matchId: objectId }),
  query: z.object({}).optional(),
});

const resultsPublishSchema = z.object({
  body: z.object({
    matchId: objectId,
    winners: z
      .array(
        z.object({
          userId: objectId,
          rank: z.number().int().min(1).max(100),
          score: z.number().min(0).max(10000).optional(),
          winnings: z.number().min(0).max(100000).optional(),
        })
      )
      .min(1)
      .max(100),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const addMoneySchema = z.object({
  body: z.object({
    amount: z.number().min(10).max(50000),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const submitPaymentSchema = z.object({
  body: z.object({
    utr: z.string().trim().min(6).max(50),
  }),
  params: z.object({ tournamentId: objectId }),
  query: z.object({}).optional(),
});

const paymentIdParamSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300).optional(),
  }).optional(),
  params: z.object({ id: objectId }),
  query: z.object({}).optional(),
});

const tournamentIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ tournamentId: objectId }),
  query: z.object({}).optional(),
});

const withdrawSchema = z.object({
  body: z.object({
    amount: z.number().min(30).max(50000),
    upiId: z
      .string()
      .trim()
      .toLowerCase()
      .regex(upiIdRegex, "Invalid UPI ID"),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const withdrawIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: objectId }),
  query: z.object({}).optional(),
});

const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(24).optional(),
    fullName: z.string().trim().min(2).max(60).optional(),
    bgmiName: z.string().trim().max(32).optional(),
    bgmiUid: z.string().trim().max(32).optional(),
    freeFireName: z.string().trim().max(32).optional(),
    freeFireUid: z.string().trim().max(32).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const adminResetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6).max(64),
  }),
  params: z.object({ userId: objectId }),
  query: z.object({}).optional(),
});

const adminAssignPhoneSchema = z.object({
  body: z.object({
    phoneNumber: phoneNumberSchema,
  }),
  params: z.object({ userId: objectId }),
  query: z.object({}).optional(),
});

const adminPublishResultsSchema = z.object({
  body: z.object({
    matchId: objectId,
    players: z
      .array(
        z.object({
          email: z.string().email().transform((value) => value.toLowerCase()),
          kills: z.number().min(0),
          score: z.number().min(0),
          rank: z.number().int().min(1).optional(),
          winnings: z.number().min(0),
        })
      )
      .min(1)
      .max(200),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const publishRoomSchema = z.object({
  body: z.object({
    roomId: z.string().trim().min(1).max(60),
    roomPassword: z.string().trim().min(1).max(60),
  }),
  params: z.object({ matchId: objectId }),
  query: z.object({}).optional(),
});

const sendNotificationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120),
    message: z.string().trim().min(5).max(300),
    recipientType: z.enum(["all", "specific"]),
    userId: objectId.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const verifyPlayerSchema = z.object({
  body: z.object({
    notes: z.string().trim().max(500).optional(),
  }),
  params: z.object({ registrationId: objectId }),
  query: z.object({}).optional(),
});

const createUpdateHighlightSchema = z
  .object({
    body: z.object({
      resultId: objectId.optional(),
      matchId: objectId.optional(),
      userId: objectId.optional(),
      winnerName: z.string().trim().max(100).optional(),
      teamName: z.string().trim().max(100).optional(),
      prizeAmount: z.number().min(0).max(500000).optional(),
      matchType: z.string().trim().max(50).optional(),
      map: z.string().trim().max(50).optional(),
      youtubeUrl: z
        .preprocess((value) => {
          if (typeof value === "string" && value.trim() === "") return undefined;
          return value;
        }, z.string().trim().url().regex(youtubeUrlRegex, "Invalid YouTube URL"))
        .optional(),
      instagramUrl: z
        .preprocess((value) => {
          if (typeof value === "string" && value.trim() === "") return undefined;
          return value;
        }, z.string().trim().url().regex(instagramReelUrlRegex, "Invalid Instagram Reel URL"))
        .optional(),
      thumbnailUrl: z
        .preprocess((value) => {
          if (typeof value === "string" && value.trim() === "") return undefined;
          return value;
        }, z.string().trim().url())
        .optional(),
      description: z.string().trim().max(500).optional(),
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
  })
  .refine(
    (data) => data.body.resultId || data.body.winnerName?.trim(),
    {
      message: "Select a winner or enter a winner name.",
      path: ["body", "winnerName"],
    }
  );

const highlightIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ highlightId: objectId }),
  query: z.object({}).optional(),
});

const matchIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ matchId: objectId }),
  query: z.object({}).optional(),
});

const userIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ userId: objectId }),
  query: z.object({}).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createMatchSchema,
  updateMatchSchema,
  idParamSchema,
  resultsPublishSchema,
  addMoneySchema,
  submitPaymentSchema,
  paymentIdParamSchema,
  tournamentIdParamSchema,
  withdrawSchema,
  withdrawIdParamSchema,
  updateProfileSchema,
  adminResetPasswordSchema,
  adminAssignPhoneSchema,
  adminPublishResultsSchema,
  publishRoomSchema,
  verifyPlayerSchema,
  sendNotificationSchema,
  createUpdateHighlightSchema,
  highlightIdParamSchema,
  matchIdParamSchema,
  userIdParamSchema,
};
