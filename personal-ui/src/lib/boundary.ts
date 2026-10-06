import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Cause from 'effect/Cause';

// Never attach source data or browser exception messages to boundary diagnostics.
export type BoundaryFailure = { _tag:
  'InvalidData' | 'UnsupportedData' | 'OversizedData' | 'StorageUnavailable' | 'StorageConflict' |
  'ClipboardFailure' | 'NavigationBlocked' | 'SharingUnavailable' | 'SharingFailure' |
  'DownloadFailure' | 'Cancelled' };
export type Outcome<A> = { _tag: 'Success'; value: A } | BoundaryFailure;
export const failure = (_tag: BoundaryFailure['_tag']): BoundaryFailure => ({ _tag });

// These runners are limited to application boundaries. Defects still throw/reject.
export function runBoundarySync<A>(operation: Effect.Effect<A, BoundaryFailure>): Outcome<A> {
  return Effect.runSync(Effect.match(operation, {
    onFailure: error => error,
    onSuccess: value => ({ _tag: 'Success' as const, value }),
  }));
}
export async function runBoundary<A>(operation: Effect.Effect<A, BoundaryFailure>, signal?: AbortSignal): Promise<Outcome<A>> {
  const exit = await Effect.runPromiseExit(Effect.match(operation, {
    onFailure: error => error,
    onSuccess: value => ({ _tag: 'Success' as const, value }),
  }), { signal });
  if (Exit.isSuccess(exit)) return exit.value;
  if (Cause.hasInterruptsOnly(exit.cause)) return failure('Cancelled');
  throw Cause.squash(exit.cause);
}
export function storageOperation<A>(operation: () => A) {
  return Effect.try({ try: operation, catch: () => failure('StorageUnavailable') });
}
