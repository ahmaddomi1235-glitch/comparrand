import type { Medicine, DosageForm } from '../types';
import { templates } from './medicinesBase';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .slice(0, 40);
}

function buildDescription(
  activeIngredient: string,
  form: DosageForm,
  concentration: string,
  indications: string[]
): string {
  return `${activeIngredient} — ${form} ${concentration}. يُستخدم لـ: ${indications.slice(0, 3).join('، ')}.`;
}

export function generateMedicines(): Medicine[] {

  type RawEntry = Medicine & { _ingredient: string };
  const raw: RawEntry[] = [];

  for (const tpl of templates) {
    for (const form of tpl.forms) {
      for (const conc of tpl.concentrations) {
        for (const brand of tpl.brands) {
          const id = slugify(`${brand.name}-${form}-${conc}`);
          const price = parseFloat(
            (tpl.basePrice * brand.priceMultiplier).toFixed(3)
          );
          raw.push({
            _ingredient: tpl.activeIngredient,
            id,
            tradeName: `${brand.name} ${conc}`,
            activeIngredient: tpl.activeIngredient,
            concentration: conc,
            dosageForm: form,
            company: brand.company,
            price,
            category: tpl.category,
            description: buildDescription(
              tpl.activeIngredient,
              form,
              conc,
              tpl.indications
            ),
            indications: tpl.indications,
            warnings: tpl.warnings,
            alternatives: [],
            tags: tpl.tags,
            requiresPrescription: tpl.requiresPrescription,
          });
        }
      }
    }
  }

  const seen = new Set<string>();
  const unique: RawEntry[] = [];
  for (const entry of raw) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      unique.push(entry);
    }
  }

  const byIngredient = new Map<string, string[]>();
  for (const m of unique) {
    const list = byIngredient.get(m._ingredient) ?? [];
    list.push(m.id);
    byIngredient.set(m._ingredient, list);
  }

  const medicines: Medicine[] = unique.map(({ _ingredient, ...m }) => ({
    ...m,
    alternatives: (byIngredient.get(_ingredient) ?? []).filter(
      (altId) => altId !== m.id
    ),
  }));

  return medicines;
}
