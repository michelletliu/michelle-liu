import * as THREE from "three";
import { FALLBACK_HUES } from "./shimmerPalette";

/**
 * The wet-paint shimmer shown on a canvas while its image generates.
 *
 * Curl-advected, domain-warped fbm drives soft pigment washes over a light
 * paper base. Progress settles the swirl so soft colour masses coalesce into
 * a painting-like soft-focus composition (Midjourney-style progressive
 * resolve), while multi-scale boiling noise keeps the surface alive. Chroma
 * stays muted — ochre and umber, not neon marble. Unlit and un-tone-mapped so
 * it renders at the values authored here — the same reason hung artwork uses
 * a basic material.
 */
const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/*
 * NO BACKTICKS AND NO DOLLAR-BRACE ANYWHERE IN THE SHADER SOURCE BELOW — not
 * even inside a GLSL comment.
 *
 * The shader is a JavaScript template literal. A GLSL comment is invisible to
 * the JavaScript parser, which sees only one long string: a backtick ends that
 * string early and a dollar-brace opens an interpolation. Either way the whole
 * module fails to parse, and the error is reported against whatever
 * JavaScript-looking text follows — a line of GLSL, or a comment — so it never
 * points at the character that caused it. This has broken the build twice.
 */
const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
/** 0 at the start of a generation, asymptotically toward 1. */
uniform float uProgress;
/**
 * Four hue angles in OKLCh degrees, layered in order. Taken from the artwork
 * that inspired the generation when there is one. Hues only: chroma and
 * lightness are set below from progress, so no source palette can make this
 * dull or dark however muted the painting it came from.
 */
uniform vec4 uHues;

/*
 * Everything below mixes in OKLCh, never in RGB.
 *
 * Interpolating two hues in RGB runs the midpoint straight through the grey
 * axis, and layering several such blends averages the whole canvas to olive and
 * taupe — which is exactly what the previous version did. In OKLCh, hue is an
 * angle: crossing from amber to teal travels around the wheel through a vivid
 * green instead of collapsing through mud, and chroma is held explicitly rather
 * than being whatever falls out of the arithmetic.
 */
vec3 oklchToLinear(float L, float C, float hDeg) {
  float h = radians(hDeg);
  float a = C * cos(h);
  float b = C * sin(h);

  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;

  return vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

/* The scene renders unlit and un-tone-mapped, so this shader owns its encoding. */
vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

/** Shortest way round the hue circle, so a blend never detours through grey. */
float mixHue(float a, float b, float t) {
  float d = mod(b - a + 540.0, 360.0) - 180.0;
  return a + d * t;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

/** Three octaves, for the flow field — it is sampled nine times a pixel. */
float fbm3(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p *= 2.07;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Divergence-free flow, read off an fbm potential.
 *
 * The curl of a scalar field has no sources or sinks anywhere in it, so
 * advecting along it can only fold and shear the domain — it cannot push
 * outward from a bright spot or drain into a dark one. That is the difference
 * between pigment being stirred and pigment blooming, and it is why the swirl
 * comes from here rather than from rotating about a point: a fixed centre of
 * rotation reads as a pinwheel, which is the hypnotic look being avoided.
 */
vec2 curl(vec2 p) {
  float e = 0.09;
  float dx = fbm3(p + vec2(e, 0.0)) - fbm3(p - vec2(e, 0.0));
  float dy = fbm3(p + vec2(0.0, e)) - fbm3(p - vec2(0.0, e));
  return vec2(dy, -dx) / (2.0 * e);
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 uv = vUv;
  float t = uTime;
  float p = clamp(uProgress, 0.0, 1.0);
  // Settle: early = soft abstract field; late = painting-like soft focus.
  float settle = p * p * (3.0 - 2.0 * p);

  // Stir the sampling domain before any colour is read out of it.
  //
  // Translating the noise domains — which is all this used to do — slides the
  // whole field one way and reads as drift. Rotation is what reads as
  // stirring, so the domain is advected along a curl field instead. A curl
  // field alone is not enough though: leave it standing still and it warps the
  // canvas into a fixed set of swirls that the colour merely slides through.
  // Turning the advection direction is what actually stirs.
  //
  // So two counter-rotating advections, coarse and fine. Either one alone
  // would sweep every sample point around a circle and quietly repeat; at
  // different rates and opposite signs they beat against each other, so the
  // field keeps folding and never returns to a state it has held before. The
  // rates are global rather than per-pixel deliberately — uTime accumulates
  // for the life of the page, and a spatially varying rate would wind
  // neighbouring pixels arbitrarily far out of phase and tear the field apart
  // in a long session. The spatial variety comes from twist, an offset, which
  // stays bounded however long it runs.
  // The amplitudes are large because the curl of a smooth fbm is small — of
  // order half a unit — while the colour lobes below are only two or three
  // across the canvas. Displacing by a few hundredths of a UV does nothing
  // visible; it takes something near a fifth of the canvas to actually carry a
  // lobe somewhere, and that is where the folding and marbling come from.
  //
  // Settle pulls advection down so the swirl resolves into stable soft masses
  // rather than keeping the whole canvas liquid forever.
  float twist = (fbm3(uv * 1.15 + vec2(t * 0.05, -t * 0.04)) - 0.5) * 3.0;
  vec2 eddyA = rot(twist + t * 0.52) *
    curl(uv * 1.7 + vec2(t * 0.09, -t * 0.06));
  vec2 eddyB = rot(twist * 0.6 - t * 0.30) *
    curl(uv * 3.2 + vec2(2.6 - t * 0.05, 7.4 + t * 0.04));
  float stir = mix(1.0, 0.28, settle);
  vec2 sp = uv + (eddyA * 0.22 + eddyB * 0.11) * stir;

  // Two rounds of warping: the first bends the field, the second smears those
  // bends into the soft lobes that read as pigment spreading through water.
  // Warp strength also settles, so late frames read as soft focus rather than
  // wet marble.
  float warp = mix(1.0, 0.42, settle);
  vec2 q = vec2(
    fbm(sp * 2.3 + vec2(0.0, t * 0.11)),
    fbm(sp * 2.3 + vec2(3.7, -t * 0.09))
  );
  vec2 r = vec2(
    fbm(sp * 3.0 + 2.1 * q * warp + vec2(1.7 + t * 0.085, 9.2)),
    fbm(sp * 3.0 + 2.1 * q * warp + vec2(8.3, 2.8 - t * 0.070))
  );
  float f = fbm(sp * 1.9 + 2.6 * r * warp);

  // Coarse, slightly anisotropic noise for brush dabs — breaks the continuous
  // marble into loaded strokes without becoming a brush-simulation.
  float dab = noise(sp * vec2(14.0, 9.5) + vec2(t * 0.04, -t * 0.03));
  float dabEdge = smoothstep(0.28, 0.72, dab);
  f = mix(f, f * (0.78 + 0.44 * dabEdge), mix(0.22, 0.48, settle));

  /*
   * Progress is carried by chroma, coverage, and settle — not by darkening.
   * The mute pass dropped lightness too far; keep the wash bright like the
   * Midjourney progressive tiles (cream ground, soft colour masses). Chroma
   * still ramps so pigment loads onto the canvas without going neon.
   *
   * No backticks in this comment: the shader is a JS template literal, and one
   * here ends the string early.
   */
  float chroma = mix(0.032, 0.108, p);
  float lightness = mix(0.94, 0.86, p);
  float coverage = mix(0.22, 0.90, p);

  // Layering happens on the hue angle, so overlaps land on an intermediate hue
  // at full chroma rather than on the average of two RGB triples. Settle
  // tightens the blend windows so soft blobs resolve into clearer passages.
  float h = uHues.x;
  h = mixHue(h, uHues.y, smoothstep(mix(0.18, 0.36, settle), mix(0.90, 0.74, settle), r.x));
  h = mixHue(h, uHues.z, smoothstep(mix(0.20, 0.40, settle), mix(0.92, 0.78, settle), q.y));
  h = mixHue(h, uHues.w, smoothstep(mix(0.24, 0.46, settle), mix(0.96, 0.82, settle), r.y * f * 1.7));

  // Where the field is strong the paint sits thicker. Early: foggy softstep.
  // Late: tighter body so forms read as a soft-focus painting, not fog.
  float bodyLo = mix(0.12, 0.32, settle);
  float bodyHi = mix(0.88, 0.68, settle);
  float body = smoothstep(bodyLo, bodyHi, f) * (0.88 + 0.12 * dabEdge);
  float L = lightness - mix(0.025, 0.045, settle) * body;
  float C = chroma * (0.68 + 0.44 * body);

  // Light cream ground — closer to Midjourney submitting / early tiles than
  // the previous aged parchment, which read too heavy under mute chroma.
  vec3 paper = vec3(0.972, 0.962, 0.942);
  vec3 pigment = linearToSrgb(oklchToLinear(L, C, h));

  // Thin the wash back toward paper where the field is weak. Early coverage is
  // sparse so the canvas stays pale; late, soft masses fill like a painting
  // coming into focus.
  float wash = coverage * smoothstep(
    mix(0.00, 0.08, settle),
    mix(0.72, 0.52, settle),
    f + mix(0.34, 0.16, settle)
  );
  vec3 col = mix(paper, pigment, wash);

  // Matte lift — keeps life without gloss.
  float lift = sin((uv.x * 1.4 + uv.y * 0.7) * 1.8 - t * 0.35) * 0.5 + 0.5;
  col += 0.010 * (1.0 - 0.40 * p) * lift * dabEdge;

  // Boiling multi-scale noise — the Midjourney progressive tiles keep a live
  // grain field moving over the soft image, not a static weave stamp.
  float nA = noise(uv * 72.0 + vec2(t * 1.85, -t * 1.45));
  float nB = noise(uv * 148.0 + vec2(-t * 2.75, t * 2.15));
  float nC = noise(uv * 280.0 + vec2(t * 4.2, t * 3.1));
  float nD = hash(floor(uv * 420.0 + vec2(t * 18.0, -t * 14.0))) - 0.5;
  float boil = (nA - 0.5) * 0.38 + (nB - 0.5) * 0.32 + (nC - 0.5) * 0.22 + nD * 0.28;
  // Stronger while abstract; quieter as the soft painting resolves.
  col += boil * mix(0.055, 0.028, settle);

  // Fine paper / film grain — stochastic, not a sin×sin diamond weave.
  // Two hash scales keep it dense without locking to a periodic lattice.
  float grain =
      (hash(floor(uv * 560.0 + vec2(t * 11.0, -t * 8.0))) - 0.5) * 0.62
    + (hash(floor(uv * 940.0 + vec2(-t * 17.0, t * 13.0))) - 0.5) * 0.38;
  col += grain * mix(0.028, 0.014, settle);

  // The vignette back to paper relaxes as the canvas fills, so the colour
  // reaches the edges instead of stopping at a pale border.
  vec2 d = abs(uv - 0.5) * 2.0;
  float edge = 1.0 - smoothstep(0.80, 1.0, max(d.x, d.y));
  vec3 ground = mix(paper, col, mix(0.0, 0.72, p));
  col = mix(ground, col, 0.32 + 0.68 * edge);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export type ShimmerMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number };
    uProgress: { value: number };
    uHues: { value: THREE.Vector4 };
  };
};

export function createShimmerMaterial(): ShimmerMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uHues: { value: new THREE.Vector4(...FALLBACK_HUES) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    toneMapped: false,
  }) as ShimmerMaterial;
}

/**
 * Seconds of shimmer time to add for a frame of wall-clock time. Reduced-motion
 * users get a slow bloom instead of drifting paint — still obviously alive, so
 * the canvas never looks stalled, but without the travelling movement. The
 * progress deepening below is unaffected: it is a slow colour change rather
 * than movement, and it is the informative half of the animation.
 */
export function shimmerTimeStep(deltaSeconds: number, reduceMotion: boolean) {
  return deltaSeconds * (reduceMotion ? 0.12 : 1);
}

/**
 * A measured remix call takes about 17.5s, so the curve is tuned to spend most
 * of its visible change inside that window.
 */
const SHIMMER_PROGRESS_TAU_MS = 11_000;

/**
 * Synthetic progress for a generation that started `elapsedMs` ago.
 *
 * Reve's remix endpoint is one blocking request with no streaming and no
 * progress reporting, so there is nothing real to read. An asymptotic curve is
 * what makes modelling it honest: a linear ramp against a guessed duration
 * either saturates early and then sits frozen — looking stalled, the exact
 * opposite of the intent — or crawls. This always keeps deepening slightly and
 * never claims to be finished, whether the call takes 3 seconds or 40.
 *
 * Nothing in the UI pairs it with a percentage or a bar, because it is a
 * reassurance cue rather than a measurement, and implying precision it does not
 * have would be a lie the image could contradict.
 */
export function shimmerProgress(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  return 1 - Math.exp(-elapsedMs / SHIMMER_PROGRESS_TAU_MS);
}
