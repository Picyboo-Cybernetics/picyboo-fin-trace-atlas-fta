// src/core/fta/types.ts
import { z } from 'zod';
import { CountryRecordSchema, Regulator as BaseRegulator } from '../../domain/schema';

export const RegulatorSchema = BaseRegulator.extend({
  id: z.string().min(1).optional()
});
export type Regulator = z.infer<typeof RegulatorSchema>;

export const CountryEntrySchema = CountryRecordSchema.extend({
  regulators: z.array(RegulatorSchema)
});
export type CountryEntry = z.infer<typeof CountryEntrySchema>;

export const DatasetSchema = z.array(CountryEntrySchema);
export type Dataset = z.infer<typeof DatasetSchema>;

export const NewsItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  link: z.string().url(),
  published: z.string(),
  countryIso3: z.string().length(3).optional()
});
export type NewsItem = z.infer<typeof NewsItemSchema>;
