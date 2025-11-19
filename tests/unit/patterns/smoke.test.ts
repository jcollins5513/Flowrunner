import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { patternDefinitionSchema } from '../../../lib/patterns/schema'
import { createPatternFixtureDSL } from '../../../lib/patterns/fixtures'
import { validateDSLAgainstPattern } from '../../../lib/patterns/validator'

const DEFINITIONS_DIR = path.join(process.cwd(), 'lib', 'patterns', 'definitions')
const VARIANTS = [1, 2, 3, 4, 5]

const families = readdirSync(DEFINITIONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

describe('Pattern definitions smoke suite', () => {
  families.forEach((family) => {
    describe(family, () => {
      VARIANTS.forEach((variant) => {
        const filePath = path.join(DEFINITIONS_DIR, family, `variant-${variant}.json`)
        it(`validates variant ${variant}`, () => {
          const fileContents = readFileSync(filePath, 'utf-8')
          const rawPattern = JSON.parse(fileContents)
          const pattern = patternDefinitionSchema.parse(rawPattern)

          expect(pattern.family).toBe(family)
          expect(pattern.variant).toBe(variant)

          const fixtureDSL = createPatternFixtureDSL(pattern.family, pattern.variant)
          const validationResult = validateDSLAgainstPattern(fixtureDSL, pattern)
          expect(validationResult.valid).toBe(true)
        })
      })
    })
  })
})

