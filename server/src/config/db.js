const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");

let memoryServer;

const connectDb = async () => {
  let mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }

  const defaultDbName = process.env.MONGO_DB_NAME || "ab_tournament";
  const [uriWithoutQuery, query] = mongoUri.split("?");
  const hasDbName = /^mongodb(?:\+srv)?:\/\/[^/]+\/.+/.test(uriWithoutQuery);
  if (!hasDbName) {
    mongoUri = `${uriWithoutQuery}/${defaultDbName}${query ? `?${query}` : ""}`;
    // eslint-disable-next-line no-console
    console.log(`MongoDB URI did not include a database name. Defaulting to ${defaultDbName}.`);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    // eslint-disable-next-line no-console
    console.log("MongoDB connected", { dbName: mongoose.connection.name });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    // eslint-disable-next-line no-console
    console.warn("MongoDB unavailable, switching to in-memory DB for development.");

    // Redirect mongodb-memory-server downloads to a location with more space.
    // This avoids ENOSPC when the default home/cache drive is full.
    const downloadDir =
      process.env.MONGOMS_DOWNLOAD_DIR ||
      path.resolve(__dirname, "..", "..", "mongodb-memory-server-downloads");
    process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;
    // eslint-disable-next-line no-console
    console.warn(`mongodb-memory-server download dir: ${downloadDir}`);

    memoryServer = await Promise.race([
      MongoMemoryServer.create(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("In-memory MongoDB startup timed out.")), 600000)
      ),
    ]);
    await mongoose.connect(memoryServer.getUri());
    // eslint-disable-next-line no-console
    console.log("In-memory MongoDB connected");
  }
};

module.exports = connectDb;
