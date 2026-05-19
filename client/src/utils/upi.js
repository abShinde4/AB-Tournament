export const DEFAULT_UPI_ID = "7743845982@kotak811";

export const buildUpiPayUri = ({ upiId, amount, payeeName = "AB Tournament", note = "Tournament Entry" }) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: String(Number(amount) || 0),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
};

export const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
