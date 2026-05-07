const Registration = require("../models/Registration");

/**
 * Middleware to verify user has joined a specific match
 * Prevents unauthorized access to match details and room credentials
 */
const requireMatchJoined = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    
    if (!matchId) {
      return res.status(400).json({ message: "Match ID is required." });
    }

    const registration = await Registration.findOne({
      user: req.user._id,
      match: matchId,
    });

    if (!registration) {
      return res.status(403).json({ 
        message: "You must join this match to access this resource." 
      });
    }

    // Attach registration to request for use in controller
    req.registration = registration;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Authorization check failed." });
  }
};

module.exports = { requireMatchJoined };
