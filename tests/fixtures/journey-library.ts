import { libraryKey, readLocalLibrary } from '../../src/features/journeys/storage';

export function savedJourney() {
  const library = readLocalLibrary(libraryKey(location));
  return library.items.find((item) => item.id === library.active) ?? library.items[0];
}
