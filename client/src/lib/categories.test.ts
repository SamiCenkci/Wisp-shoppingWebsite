import { describe, it, expect } from "vitest";
import {
  TAXONOMY,
  CATEGORIES,
  CATEGORY_ICONS,
  ATTRIBUTE_LABELS,
  getMain,
  getSubs,
  getProducts,
  getAttributes,
} from "./categories";

describe("taxonomy structure", () => {
  it("exposes every main category name", () => {
    expect(CATEGORIES).toHaveLength(TAXONOMY.length);
    expect(CATEGORIES).toContain("Elektronikk og hvitevarer");
  });

  it("has an icon for every category", () => {
    // A missing icon renders as a blank cell in the nav grid.
    for (const name of CATEGORIES) {
      expect(CATEGORY_ICONS[name], `no icon for "${name}"`).toBeDefined();
    }
  });

  it("has no duplicate main category names", () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });

  it("has no duplicate subcategory names within a category", () => {
    for (const main of TAXONOMY) {
      const names = main.subs.map((s) => s.name);
      expect(new Set(names).size, `duplicate sub in "${main.name}"`).toBe(names.length);
    }
  });
});

describe("getSubs", () => {
  it("returns the subcategories of a known category", () => {
    const subs = getSubs("Elektronikk og hvitevarer").map((s) => s.name);
    expect(subs).toContain("Spill og konsoll");
    expect(subs).toContain("Data");
  });

  it("returns an empty array for an unknown category", () => {
    // Old listings may carry categories that no longer exist.
    expect(getSubs("Torget")).toEqual([]);
    expect(getSubs("")).toEqual([]);
  });
});

describe("getProducts", () => {
  it("returns the products of a known subcategory", () => {
    const products = getProducts("Elektronikk og hvitevarer", "Spill og konsoll").map((p) => p.name);
    expect(products).toEqual(["Spill", "Spillkonsoller", "Tilbehør"]);
  });

  it("returns an empty array when the subcategory has no products", () => {
    expect(getProducts("Elektronikk og hvitevarer", "Personlig pleie")).toEqual([]);
  });

  it("returns an empty array for unknown input", () => {
    expect(getProducts("Nonsens", "Nonsens")).toEqual([]);
    expect(getProducts("Elektronikk og hvitevarer", "Nonsens")).toEqual([]);
  });
});

describe("getAttributes", () => {
  it("returns the product's own attributes when it has them", () => {
    const fields = getAttributes("Elektronikk og hvitevarer", "Spill og konsoll", "Spill");
    expect(fields.map((f) => f.key)).toContain("plattform");
  });

  it("falls back to the subcategory's attributes when the product has none", () => {
    const fields = getAttributes("Elektronikk og hvitevarer", "Personlig pleie", "");
    expect(fields.map((f) => f.key)).toContain("merke");
  });

  it("returns an empty array for unknown input", () => {
    expect(getAttributes("Nonsens", "Nonsens", "Nonsens")).toEqual([]);
    expect(getAttributes("", "", "")).toEqual([]);
  });

  it("gives clothing a size field", () => {
    const fields = getAttributes("Klær, kosmetikk og tilbehør", "Dameklær", "Kjoler");
    expect(fields.map((f) => f.key)).toContain("storrelse");
  });
});

describe("ATTRIBUTE_LABELS", () => {
  it("covers every attribute key used anywhere in the taxonomy", () => {
    // The detail page reads from this map; a gap shows a raw key like "storrelse".
    for (const main of TAXONOMY) {
      for (const sub of main.subs) {
        for (const f of sub.attributes ?? []) {
          expect(ATTRIBUTE_LABELS[f.key], `no label for "${f.key}"`).toBeDefined();
        }
        for (const p of sub.products ?? []) {
          for (const f of p.attributes ?? []) {
            expect(ATTRIBUTE_LABELS[f.key], `no label for "${f.key}"`).toBeDefined();
          }
        }
      }
    }
  });

  it("has no attribute key reused with conflicting labels", () => {
    // "merke" is shared across branches with different option lists — that's fine,
    // but the label must stay consistent or the detail page contradicts the form.
    const seen: Record<string, string> = {};
    for (const main of TAXONOMY) {
      for (const sub of main.subs) {
        const all = [...(sub.attributes ?? []), ...(sub.products ?? []).flatMap((p) => p.attributes ?? [])];
        for (const f of all) {
          if (seen[f.key]) {
            expect(f.label, `"${f.key}" has conflicting labels`).toBe(seen[f.key]);
          } else {
            seen[f.key] = f.label;
          }
        }
      }
    }
  });
});

describe("getMain", () => {
  it("finds a category by name", () => {
    expect(getMain("Møbler og interiør")?.name).toBe("Møbler og interiør");
  });

  it("returns undefined for an unknown name", () => {
    expect(getMain("Torget")).toBeUndefined();
  });
});