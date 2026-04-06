export interface ContinentDef {
  id: string;
  name: string;
  bonus: number;
  territories: string[];
}

export const CONTINENTS: ContinentDef[] = [
  { id: "north_america", name: "North America", bonus: 5, territories: ["alaska", "northwest_territory", "greenland", "alberta", "ontario", "quebec", "western_us", "eastern_us", "central_america"] },
  { id: "south_america", name: "South America", bonus: 2, territories: ["venezuela", "peru", "brazil", "argentina"] },
  { id: "europe", name: "Europe", bonus: 5, territories: ["iceland", "great_britain", "northern_europe", "scandinavia", "eastern_europe", "western_europe", "southern_europe"] },
  { id: "africa", name: "Africa", bonus: 3, territories: ["north_africa", "egypt", "east_africa", "congo", "south_africa", "madagascar"] },
  { id: "asia", name: "Asia", bonus: 7, territories: ["ural", "siberia", "yakutsk", "kamchatka", "irkutsk", "mongolia", "japan", "afghanistan", "china", "middle_east", "india", "southeast_asia"] },
  { id: "australia", name: "Australia", bonus: 2, territories: ["indonesia", "new_guinea", "western_australia", "eastern_australia"] },
];

export const CONTINENT_MAP = new Map(CONTINENTS.map((c) => [c.id, c]));
export const CONTINENT_BONUS = new Map(CONTINENTS.map((c) => [c.id, c.bonus]));
