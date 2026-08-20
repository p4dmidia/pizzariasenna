export interface SizePrice {
  price: number;
  promo_price: number | null;
}

/**
 * Resolves the price and promotional price for a specific size of a pizza product.
 * Supports size_prices configuration (JSONB) or falls back to proportional scaling factors.
 */
export const getPizzaSizePrice = (
  product: {
    price: number | string;
    promo_price?: number | string | null;
    available_sizes?: string | null;
    size_prices?: Record<string, { price: number | string; promo_price?: number | string | null }> | null;
  } | null,
  size: string
): SizePrice => {
  if (!product) return { price: 0, promo_price: null };

  // 1. Check if custom size prices are defined
  if (product.size_prices && typeof product.size_prices === 'object') {
    const sizeData = product.size_prices[size];
    if (sizeData && sizeData.price !== undefined && sizeData.price !== null) {
      return {
        price: Number(sizeData.price),
        promo_price: sizeData.promo_price !== undefined && sizeData.promo_price !== null ? Number(sizeData.promo_price) : null
      };
    }
  }

  // 2. Fallback to proportional scaling factors
  const basePrice = Number(product.price || 0);
  const basePromoPrice = product.promo_price !== undefined && product.promo_price !== null ? Number(product.promo_price) : null;

  let factor = 1.0;
  if (size === 'pequena') factor = 19 / 53;
  else if (size === 'media') factor = 26 / 53;
  else if (size === 'grande') factor = 1.0;
  else if (size === 'familia') factor = 58 / 53;
  else if (size === 'gigante') factor = 61 / 53;

  // Special case: if the product has ONLY one size in available_sizes, and it's this size,
  // do NOT scale it as the main price already represents this size.
  const sizesList = product.available_sizes
    ? product.available_sizes.split(',').map((s: string) => s.trim().toLowerCase())
    : [];
  if (sizesList.length === 1 && sizesList[0] === size) {
    return {
      price: basePrice,
      promo_price: basePromoPrice
    };
  }

  return {
    price: basePrice * factor,
    promo_price: basePromoPrice ? basePromoPrice * factor : null
  };
};

/**
 * Returns the default size for a pizza.
 * Default is 'grande' (if available), otherwise the first available size in the list.
 */
export const getPizzaDefaultSize = (product: { available_sizes?: string | null } | null): string => {
  if (!product || !product.available_sizes) return 'grande';
  const sizes = product.available_sizes.split(',').map((s: string) => s.trim().toLowerCase());
  return sizes.includes('grande') ? 'grande' : (sizes[0] || 'media');
};
