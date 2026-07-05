const normalizePhone = (phone = "") => {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(normalized) ? normalized : null;
};

module.exports = { normalizePhone };
