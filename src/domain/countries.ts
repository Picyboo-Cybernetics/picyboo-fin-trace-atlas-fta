import { loadDataset } from '../core/fta/store'
import type { CountryRecord } from './schema'

/**
 * Convenience loader that fetches the full list of countries using the shared dataset pipeline.
 */
export async function loadCountries(): Promise<CountryRecord[]> {
  return await loadDataset()
}
