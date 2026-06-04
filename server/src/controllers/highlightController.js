const WinnerHighlight = require("../models/WinnerHighlight");
const Result = require("../models/Result");
const Match = require("../models/Match");
const User = require("../models/User");

// List all winner highlights with pagination
const listHighlights = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
  const skip = (page - 1) * limit;

  try {
    const [highlights, total] = await Promise.all([
      WinnerHighlight.find()
        .populate("user", "username avatar")
        .populate("match", "title game")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WinnerHighlight.countDocuments(),
    ]);

    return res.json({
      data: highlights,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch highlights." });
  }
};

// Get highlights for a specific match
const getMatchHighlights = async (req, res) => {
  const { matchId } = req.validated.params;

  try {
    const highlights = await WinnerHighlight.find({ match: matchId })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    return res.json({ data: highlights });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch match highlights." });
  }
};

// Create or update winner highlight
const createUpdateHighlight = async (req, res) => {
  let {
    resultId,
    matchId,
    userId,
    winnerName,
    teamName,
    prizeAmount,
    matchType,
    map,
    youtubeUrl,
    instagramUrl,
    thumbnailUrl,
    description,
  } = req.validated.body;

  try {
    let resolvedMatchId = matchId || null;
    let resolvedUserId = userId || null;

    if (resultId) {
      const result = await Result.findById(resultId);
      if (!result) {
        return res.status(404).json({ message: "Result not found." });
      }

      if (resolvedMatchId && result.match.toString() !== resolvedMatchId) {
        return res.status(400).json({ message: "Result does not belong to this match." });
      }

      resolvedMatchId = result.match ? result.match.toString() : null;
      resolvedUserId = result.user ? result.user.toString() : resolvedUserId;
    }

    if (resolvedMatchId) {
      const match = await Match.findById(resolvedMatchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found." });
      }
    }

    let user = null;
    if (resolvedUserId) {
      user = await User.findById(resolvedUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
    }

    if (!winnerName?.trim() && user) {
      winnerName = user.username;
    }

    const updateData = {
      result: resultId || null,
      match: resolvedMatchId || null,
      user: resolvedUserId || null,
      winnerName: winnerName?.trim() || null,
      teamName: teamName?.trim() || null,
      prizeAmount: typeof prizeAmount === "number" ? prizeAmount : null,
      matchType: matchType?.trim() || null,
      map: map?.trim() || null,
      youtubeUrl: youtubeUrl?.trim() || null,
      instagramUrl: instagramUrl?.trim() || null,
      thumbnailUrl: thumbnailUrl?.trim() || null,
      description: description?.trim() || null,
    };

    const highlight = resultId
      ? await WinnerHighlight.findOneAndUpdate({ result: resultId }, updateData, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }).populate("user", "username avatar")
      : await WinnerHighlight.create(updateData);

    return res.json({
      message: "Highlight created/updated successfully",
      data: highlight,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to save highlight." });
  }
};

// Get a single highlight
const getHighlight = async (req, res) => {
  const { highlightId } = req.validated.params;

  try {
    const highlight = await WinnerHighlight.findByIdAndUpdate(
      highlightId,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("user", "username avatar").populate("match", "title game");

    if (!highlight) {
      return res.status(404).json({ message: "Highlight not found." });
    }

    return res.json({ data: highlight });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch highlight." });
  }
};

// Delete a highlight
const deleteHighlight = async (req, res) => {
  const { highlightId } = req.validated.params;

  try {
    const highlight = await WinnerHighlight.findByIdAndDelete(highlightId);

    if (!highlight) {
      return res.status(404).json({ message: "Highlight not found." });
    }

    return res.json({ message: "Highlight deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to delete highlight." });
  }
};

// Get highlights by user
const getUserHighlights = async (req, res) => {
  const { userId } = req.validated.params;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
  const skip = (page - 1) * limit;

  try {
    const [highlights, total] = await Promise.all([
      WinnerHighlight.find({ user: userId })
        .populate("match", "title game")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WinnerHighlight.countDocuments({ user: userId }),
    ]);

    return res.json({
      data: highlights,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch user highlights." });
  }
};

module.exports = {
  listHighlights,
  getMatchHighlights,
  createUpdateHighlight,
  getHighlight,
  deleteHighlight,
  getUserHighlights,
};
