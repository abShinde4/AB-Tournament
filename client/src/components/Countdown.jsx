import { useEffect, useState } from 'react';

/**
 * Reusable countdown component
 * Displays time until room unlocks in MM:SS format
 */
export function Countdown({ unlockTime }) {
  const [timeLeft, setTimeLeft] = useState('00:00');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!unlockTime) return;

    const updateCountdown = () => {
      const now = Date.now();
      const targetTime = new Date(unlockTime).getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsUnlocked(true);
        return;
      }

      // Calculate minutes and seconds
      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      // Format as MM:SS
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeLeft(formatted);
      setIsUnlocked(false);
    };

    // Initial update
    updateCountdown();

    // Set interval for updates every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [unlockTime]);

  if (isUnlocked) return null;

  return <span>{timeLeft}</span>;
}

export default Countdown;
