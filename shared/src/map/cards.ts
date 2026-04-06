export type CardType = "INFANTRY" | "CAVALRY" | "ARTILLERY" | "WILD";

export const CARD_TYPES: CardType[] = ["INFANTRY", "CAVALRY", "ARTILLERY", "WILD"];

// Trade-in schedule: number of cards traded -> bonus troops
export const TRADE_VALUES: Record<number, number> = {
  3: 4,
  4: 6,
  5: 8,
  6: 10,
  7: 12,
  8: 15,
  9: 18,
  10: 21,
  11: 24,
  12: 27,
  13: 30,
  14: 35,
  15: 40,
};

// After 15 cards, add 5 for each additional trade
export function getTradeBonus(cardCount: number): number {
  if (cardCount in TRADE_VALUES) return TRADE_VALUES[cardCount];
  return 40 + (cardCount - 15) * 5;
}

export const PLAYER_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
];
