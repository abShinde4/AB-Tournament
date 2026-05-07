const cron = require("node-cron");
const Match = require("../models/Match");

let roomVisibilityJob = null;

const unlockRooms = async () => {
  const now = new Date();
  const unlockCutoff = new Date(now.getTime() + 10 * 60 * 1000);

  await Match.updateMany(
    {
      isRoomVisible: false,
      roomId: { $ne: "" },
      roomPassword: { $ne: "" },
      startTime: { $lte: unlockCutoff },
      status: { $in: ["Upcoming", "Live"] },
    },
    { $set: { isRoomVisible: true } }
  );
};

const startRoomVisibilityJob = () => {
  if (roomVisibilityJob) return roomVisibilityJob;

  roomVisibilityJob = cron.schedule("* * * * *", () => {
    unlockRooms().catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Room visibility job failed:", error.message);
    });
  });

  // Run once on boot to avoid waiting a full minute.
  unlockRooms().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Initial room visibility sync failed:", error.message);
  });

  return roomVisibilityJob;
};

module.exports = { startRoomVisibilityJob, unlockRooms };
