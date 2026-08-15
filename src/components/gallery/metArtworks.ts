/**
 * Shared, dependency-free logic for The Met Collection API integration.
 *
 * Imported by both the server routes (`/api/met/search`, `/api/gallery/generate`)
 * and the client picker, so everything here must stay pure and environment
 * agnostic — no `fetch`, no React, no Node built-ins.
 */

export const MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

export const MET_ATTRIBUTION =
  "Source artwork data and image from The Metropolitan Museum of Art Open Access collection.";

export const MET_SAFETY_NOTE =
  "Generated images are not affiliated with or endorsed by The Met.";

/**
 * The one place the gallery states attribution and AI provenance.
 * Rendered only behind the top-right info button, never inline in the room.
 */
export const GALLERY_INFO_TEXT = `${MET_ATTRIBUTION} ${MET_SAFETY_NOTE}`;

/** Normalized record handed to the client. Absent metadata is `null`, never `""`. */
export type MetArtwork = {
  objectID: number;
  title: string;
  artistDisplayName: string | null;
  objectDate: string | null;
  medium: string | null;
  department: string | null;
  classification: string | null;
  culture: string | null;
  period: string | null;
  objectName: string | null;
  objectURL: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  isPublicDomain: boolean;
  rightsAndReproduction: string | null;
};

export type MetSearchResponse = {
  query: string;
  /** Index into The Met's matched-id list that this page started from. */
  offset: number;
  /** Cursor for the next page, or `null` once the id list is exhausted. */
  nextOffset: number | null;
  /** Ids The Met matched, before public-domain filtering. */
  totalMatches: number;
  /**
   * `"artist"` when the query named someone with work in the collection, in
   * which case results are restricted to that artist.
   */
  matchMode: "artist" | "keyword";
  /** Works by the named artist that were scanned, Open Access or not. */
  artistMatchesSeen: number;
  /**
   * Records scanned for this page that matched the query but are not Open
   * Access. Surfaced so a search like "monet" — whose Met holdings are entirely
   * still in copyright — can explain itself instead of looking broken.
   */
  skippedNotOpenAccess: number;
  artworks: MetArtwork[];
};

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Only Met-hosted https URLs are kept. Object records are third-party input that
 * ends up in `<img src>` and in a user-visible link, so anything off-host is
 * dropped rather than rendered.
 */
const MET_HOSTS = new Set([
  "images.metmuseum.org",
  "www.metmuseum.org",
  "metmuseum.org",
  "collectionapi.metmuseum.org",
]);

function metUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (!MET_HOSTS.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Shape a raw `/objects/{id}` record into `MetArtwork`, or `null` if unusable. */
export function normalizeMetObject(raw: unknown): MetArtwork | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const objectID = record.objectID;
  if (typeof objectID !== "number" || !Number.isFinite(objectID)) return null;

  return {
    objectID,
    title: text(record.title) ?? "Untitled",
    artistDisplayName: text(record.artistDisplayName),
    objectDate: text(record.objectDate),
    medium: text(record.medium),
    department: text(record.department),
    classification: text(record.classification),
    culture: text(record.culture),
    period: text(record.period),
    objectName: text(record.objectName),
    objectURL: metUrl(record.objectURL),
    primaryImage: metUrl(record.primaryImage),
    primaryImageSmall: metUrl(record.primaryImageSmall),
    isPublicDomain: record.isPublicDomain === true,
    rightsAndReproduction: text(record.rightsAndReproduction),
  };
}

/** The Open Access image to display, preferring the web-sized derivative. */
export function openAccessImageUrl(artwork: MetArtwork): string | null {
  return artwork.primaryImageSmall ?? artwork.primaryImage ?? null;
}

export type MetIneligibilityReason =
  | "not-public-domain"
  | "no-open-access-image"
  | "rights-restricted";

export type MetEligibility =
  | { eligible: true }
  | { eligible: false; reason: MetIneligibilityReason; message: string };

const INELIGIBILITY_MESSAGE: Record<MetIneligibilityReason, string> = {
  "not-public-domain":
    "This artwork is not marked public domain in The Met's Open Access data, so it can't be used as inspiration here.",
  "no-open-access-image":
    "This artwork has no Open Access image available, so there is nothing to draw visual cues from.",
  "rights-restricted":
    "This artwork carries a rights and reproduction credit and is not clearly Open Access, so generation is disabled.",
};

/**
 * Gate for using an artwork as inspiration: it must be flagged public domain
 * AND actually ship an Open Access image. A `rightsAndReproduction` credit
 * blocks anything that is not clearly public domain + Open Access; when the
 * record is clearly Open Access the credit is still surfaced in the UI.
 */
export function artworkEligibility(artwork: MetArtwork): MetEligibility {
  const hasImage = openAccessImageUrl(artwork) !== null;
  const clearlyOpenAccess = artwork.isPublicDomain && hasImage;
  if (clearlyOpenAccess) return { eligible: true };

  const reason: MetIneligibilityReason = artwork.rightsAndReproduction
    ? "rights-restricted"
    : !artwork.isPublicDomain
      ? "not-public-domain"
      : "no-open-access-image";

  return { eligible: false, reason, message: INELIGIBILITY_MESSAGE[reason] };
}

export function isGenerationEligible(artwork: MetArtwork): boolean {
  return artworkEligibility(artwork).eligible;
}

/**
 * Lowercased and stripped of diacritics, so a query typed on a US keyboard
 * still matches the collection's spelling: "cezanne" has to reach "Cézanne",
 * and it is the accented form that Met stores.
 */
function foldForMatching(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Search words worth matching an artist name against. */
export function artistQueryTokens(query: string): string[] {
  return foldForMatching(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

/**
 * Whether the record's artist or culture genuinely answers the query.
 *
 * Every token has to appear. Met's relevance tail for "monet" is full of
 * Manet, Caillebotte and Cézanne — people who merely turn up in a Monet's
 * credit line — and showing those under a search for Monet is what "search is
 * broken" looked like.
 */
export function matchesArtist(
  artwork: MetArtwork,
  tokens: string[],
): boolean {
  if (tokens.length === 0) return false;
  const haystack = foldForMatching(
    `${artwork.artistDisplayName ?? ""} ${artwork.culture ?? ""}`,
  );
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Concrete physical description of a medium, keyed by substrings of The Met's
 * `medium` field.
 *
 * The earlier version paraphrased the metadata back at the model ("mark-making
 * in the spirit of oil on canvas"), which is an abstraction an image model has
 * no way to act on — it produced smooth digital illustration every time. These
 * describe what the surface physically looks like instead, because that is what
 * the model can actually render.
 *
 * Order matters: the first matching entry wins, so narrower media are listed
 * before the broad ones they contain.
 */
const MEDIUM_DESCRIPTORS: ReadonlyArray<readonly [string, string]> = [
  [
    "woodblock",
    "a woodblock print with flat unmodulated colour fields, crisp carved keyline outlines, visible wood grain and slight registration offsets, and matte absorbent paper",
  ],
  [
    "watercolor",
    "a watercolour on paper with translucent washes, granulating pigment pooling at the edges of each stroke, soft blooms where colours ran wet-into-wet, and bare paper left glowing through the lights",
  ],
  [
    "gouache",
    "an opaque gouache painting with chalky matte colour laid in flat overlapping patches and dry-brushed edges",
  ],
  [
    "pastel",
    "a soft-pastel drawing with powdery broken colour, strokes of raw pigment scumbled over one another, and the tooth of the paper breaking every mark",
  ],
  [
    "tempera",
    "an egg tempera panel with fine hatched strokes building up luminous translucent colour over a pale ground",
  ],
  [
    "fresco",
    "a fresco with chalky lime-washed colour, soft matte surface and areas worn and abraded with age",
  ],
  [
    "engrav",
    "an engraving in dense black line, built entirely from hatching and cross-hatching on cream laid paper, with no flat tone",
  ],
  [
    "etching",
    "an etching in bitten black line on cream laid paper, tone built from hatching and plate-tone, with a visible plate mark",
  ],
  [
    "lithograph",
    "a lithograph with grainy crayon tone on stone, soft edges and a limited flat colour range",
  ],
  [
    "charcoal",
    "a charcoal drawing in smudged velvety blacks and rubbed greys, with the paper's white left as the highlights",
  ],
  [
    "ink",
    "brushed ink on absorbent paper, tone carried entirely by the loaded and dry passages of a single brush, with generous empty ground",
  ],
  [
    "silk",
    "pigment on silk with soft muted colour sunk into the weave and a warm aged ground",
  ],
  [
    "acrylic",
    "an acrylic painting with flat saturated colour, hard edges and a matte plastic surface",
  ],
  [
    "canvas",
    "a thickly worked oil painting on canvas: loaded brush, ridges of impasto standing off the surface and catching the light, long directional strokes that follow the form, and the woven canvas tooth showing through the thinner passages",
  ],
  [
    "oil",
    "an oil painting with buttery opaque paint, visible brush marks, soft blended half-tones and deep glazed shadows",
  ],
  [
    "panel",
    "an oil on wood panel with smooth enamel-like glazes, deep transparent darks and a faint craquelure over the whole surface",
  ],
];

const DEFAULT_MEDIUM_DESCRIPTOR =
  "a hand-made painting with visible brush marks, uneven pigment and a physical surface texture";

/** The physical-surface phrase for an artwork's medium. */
export function mediumDescriptor(artwork: MetArtwork): string {
  const medium = artwork.medium?.toLowerCase() ?? "";
  for (const [needle, descriptor] of MEDIUM_DESCRIPTORS) {
    if (medium.includes(needle)) return descriptor;
  }
  return DEFAULT_MEDIUM_DESCRIPTOR;
}

/** First four-digit year in a Met date string ("ca. 1888", "1888–89"). */
function startYear(artwork: MetArtwork): number | null {
  const match = /\b(1[0-9]{3}|20[0-9]{2})\b/.exec(artwork.objectDate ?? "");
  return match ? Number(match[1]) : null;
}

/**
 * Period-specific colour and light handling. Bands are deliberately coarse —
 * they only need to separate, say, a gilded altarpiece from a plein-air
 * landscape, and Met date strings are too irregular to support finer slicing.
 */
function eraDescriptor(artwork: MetArtwork): string | null {
  const year = startYear(artwork);
  if (year === null) return null;
  if (year < 1450) {
    return "flat gilded ground, jewel-like unmodelled colour and no cast shadows";
  }
  if (year < 1600) {
    return "warm earth-toned palette, modelling that turns gradually from light into deep transparent shadow";
  }
  if (year < 1750) {
    return "dramatic chiaroscuro, a single warm light source and heavy shadow swallowing the edges of the picture";
  }
  if (year < 1850) {
    return "cool silvery light, restrained palette and carefully graded tonal transitions";
  }
  if (year < 1910) {
    return "high-key broken colour straight from the tube, complementary colours placed side by side rather than blended, and coloured shadows instead of grey ones";
  }
  return "bold flattened colour, simplified planes and strong graphic contrast";
}

/**
 * Movement-specific handling: what shape the strokes are, which direction they
 * run, and how form is built out of them.
 *
 * A single generic "thick impasto oil" string for every painting produced
 * exactly that — anonymous palette-knife smears — regardless of the source. The
 * difference between van Gogh and Cézanne and Monet is stroke shape and
 * direction, not paint thickness, so that is what these describe.
 */
/** `name` is a full noun phrase, since not every movement is a "painting". */
type Movement = { name: string; strokeIdiom: string };

function movementFor(artwork: MetArtwork): Movement | null {
  const medium = artwork.medium?.toLowerCase() ?? "";
  const culture = `${artwork.culture ?? ""} ${artwork.period ?? ""}`.toLowerCase();
  const year = startYear(artwork);

  if (medium.includes("woodblock") || culture.includes("japan")) {
    return {
      name: "ukiyo-e woodblock print",
      strokeIdiom:
        "form built from flat unmodulated colour fields bounded by crisp carved keylines, bold asymmetric cropping, stylised repeating pattern in water, cloth and sky, and no cast shadows",
    };
  }

  if (year === null) return null;

  if (year >= 1880 && year < 1910) {
    return {
      name: "Post-Impressionist painting",
      /*
       * Deliberately says nothing about which colours. An earlier version ended
       * "high-chroma complementary pairing of colour", and against van Gogh's
       * Oleanders — acid yellow-green, pink, violet — it returned teal and
       * orange, the textbook complementary pair. The text was out-arguing the
       * reference image on the one question the reference answers best.
       *
       * It also claimed "swirling directional currents", which is Starry Night,
       * not a property of the movement: Cézanne, Seurat and Gauguin have no
       * such thing, and neither does Oleanders. Directionality is already
       * carried below, without over-fitting to one canvas.
       */
      strokeIdiom:
        "form built from short rhythmic strokes of unmixed colour laid side by side like hatching, each stroke following the contour of the object it describes, and dark contour lines drawn around the forms",
    };
  }
  if (year >= 1860 && year < 1880) {
    return {
      name: "Impressionist painting",
      strokeIdiom:
        "form built from broken comma-shaped dabs of unblended colour, edges left soft and dissolving, shadows carried in colour rather than in grey, and light scattered in flecks across the whole surface",
    };
  }
  if (year >= 1600 && year < 1750) {
    return {
      name: "Baroque painting",
      strokeIdiom:
        "form built by turning smoothly from a single warm light into deep transparent shadow, edges lost into the dark, and paint blended so the strokes barely show",
    };
  }
  if (year >= 1400 && year < 1600) {
    return {
      name: "Renaissance painting",
      strokeIdiom:
        "form built from fine invisible blending over a pale ground, precise contours, and even unhurried light",
    };
  }
  if (year >= 1910) {
    return {
      name: "Modernist painting",
      strokeIdiom:
        "form simplified into flat planes of bold unmodulated colour with strong graphic contrast",
    };
  }
  return null;
}

/**
 * A short factual attribution used as a style anchor: "Post-Impressionist oil
 * painting by Vincent van Gogh, 1888".
 *
 * The artist's name was deliberately withheld at first, on the theory that
 * naming a painter invites pastiche of their whole body of work. In practice
 * that swung too far and produced generic period painting. These are verified
 * public-domain Open Access records by long-dead artists, and the attribution
 * is factual metadata on the record — naming it is both legitimate and by far
 * the strongest style signal available. The originality guardrails downstream
 * are what keep the output an original picture.
 */
export function styleAnchor(artwork: MetArtwork): string {
  const year = startYear(artwork);
  let anchor = `A ${movementFor(artwork)?.name ?? "painting"}`;
  if (artwork.artistDisplayName) anchor += ` by ${artwork.artistDisplayName}`;
  if (year !== null) anchor += `, ${year}`;
  return anchor;
}

/** Concrete visual descriptors to render, derived only from factual metadata. */
export function artworkStyleCues(artwork: MetArtwork): string[] {
  const cues: string[] = [mediumDescriptor(artwork)];

  const movement = movementFor(artwork);
  if (movement) cues.push(movement.strokeIdiom);

  const era = eraDescriptor(artwork);
  if (era) cues.push(era);

  return cues;
}

/** The stroke-shape and stroke-direction sentence, when one can be derived. */
export function strokeIdiom(artwork: MetArtwork): string | null {
  return movementFor(artwork)?.strokeIdiom ?? null;
}

/**
 * Steers away from the specific failure mode observed in testing: every early
 * generation came back as a glossy, smoothly shaded digital illustration
 * regardless of the medium asked for. The generation API exposes no
 * negative-prompt parameter, so the exclusions have to live in the prompt body.
 */
export const STYLE_COUNTER_GUIDANCE =
  "Not a photograph and not photorealistic. Not a digital illustration, not a 3D render, not concept art, not stock art. No airbrushed gradients, no smooth glossy shading, no clean vector edges, no CGI sheen, no plastic skin, no over-sharpened AI look. No black border, mat, picture frame or letterbox around the painting — the painted surface meets every edge of the canvas. Every part of the surface must show the hand of the painter or draughtsperson and the texture of the material.";

/**
 * Used when the user generates without a Met inspiration. Bare subject text
 * alone drifts toward generic digital illustration; this keeps the default
 * output in museum-wall, hand-made territory.
 */
export const BARE_ARTISTIC_GUIDANCE =
  "A museum-quality hand-made painting or drawing: beautiful, tasteful, and refined. Thoughtful composition with intentional negative space and harmonious colour. Visible hand of the artist — brush marks or drawn marks, uneven pigment, physical surface — never flat digital fill.";

/**
 * How the prompt names the single image sent as `image_urls[0]`. Exactly one
 * reference is ever sent.
 *
 * Omitting this label is what made every early attempt fail. An unnamed
 * reference is treated as content to compose from rather than technique to
 * follow, which is why a Cézanne still life produced apples in a picture that
 * had asked for butterflies: the reference was consumed, its subject leaked in,
 * and its brushwork did not. Any sentence about style has to name the
 * reference.
 */
export const REFERENCE_FRAME_TAG = "the first reference image";

export type PromptComposition = {
  prompt: string;
  /** Present when an inspiration artwork shaped the prompt. */
  inspiredByObjectID: number | null;
  /** Whether the prompt is written to accompany a reference image. */
  usesReferenceImage: boolean;
};

export type PromptOptions = {
  /**
   * Set when the artwork's Open Access image is sent alongside the prompt as a
   * style reference, which changes how the style is described: the image
   * carries the palette and brushwork, so the text points at it instead of
   * trying to describe colour in words.
   */
  referenceImage?: boolean;
};

/**
 * Final generation prompt. Composed server-side so the client can never smuggle in
 * "reproduce this painting" instructions around the guardrails.
 *
 * Style leads and the subject follows. Leading with the subject is what the
 * first version did, and the model treated the trailing style language as
 * decoration it was free to ignore.
 */
export function composeInspiredPrompt(
  subject: string,
  artwork?: MetArtwork | null,
  options: PromptOptions = {},
): PromptComposition {
  const cleanSubject = subject.trim().replace(/\s+/g, " ");

  if (!artwork) {
    return {
      prompt: [
        BARE_ARTISTIC_GUIDANCE,
        `The picture depicts: ${cleanSubject}, clearly recognisable, complete and uncropped, with clear space around it on every side.`,
        STYLE_COUNTER_GUIDANCE,
      ].join(" "),
      inspiredByObjectID: null,
      usesReferenceImage: false,
    };
  }

  const usesReferenceImage = options.referenceImage === true;
  const idiom = strokeIdiom(artwork);

  /*
   * The frame tag appears only in sentences about technique, never about
   * content, and the "must not appear" clause sits directly beside a tagged
   * mention. That adjacency is what keeps the source painting's own subject out
   * of the result.
   */
  const style = usesReferenceImage
    ? [
        `An exact stylistic match to ${REFERENCE_FRAME_TAG} — identical palette, stroke and surface.`,
        // Naming the reference as the palette authority, rather than only
        // deleting the text that competed with it. Any palette this prompt
        // could describe is a guess about a movement; the reference is the
        // actual painting, so it wins outright wherever the two disagree.
        `Sample the colours from ${REFERENCE_FRAME_TAG} itself — the same hues, in the same proportions — rather than from any general idea of the period.`,
        `Borrow only the painting technique of ${REFERENCE_FRAME_TAG} — its subject, objects and composition must not appear.`,
      ]
    : [
        `Render it as ${artworkStyleCues(artwork).join(", ")}.`,
        `The finished picture must be an original work inspired by that handling, showing the stated subject only.`,
      ];

  const prompt = [
    `${styleAnchor(artwork)}.`,
    `${capitalize(mediumDescriptor(artwork))}.`,
    idiom ? `${capitalize(idiom)}.` : null,
    /*
     * Subject legibility is stated as a requirement, not assumed. Pushing style
     * this hard has twice cost the subject: an early "fills the canvas edge to
     * edge" clause read as an instruction to crop into the paint, and its
     * replacement warned against "a close-up of the paint" and still returned a
     * butterfly running off three sides.
     *
     * Naming the failure was the problem — "close-up" is the composition the
     * model then reached for. So this asks positively for what is wanted and
     * never says the word. Avoid "inside the frame" too: that reads as a
     * request to draw a black keyline / picture-frame pad around the paint.
     */
    `The painting depicts: ${cleanSubject}, clearly recognisable. Show the whole subject complete and uncropped, with clear space around it on every side.`,
    `Museum-wall quality: beautiful, tasteful, and refined — not decorative kitsch and not generic AI art.`,
    ...style,
    STYLE_COUNTER_GUIDANCE,
  ]
    .filter((line): line is string => line !== null)
    .join(" ");

  return {
    prompt,
    inspiredByObjectID: artwork.objectID,
    usesReferenceImage,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
