import type { Medicine } from '../types';
import { generateMedicines } from './medicinesGenerator';

export const medicinesData: Medicine[] = generateMedicines();
