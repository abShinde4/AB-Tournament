const dotenv = require("dotenv");
const connectDb = require("./config/db");
const Match = require("./models/Match");

dotenv.config();

const seedMatches = [
  {
    title: "AB Free Fire Solo Cup",
    game: "Free Fire",
    entryFee: 20,
    prizePool: 200,
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 3),
    status: "Upcoming",
  },
  {
    title: "AB BGMI Squad Clash",
    game: "BGMI",
    entryFee: 20,
    prizePool: 500,
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 7),
    status: "Upcoming",
  },
];

const run = async () => {
  try {
    await connectDb();
    await Match.deleteMany({});
    await Match.insertMany(seedMatches);
    // eslint-disable-next-line no-console
    console.log("Seeded matches");
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
    process.exit(1);
  }
};

run();
