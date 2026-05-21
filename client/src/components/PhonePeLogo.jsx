const PhonePeLogo = ({ size = 28 }) => (
  <span className="phonepe-logo" aria-hidden="true">
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#5f259f" />
      <path
        d="M11 10h4.2c3.1 0 5.3 1.8 5.3 4.6 0 2.1-1.2 3.5-3 4l3.5 4.4h-3.4l-3.1-4h-1.5v4H11V10zm4 7.2c1.5 0 2.4-.8 2.4-2.1S16.5 13 15 13h-1.3v4.2H15z"
        fill="#fff"
      />
    </svg>
    <span className="phonepe-logo-text">PhonePe</span>
  </span>
);

export default PhonePeLogo;
