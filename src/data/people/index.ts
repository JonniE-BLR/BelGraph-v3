import type { Person } from '@/types';
import { enlightenment } from './enlightenment';
import { history } from './history';
import { literature } from './literature';
import { science } from './science';
import { art } from './art';
import { sport } from './sport';
import { it } from './it';

export const PEOPLE: Person[] = [
  ...enlightenment,
  ...history,
  ...literature,
  ...science,
  ...art,
  ...sport,
  ...it,
];
