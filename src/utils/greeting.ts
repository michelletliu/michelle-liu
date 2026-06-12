/**
 * Returns a time-appropriate greeting based on the visitor's local hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) return "Burning the midnight oil?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Happy late night";
}
