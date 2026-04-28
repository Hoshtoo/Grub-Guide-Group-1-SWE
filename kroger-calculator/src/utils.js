/**
 * Extract the best available price from a product object.
 * Flask sends a flat { price: 3.99 } — reads that directly.
 * Falls back to nested Kroger raw structure just in case.
 */
export function extractPrice(product) {
  // Flask-simplified structure: product.price is already a number
  if (product?.price !== undefined && product?.price !== null) {
    return product.price
  }
  // Fallback: raw Kroger API structure with nested items[0].price
  const items = product?.items ?? []
  if (!items.length) return null
  const priceInfo = items[0]?.price ?? {}
  const regular   = priceInfo.regular
  const promo     = priceInfo.promo
  if (promo  !== undefined && promo  !== null && promo  > 0) return promo
  if (regular !== undefined && regular !== null && regular > 0) return regular
  return null
}

/**
 * Sort an array of Kroger products cheapest → most expensive.
 * Products with no price are pushed to the end.
 */
export function sortByPrice(products) {
  return [...products].sort((a, b) => {
    const pa = extractPrice(a)
    const pb = extractPrice(b)
    if (pa === null && pb === null) return 0
    if (pa === null) return 1   // no-price → bottom
    if (pb === null) return -1
    return pa - pb              // ascending price
  })
}

/**
 * Format a numeric price as a USD string, e.g. 3.99 → "$3.99"
 */
export function formatPrice(price) {
  if (price === null || price === undefined) return null
  return `$${parseFloat(price).toFixed(2)}`
}

export const DEFAULT_ITEMS = [
  'milk',
  'eggs',
  'bread',
  'chicken',
  'cheese',
  'vegetables',
  'fruit',
]