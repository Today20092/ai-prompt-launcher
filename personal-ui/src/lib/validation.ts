import * as Schema from 'effect/Schema';
import * as Result from 'effect/Result';

export class DataFailure extends Error {
  constructor(readonly _tag: 'InvalidData' | 'UnsupportedData' | 'OversizedData' = 'InvalidData') {
    super(_tag);
    this.name = 'DataFailure';
  }
}
export function parseJson(raw: string): unknown {
  try { return JSON.parse(raw); }
  catch (error) { if (error instanceof SyntaxError) throw new DataFailure(); throw error; }
}
export function decodeContract<S extends Schema.ConstraintDecoder<unknown>>(schema: S, input: unknown, versioned = false): S['Type'] {
  if (versioned && typeof input === 'object' && input !== null && 'version' in input && input.version !== 1) throw new DataFailure('UnsupportedData');
  const decoded = Schema.decodeUnknownResult(schema)(input);
  if (Result.isFailure(decoded)) throw new DataFailure();
  return decoded.success;
}
