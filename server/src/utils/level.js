const calculateLevel = (xp = 0) => Math.floor(Number(xp || 0) / 100) + 1;

module.exports = { calculateLevel };
