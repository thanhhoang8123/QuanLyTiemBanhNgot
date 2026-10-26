export function getBestPromotionSuggestion(suggestions) {
  return suggestions
    .filter((suggestion) => suggestion.eligible && Number(suggestion.discountAmount) > 0)
    .sort((first, second) => (
      Number(second.discountAmount) - Number(first.discountAmount)
      || Number(first.minOrderValue ?? 0) - Number(second.minOrderValue ?? 0)
    ))[0] ?? null
}
