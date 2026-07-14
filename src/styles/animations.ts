/**
 * Shared CSS keyframe definitions injected via <style> tags.
 * Consolidates duplicated animation definitions from HomePageClient, AboutPage, and ArtPage.
 */

export const fadeUpStyles = `
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-up {
  animation: fadeUp 400ms ease-out forwards;
}
`;
