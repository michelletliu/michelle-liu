const EDGE_EPSILON = 1;

export function getHorizontalFadeVisibility({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
}) {
  return {
    showLeft: scrollLeft > EDGE_EPSILON,
    showRight:
      scrollLeft + clientWidth < scrollWidth - EDGE_EPSILON,
  };
}
