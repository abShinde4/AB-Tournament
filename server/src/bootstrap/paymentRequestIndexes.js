const PaymentRequest = require("../models/PaymentRequest");

/**
 * Drops the legacy unique partial index on `user` (user_1) and syncs current schema indexes.
 * Allows multiple recharge requests per user while keeping UTR uniqueness for active requests.
 */
const syncPaymentRequestIndexes = async () => {
  try {
    const collection = PaymentRequest.collection;
    const indexes = await collection.indexes();
    const legacyUserUnique = indexes.find(
      (idx) => idx.name === "user_1" && idx.unique === true
    );

    if (legacyUserUnique) {
      await collection.dropIndex("user_1");
      // eslint-disable-next-line no-console
      console.log("Dropped legacy PaymentRequest unique index user_1.");
    }

    await PaymentRequest.syncIndexes();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("PaymentRequest index sync failed:", error.message || error);
  }
};

module.exports = { syncPaymentRequestIndexes };
