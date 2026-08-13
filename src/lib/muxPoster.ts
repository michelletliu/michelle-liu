/**
 * Poster frames for the looping Mux clips behind project cards.
 *
 * Mux serves the clip's midpoint when a thumbnail URL carries no `time`, and
 * for most cards that lands somewhere representative. A few clips open on an
 * empty or off-screen frame and then slide content in: Mux's midpoint poster
 * shows the assembled UI, so the card fades that out when the video starts.
 * Projects listed here pin the poster to the frame their loop opens on instead.
 */
const POSTER_TIME_SECONDS_BY_PROJECT_ID: Record<string, number> = {
  gallery: 0,
  "design-meetup": 0,
  sundays: 0,
};

export function posterTimeForProject(projectId?: string): number | undefined {
  if (!projectId) return undefined;
  return POSTER_TIME_SECONDS_BY_PROJECT_ID[projectId];
}

export function muxPosterUrl(
  playbackId: string,
  options: { projectId?: string; width?: number } = {},
): string {
  const { projectId, width } = options;
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));

  const time = posterTimeForProject(projectId);
  if (time !== undefined) params.set("time", String(time));

  const query = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.png${query ? `?${query}` : ""}`;
}
