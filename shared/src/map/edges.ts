export interface EdgeDef {
  from: string;
  to: string;
  type: "direct" | "wrap";
}

export const MAP_EDGES: EdgeDef[] = [
  // Wrap connections
  { from: "alaska", to: "kamchatka", type: "wrap" },

  // North America internal
  { from: "greenland", to: "northwest_territory", type: "direct" },
  { from: "greenland", to: "ontario", type: "direct" },
  { from: "greenland", to: "quebec", type: "direct" },
  { from: "greenland", to: "iceland", type: "direct" },
  { from: "alaska", to: "northwest_territory", type: "direct" },
  { from: "alaska", to: "alberta", type: "direct" },
  { from: "northwest_territory", to: "alberta", type: "direct" },
  { from: "northwest_territory", to: "ontario", type: "direct" },
  { from: "alberta", to: "ontario", type: "direct" },
  { from: "alberta", to: "western_us", type: "direct" },
  { from: "ontario", to: "quebec", type: "direct" },
  { from: "ontario", to: "western_us", type: "direct" },
  { from: "ontario", to: "eastern_us", type: "direct" },
  { from: "quebec", to: "eastern_us", type: "direct" },
  { from: "western_us", to: "eastern_us", type: "direct" },
  { from: "western_us", to: "central_america", type: "direct" },
  { from: "eastern_us", to: "central_america", type: "direct" },

  // Europe internal
  { from: "iceland", to: "great_britain", type: "direct" },
  { from: "iceland", to: "scandinavia", type: "direct" },
  { from: "great_britain", to: "scandinavia", type: "direct" },
  { from: "great_britain", to: "northern_europe", type: "direct" },
  { from: "great_britain", to: "western_europe", type: "direct" },
  { from: "western_europe", to: "north_africa", type: "direct" },
  { from: "southern_europe", to: "north_africa", type: "direct" },
  { from: "southern_europe", to: "egypt", type: "direct" },
  { from: "scandinavia", to: "northern_europe", type: "direct" },
  { from: "scandinavia", to: "eastern_europe", type: "direct" },
  { from: "northern_europe", to: "eastern_europe", type: "direct" },
  { from: "northern_europe", to: "southern_europe", type: "direct" },
  { from: "northern_europe", to: "western_europe", type: "direct" },
  { from: "western_europe", to: "southern_europe", type: "direct" },
  { from: "eastern_europe", to: "southern_europe", type: "direct" },
  { from: "eastern_europe", to: "ural", type: "direct" },
  { from: "eastern_europe", to: "afghanistan", type: "direct" },

  // Africa internal
  { from: "north_africa", to: "egypt", type: "direct" },
  { from: "north_africa", to: "east_africa", type: "direct" },
  { from: "north_africa", to: "congo", type: "direct" },
  { from: "egypt", to: "east_africa", type: "direct" },
  { from: "egypt", to: "middle_east", type: "direct" },
  { from: "east_africa", to: "middle_east", type: "direct" },
  { from: "east_africa", to: "madagascar", type: "direct" },
  { from: "east_africa", to: "congo", type: "direct" },
  { from: "east_africa", to: "south_africa", type: "direct" },
  { from: "congo", to: "south_africa", type: "direct" },
  { from: "south_africa", to: "madagascar", type: "direct" },
  { from: "brazil", to: "north_africa", type: "direct" },

  // Asia internal
  { from: "ural", to: "siberia", type: "direct" },
  { from: "ural", to: "china", type: "direct" },
  { from: "ural", to: "afghanistan", type: "direct" },
  { from: "siberia", to: "yakutsk", type: "direct" },
  { from: "siberia", to: "irkutsk", type: "direct" },
  { from: "yakutsk", to: "kamchatka", type: "direct" },
  { from: "yakutsk", to: "irkutsk", type: "direct" },
  { from: "irkutsk", to: "mongolia", type: "direct" },
  { from: "kamchatka", to: "mongolia", type: "direct" },
  { from: "kamchatka", to: "japan", type: "direct" },
  { from: "mongolia", to: "japan", type: "direct" },
  { from: "mongolia", to: "china", type: "direct" },
  { from: "china", to: "india", type: "direct" },
  { from: "china", to: "southeast_asia", type: "direct" },
  { from: "afghanistan", to: "china", type: "direct" },
  { from: "afghanistan", to: "middle_east", type: "direct" },
  { from: "afghanistan", to: "india", type: "direct" },
  { from: "middle_east", to: "india", type: "direct" },
  { from: "india", to: "southeast_asia", type: "direct" },
  { from: "southeast_asia", to: "indonesia", type: "direct" },

  // Australia internal
  { from: "indonesia", to: "new_guinea", type: "direct" },
  { from: "indonesia", to: "western_australia", type: "direct" },
  { from: "indonesia", to: "southeast_asia", type: "direct" },
  { from: "new_guinea", to: "western_australia", type: "direct" },
  { from: "new_guinea", to: "eastern_australia", type: "direct" },
  { from: "western_australia", to: "eastern_australia", type: "direct" },

  // South America internal
  { from: "venezuela", to: "peru", type: "direct" },
  { from: "venezuela", to: "brazil", type: "direct" },
  { from: "venezuela", to: "central_america", type: "direct" },
  { from: "peru", to: "brazil", type: "direct" },
  { from: "peru", to: "argentina", type: "direct" },
  { from: "brazil", to: "argentina", type: "direct" },
];

// Build adjacency map (bidirectional)
export const ADJACENCY = new Map<string, Set<string>>();

for (const edge of MAP_EDGES) {
  if (!ADJACENCY.has(edge.from)) ADJACENCY.set(edge.from, new Set());
  if (!ADJACENCY.has(edge.to)) ADJACENCY.set(edge.to, new Set());
  ADJACENCY.get(edge.from)!.add(edge.to);
  ADJACENCY.get(edge.to)!.add(edge.from);
}

export function getAdjacent(territoryId: string): string[] {
  return Array.from(ADJACENCY.get(territoryId) ?? []);
}

export function isAdjacent(a: string, b: string): boolean {
  return ADJACENCY.get(a)?.has(b) ?? false;
}
