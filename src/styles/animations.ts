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
@keyframes fadeUpRight {
  from {
    opacity: 0;
    transform: translate(-10px, 12px);
  }
  to {
    opacity: 1;
    transform: translate(0, 0);
  }
}
.animate-fade-up {
  animation: fadeUp 400ms ease-out forwards;
}
.animate-fade-up-right {
  animation: fadeUpRight 420ms ease-out forwards;
}
`;
