export type Confederation = 'AFC' | 'CAF' | 'CONCACAF' | 'CONMEBOL' | 'OFC' | 'UEFA' | 'PLAYOFF_A' | 'PLAYOFF_B';

export type Pot = 1 | 2 | 3 | 4;

export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export interface Team {
  name: string;
  code: string;
  confederation: Confederation;
  pot: Pot;
  positionInGroup?: Pot;
}
