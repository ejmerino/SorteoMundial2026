export type Confederation = 'AFC' | 'CAF' | 'CONCACAF' | 'CONMEBOL' | 'OFC' | 'UEFA' | 'PLAYOFF_A' | 'PLAYOFF_B';

export type Pot = 1 | 2 | 3 | 4;

export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export interface Team {
  name: string;
  name_en?: string;
  code: string;
  confederation: Confederation;
  pot: Pot;
  positionInGroup?: Pot;
}

export interface Match {
    gameId: number;
    date: string;
    group: Group;
    team1: string | { name: string; position: number };
    team2: string | { name: string; position: number };
    stadium: string;
    city: string;
    time: string;
}
