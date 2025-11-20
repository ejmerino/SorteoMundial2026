import type { Team } from './types';

// Based on the provided image for the 2026 World Cup draw simulation
export const TEAMS: Team[] = [
  // Pot 1
  { name: 'Mexico', code: 'mx', confederation: 'CONCACAF', pot: 1 },
  { name: 'Canada', code: 'ca', confederation: 'CONCACAF', pot: 1 },
  { name: 'United States', code: 'us', confederation: 'CONCACAF', pot: 1 },
  { name: 'Argentina', code: 'ar', confederation: 'CONMEBOL', pot: 1 },
  { name: 'France', code: 'fr', confederation: 'UEFA', pot: 1 },
  { name: 'Brazil', code: 'br', confederation: 'CONMEBOL', pot: 1 },
  { name: 'England', code: 'gb-eng', confederation: 'UEFA', pot: 1 },
  { name: 'Spain', code: 'es', confederation: 'UEFA', pot: 1 },
  { name: 'Portugal', code: 'pt', confederation: 'UEFA', pot: 1 },
  { name: 'Netherlands', code: 'nl', confederation: 'UEFA', pot: 1 },
  { name: 'Belgium', code: 'be', confederation: 'UEFA', pot: 1 },
  { name: 'Germany', code: 'de', confederation: 'UEFA', pot: 1 },

  // Pot 2
  { name: 'Morocco', code: 'ma', confederation: 'CAF', pot: 2 },
  { name: 'Colombia', code: 'co', confederation: 'CONMEBOL', pot: 2 },
  { name: 'Uruguay', code: 'uy', confederation: 'CONMEBOL', pot: 2 },
  { name: 'Croatia', code: 'hr', confederation: 'UEFA', pot: 2 },
  { name: 'Switzerland', code: 'ch', confederation: 'UEFA', pot: 2 },
  { name: 'Japan', code: 'jp', confederation: 'AFC', pot: 2 },
  { name: 'Senegal', code: 'sn', confederation: 'CAF', pot: 2 },
  { name: 'Iran', code: 'ir', confederation: 'AFC', pot: 2 },
  { name: 'South Korea', code: 'kr', confederation: 'AFC', pot: 2 },
  { name: 'Ecuador', code: 'ec', confederation: 'CONMEBOL', pot: 2 },
  { name: 'Austria', code: 'at', confederation: 'UEFA', pot: 2 },
  { name: 'Australia', code: 'au', confederation: 'AFC', pot: 2 },

  // Pot 3
  { name: 'Norway', code: 'no', confederation: 'UEFA', pot: 3 },
  { name: 'Panama', code: 'pa', confederation: 'CONCACAF', pot: 3 },
  { name: 'Egypt', name_en: 'Egypt', name: 'Egipto', code: 'eg', confederation: 'CAF', pot: 3 },
  { name: 'Algeria', code: 'dz', confederation: 'CAF', pot: 3 },
  { name: 'Scotland', code: 'gb-sct', confederation: 'UEFA', pot: 3 },
  { name: 'Paraguay', code: 'py', confederation: 'CONMEBOL', pot: 3 },
  { name: 'Tunisia', code: 'tn', confederation: 'CAF', pot: 3 },
  { name: 'Ivory Coast', code: 'ci', confederation: 'CAF', pot: 3 },
  { name: 'Uzbekistan', code: 'uz', confederation: 'AFC', pot: 3 },
  { name: 'Qatar', code: 'qa', confederation: 'AFC', pot: 3 },
  { name: 'Saudi Arabia', code: 'sa', confederation: 'AFC', pot: 3 },
  { name: 'South Africa', code: 'za', confederation: 'CAF', pot: 3 },

  // Pot 4
  { name: 'Jordan', code: 'jo', confederation: 'AFC', pot: 4 },
  { name: 'Cape Verde', code: 'cv', confederation: 'CAF', pot: 4 },
  { name: 'Ghana', code: 'gh', confederation: 'CAF', pot: 4 },
  { name: 'Curaçao', code: 'cw', confederation: 'CONCACAF', pot: 4 },
  { name: 'Haiti', code: 'ht', confederation: 'CONCACAF', pot: 4 },
  { name: 'New Zealand', code: 'nz', confederation: 'OFC', pot: 4 },
  { name: 'Inter-Conf. Play-off A', code: 'fifa-a', confederation: 'PLAYOFF_A', pot: 4 },
  { name: 'Inter-Conf. Play-off B', code: 'fifa-b', confederation: 'PLAYOFF_B', pot: 4 },
  { name: 'UEFA Play-off A', code: 'uefa-a', confederation: 'UEFA_PLAYOFF_A', pot: 4 },
  { name: 'UEFA Play-off B', code: 'uefa-b', confederation: 'UEFA_PLAYOFF_B', pot: 4 },
  { name: 'UEFA Play-off C', code: 'uefa-c', confederation: 'UEFA_PLAYOFF_C', pot: 4 },
  { name: 'UEFA Play-off D', code: 'uefa-d', confederation: 'UEFA_PLAYOFF_D', pot: 4 },
];

    