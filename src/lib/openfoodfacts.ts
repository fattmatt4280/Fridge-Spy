export type OFFProduct = {
  name?: string;
  brand?: string;
  category?: string;
  image_url?: string;
  barcode: string;
};

export async function lookupBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
    if (!res.ok) return null;
    const json = await res.json() as any;
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    return {
      barcode,
      name: p.product_name || p.generic_name || undefined,
      brand: (p.brands || "").split(",")[0]?.trim() || undefined,
      category: (p.categories || "").split(",").pop()?.trim() || undefined,
      image_url: p.image_front_url || p.image_url || undefined,
    };
  } catch {
    return null;
  }
}

export async function searchByName(query: string): Promise<OFFProduct[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as any;
    return (json.products ?? []).map((p: any) => ({
      barcode: p.code,
      name: p.product_name,
      brand: (p.brands || "").split(",")[0]?.trim() || undefined,
      category: (p.categories || "").split(",").pop()?.trim() || undefined,
      image_url: p.image_front_small_url || p.image_url,
    })).filter((p: OFFProduct) => p.name);
  } catch {
    return [];
  }
}
