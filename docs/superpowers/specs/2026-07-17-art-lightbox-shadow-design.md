# Art Lightbox Shadow

## Goal

Give images in the `/art` lightbox the same elevated appearance as photos expanded from `/about`, without bringing over the photo borders or white frame.

## Design

Apply the existing `shadow-elevated` utility to the shared image wrapper in `ArtLightbox`. Keep the wrapper's current rounded corners, sizing, clipping, and neutral loading background unchanged. Do not add a border, padding, or an additional background layer.

Because artwork, sketchbook images, and mural images all render through this wrapper, the treatment will apply consistently to every `/art` lightbox image. Applying the shadow to the wrapper also ensures the cached preview and full-resolution image share one stable shadow while loading.

## Verification

- Open artwork, sketchbook, and mural images on `/art`.
- Confirm each expanded image has a light drop shadow.
- Confirm no border or white frame appears.
- Confirm preview-to-full-resolution loading does not duplicate or change the shadow.
