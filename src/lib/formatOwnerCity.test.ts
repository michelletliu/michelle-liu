import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cityAlreadyHasRegion,
  formatOwnerCity,
  labelFromHit,
  normalizeOwnerCityLabel,
  pickGeocodeHit,
  regionFromHit,
  resolveOwnerCityLabel,
  type GeocodeHit,
} from "./formatOwnerCity.ts";

const SARATOGA_HITS: GeocodeHit[] = [
  {
    name: "Saratoga",
    admin1: "California",
    country_code: "US",
    country: "United States",
    timezone: "America/Los_Angeles",
  },
  {
    name: "Saratoga",
    admin1: "Wyoming",
    country_code: "US",
    country: "United States",
    timezone: "America/Denver",
  },
  {
    name: "Saratoga Springs",
    admin1: "New York",
    country_code: "US",
    country: "United States",
    timezone: "America/New_York",
  },
];

describe("cityAlreadyHasRegion", () => {
  it("treats a trailing state as already complete", () => {
    assert.equal(cityAlreadyHasRegion("Saratoga, CA"), true);
    assert.equal(cityAlreadyHasRegion("Los Angeles, CA"), true);
  });

  it("treats a bare city as incomplete", () => {
    assert.equal(cityAlreadyHasRegion("Saratoga"), false);
    assert.equal(cityAlreadyHasRegion(" Los Angeles "), false);
  });
});

describe("formatOwnerCity", () => {
  it("appends a region when the city has none", () => {
    assert.equal(formatOwnerCity("Saratoga", "CA"), "Saratoga, CA");
  });

  it("does not double a region that is already in the city string", () => {
    assert.equal(formatOwnerCity("Saratoga, CA", "CA"), "Saratoga, CA");
  });
});

describe("pickGeocodeHit", () => {
  it("prefers the same city name in the matching timezone", () => {
    const hit = pickGeocodeHit(
      "Saratoga",
      "America/Los_Angeles",
      SARATOGA_HITS,
    );
    assert.equal(hit?.admin1, "California");
  });
});

describe("regionFromHit", () => {
  it("abbreviates US states", () => {
    assert.equal(regionFromHit(SARATOGA_HITS[0]), "CA");
  });

  it("uses the country name outside the US", () => {
    assert.equal(
      regionFromHit({
        name: "Paris",
        admin1: "Île-de-France",
        country_code: "FR",
        country: "France",
        timezone: "Europe/Paris",
      }),
      "France",
    );
  });
});

describe("labelFromHit", () => {
  it("formats Saratoga in Pacific time as CA", () => {
    const hit = pickGeocodeHit(
      "Saratoga",
      "America/Los_Angeles",
      SARATOGA_HITS,
    );
    assert.equal(labelFromHit("Saratoga", hit), "Saratoga, CA");
  });
});

describe("normalizeOwnerCityLabel", () => {
  it("abbreviates a full state name the shortcut might send", () => {
    assert.equal(
      normalizeOwnerCityLabel("Saratoga, California"),
      "Saratoga, CA",
    );
  });

  it("leaves a bare shortcut city alone until geocode", () => {
    assert.equal(normalizeOwnerCityLabel("Saratoga"), "Saratoga");
  });
});

describe("resolveOwnerCityLabel", () => {
  it("skips the network when the city already has a region", async () => {
    const label = await resolveOwnerCityLabel(
      "Saratoga, CA",
      "America/Los_Angeles",
      () => {
        throw new Error("should not fetch");
      },
    );
    assert.equal(label, "Saratoga, CA");
  });

  it("formats a shortcut city-only payload from geocode results", async () => {
    const label = await resolveOwnerCityLabel(
      "Saratoga",
      "America/Los_Angeles",
      async () =>
        new Response(JSON.stringify({ results: SARATOGA_HITS }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    assert.equal(label, "Saratoga, CA");
  });

  it("uses an explicit state when the shortcut sends one", async () => {
    const label = await resolveOwnerCityLabel(
      "Saratoga",
      "America/Los_Angeles",
      () => {
        throw new Error("should not fetch");
      },
      undefined,
      "California",
    );
    assert.equal(label, "Saratoga, CA");
  });
});
