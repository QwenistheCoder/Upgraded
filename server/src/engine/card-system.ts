import { CardType, getTradeBonus } from "@raisk/shared";

export interface Card {
  type: CardType;
  territoryId: string | null; // null = WILD
}

/**
 * Check if a set of 3 cards is a valid trade.
 */
export function isValidTradeSet(hand: Card[]): boolean {
  if (hand.length !== 3) return false;

  const hasWild = hand.some((c) => c.type === "WILD");
  const nonWild = hand.filter((c) => c.type !== "WILD");

  if (hasWild) {
    // Wild + any 2 = always valid
    return true;
  }

  // All three same, or one of each
  if (nonWild.length === 0) return false;

  const types = new Set(nonWild.map((c: Card) => c.type));
  return types.size === 1 || types.size === 3;
}

function isThreeSame(hand: Card[]): boolean {
  const types = hand.map((c) => c.type);
  return new Set(types).size === 1;
}

function isOneOfEach(hand: Card[]): boolean {
  const types = hand.map((c) => c.type);
  return (
    types.includes("INFANTRY") &&
    types.includes("CAVALRY") &&
    types.includes("ARTILLERY")
  );
}

/**
 * Find all valid 3-card trade combinations from the player's hand.
 */
export function findTrades(hand: Card[]): Card[][] {
  const trades: Card[][] = [];
  for (let i = 0; i < hand.length - 2; i++) {
    for (let j = i + 1; j < hand.length - 1; j++) {
      for (let k = j + 1; k < hand.length; k++) {
        const combo = [hand[i], hand[j], hand[k]];
        if (isValidTradeSet(combo)) {
          trades.push(combo);
        }
      }
    }
  }
  return trades;
}

/**
 * Calculate the reinforcement bonus for trading a set of cards.
 */
export function getTradeBonusAmount(cardCount: number): number {
  return getTradeBonus(cardCount);
}
