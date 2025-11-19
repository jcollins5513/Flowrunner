import { describe, expect, it } from 'vitest'
import { IntentInterpreter } from '@/lib/ai/intent/interpreter'
import { MockIntentProvider } from '@/lib/ai/intent/providers/mock'
import recordings from '@/tests/fixtures/ai/intent/recordings.json'

describe('IntentInterpreter recordings', () => {
  recordings.forEach((recording) => {
    it(`replays recording ${recording.providerResult.metadata?.recordingId ?? recording.prompt}`, async () => {
      const provider = new MockIntentProvider({ fixedResponse: recording.providerResult })
      const interpreter = new IntentInterpreter(provider)

      const intent = await interpreter.interpret(recording.prompt)

      expect(intent.domain).toBe(recording.providerResult.domain)
      expect(intent.styleCues).toEqual(recording.providerResult.styleCues)
      expect(intent.visualTheme).toBe(recording.providerResult.visualTheme)
      expect(intent.tone).toBe(recording.providerResult.tone)
      expect(intent.colorMood).toBe(recording.providerResult.colorMood)
      expect(intent.normalizedPrompt).toBe(recording.normalizedPrompt)
      expect(intent.metadata.recordingId).toBe(recording.providerResult.metadata?.recordingId)
    })
  })
})
