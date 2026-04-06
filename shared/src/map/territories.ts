export interface TerritoryDef {
  id: string;
  name: string;
  continent: string;
  // SVG polygon points (simplified normalized coordinates 0-1000 x 0-600)
  points: string;
  // Center point for rendering army counts
  center: [number, number];
}

export const TERRITORIES: TerritoryDef[] = [
  // North America
  { id: "alaska", name: "Alaska", continent: "north_america", points: "20,80 60,60 100,80 90,140 40,150", center: [65, 105] },
  { id: "northwest_territory", name: "N.W. Territory", continent: "north_america", points: "100,80 160,50 220,60 210,120 170,140 90,140", center: [158, 100] },
  { id: "greenland", name: "Greenland", continent: "north_america", points: "220,20 320,10 360,40 340,100 260,110 220,60", center: [290, 60] },
  { id: "alberta", name: "Alberta", continent: "north_america", points: "90,140 170,140 180,200 100,210", center: [135, 172] },
  { id: "ontario", name: "Ontario", continent: "north_america", points: "170,140 210,120 260,110 270,170 240,200 180,200", center: [222, 162] },
  { id: "quebec", name: "Quebec", continent: "north_america", points: "260,110 340,100 310,170 270,170", center: [295, 138] },
  { id: "western_us", name: "Western U.S.", continent: "north_america", points: "100,210 180,200 200,270 120,280", center: [150, 240] },
  { id: "eastern_us", name: "Eastern U.S.", continent: "north_america", points: "180,200 240,200 260,260 200,270", center: [220, 232] },
  { id: "central_america", name: "Central America", continent: "north_america", points: "120,280 200,270 220,330 140,340", center: [170, 305] },

  // South America
  { id: "venezuela", name: "Venezuela", continent: "south_america", points: "180,340 240,320 260,370 200,390", center: [220, 355] },
  { id: "peru", name: "Peru", continent: "south_america", points: "180,390 220,380 250,440 200,460", center: [212, 418] },
  { id: "brazil", name: "Brazil", continent: "south_america", points: "240,370 300,360 340,420 280,470 250,440", center: [282, 412] },
  { id: "argentina", name: "Argentina", continent: "south_america", points: "180,460 250,440 280,470 250,540 200,530", center: [232, 488] },

  // Europe
  { id: "iceland", name: "Iceland", continent: "europe", points: "340,60 390,50 400,90 350,100", center: [370, 75] },
  { id: "great_britain", name: "Great Britain", continent: "europe", points: "340,100 400,90 420,140 360,160", center: [380, 122] },
  { id: "northern_europe", name: "N. Europe", continent: "europe", points: "400,140 460,120 480,180 420,190", center: [440, 158] },
  { id: "scandinavia", name: "Scandinavia", continent: "europe", points: "420,50 480,40 520,80 480,130 440,120", center: [468, 84] },
  { id: "eastern_europe", name: "E. Europe", continent: "europe", points: "460,120 540,100 560,160 480,180", center: [510, 140] },
  { id: "western_europe", name: "W. Europe", continent: "europe", points: "360,160 420,190 440,250 370,240", center: [398, 210] },
  { id: "southern_europe", name: "S. Europe", continent: "europe", points: "420,190 480,180 500,240 440,250", center: [460, 215] },

  // Africa
  { id: "north_africa", name: "North Africa", continent: "africa", points: "370,260 460,250 500,320 400,340", center: [432, 292] },
  { id: "egypt", name: "Egypt", continent: "africa", points: "480,240 560,220 580,300 500,310", center: [530, 268] },
  { id: "east_africa", name: "East Africa", continent: "africa", points: "500,310 580,300 600,380 520,400", center: [550, 348] },
  { id: "congo", name: "Congo", continent: "africa", points: "400,340 500,320 520,400 430,420", center: [462, 370] },
  { id: "south_africa", name: "South Africa", continent: "africa", points: "420,420 520,400 500,500 400,480", center: [460, 450] },
  { id: "madagascar", name: "Madagascar", continent: "africa", points: "540,420 580,400 600,480 550,500", center: [568, 450] },

  // Asia
  { id: "ural", name: "Ural", continent: "asia", points: "560,60 640,50 660,120 580,130", center: [610, 90] },
  { id: "siberia", name: "Siberia", continent: "asia", points: "640,50 740,40 760,100 680,120 660,120", center: [696, 82] },
  { id: "yakutsk", name: "Yakutsk", continent: "asia", points: "740,40 840,30 850,90 780,110 760,100", center: [794, 70] },
  { id: "kamchatka", name: "Kamchatka", continent: "asia", points: "840,30 940,50 920,120 860,130 850,90", center: [882, 84] },
  { id: "irkutsk", name: "Irkutsk", continent: "asia", points: "680,120 760,100 780,170 700,180", center: [730, 142] },
  { id: "mongolia", name: "Mongolia", continent: "asia", points: "760,100 850,90 860,130 820,180 780,170", center: [814, 138] },
  { id: "japan", name: "Japan", continent: "asia", points: "860,130 920,110 940,170 880,200", center: [900, 152] },
  { id: "afghanistan", name: "Afghanistan", continent: "asia", points: "560,130 660,120 680,180 580,200", center: [620, 158] },
  { id: "china", name: "China", continent: "asia", points: "680,180 780,170 820,180 800,250 700,260", center: [756, 218] },
  { id: "middle_east", name: "Middle East", continent: "asia", points: "500,240 580,200 620,280 540,310", center: [560, 258] },
  { id: "india", name: "India", continent: "asia", points: "580,280 660,260 680,340 620,360", center: [635, 310] },
  { id: "southeast_asia", name: "SE Asia", continent: "asia", points: "700,260 800,250 810,330 730,340", center: [760, 295] },

  // Australia
  { id: "indonesia", name: "Indonesia", continent: "australia", points: "730,340 810,330 820,400 740,410", center: [775, 370] },
  { id: "new_guinea", name: "New Guinea", continent: "australia", points: "810,330 890,320 910,400 830,410 820,400", center: [852, 372] },
  { id: "western_australia", name: "W. Australia", continent: "australia", points: "740,410 820,400 830,410 810,500 720,490", center: [784, 450] },
  { id: "eastern_australia", name: "E. Australia", continent: "australia", points: "830,410 910,400 930,480 850,500 810,500", center: [866, 450] },
] as const;

export const TERRITORY_IDS = TERRITORIES.map((t) => t.id);
export const TERRITORY_MAP = new Map(TERRITORIES.map((t) => [t.id, t]));
