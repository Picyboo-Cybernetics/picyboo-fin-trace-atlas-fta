import { z } from 'zod'

export const Regulator = z.object({
  name: z.string(),
  url: z.string().url(),
  scope: z.string().optional(),
  category: z.string().optional(),
})

export const Rule = z.object({
  code: z.string(),
  title: z.string(),
})

export const Scores = z.object({
  apiMaturity: z.number().min(0).max(100).nullable(),
  auditReadiness: z.number().min(0).max(100).nullable(),
  reportingCadence: z.number().min(0).max(100).nullable(),
})

export const CountryRecordSchema = z.object({
  iso3: z.string().length(3),
  country: z.string(),
  regulators: z.array(Regulator),
  rules: z.array(Rule),
  sources: z.array(z.string().url()),
  scores: Scores,
})

export type CountryRecord = z.infer<typeof CountryRecordSchema>
