const { z } = require("zod");

const createTeamBodySchema = z.object({
  body: z.object({
    tournamentId: z.string().min(1),
    teamName: z.string().trim().min(2).max(40),
    leaderBgmiUid: z.string().trim().min(5).max(20),
    leaderWhatsapp: z.string().trim().min(10).max(15),
    teamLogo: z.string().trim().max(500).optional(),
    teamDescription: z.string().trim().max(200).optional().or(z.literal("")),
  }),
});

const joinTeamBodySchema = z.object({
  body: z.object({
    teamId: z.string().trim().min(1),
    bgmiUid: z.string().trim().min(5).max(20),
    tournamentId: z.string().min(1).optional(),
  }),
});

const updateTeamBodySchema = z.object({
  params: z.object({ teamId: z.string().trim().min(1) }),
  body: z.object({
    teamName: z.string().trim().min(2).max(40).optional(),
    leaderBgmiUid: z.string().trim().min(5).max(20).optional(),
    leaderWhatsapp: z.string().trim().min(10).max(15).optional(),
    teamLogo: z.string().trim().max(500).optional(),
  }),
});

const kickPlayerParamsSchema = z.object({
  params: z.object({
    teamId: z.string().trim().min(1),
    userId: z.string().min(1),
  }),
});

const teamIdParamSchema = z.object({
  params: z.object({ teamId: z.string().trim().min(1) }),
});

const tournamentIdParamSchema = z.object({
  params: z.object({ tournamentId: z.string().min(1) }),
});

const publishSquadResultsSchema = z.object({
  body: z.object({
    matchId: z.string().min(1),
    teams: z
      .array(
        z.object({
          teamId: z.string().trim().min(1),
          kills: z.number().int().min(0),
          winnings: z.number().min(0),
          playerKills: z
            .array(
              z.object({
                userId: z.string().min(1),
                kills: z.number().int().min(0),
              })
            )
            .optional(),
        })
      )
      .min(1),
  }),
});

const adminListQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    teamId: z.string().optional(),
    teamName: z.string().optional(),
    leaderName: z.string().optional(),
    whatsapp: z.string().optional(),
    tournamentId: z.string().optional(),
    status: z.enum(["READY", "WAITING", "LOCKED", "ALL"]).optional(),
  }),
});

module.exports = {
  createTeamBodySchema,
  joinTeamBodySchema,
  updateTeamBodySchema,
  kickPlayerParamsSchema,
  teamIdParamSchema,
  tournamentIdParamSchema,
  publishSquadResultsSchema,
  adminListQuerySchema,
};
