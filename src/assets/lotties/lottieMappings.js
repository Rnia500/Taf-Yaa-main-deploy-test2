export const lottieMappings = {
  treeDataLoader1: 'Big Tree.json',
  treeDataLoader2: 'Animated plant loader..json',
  generalDataLoader: 'Sandy Loading.json',
  loginLoader: 'Fingerprint Verification.json',
  dataNotFound1: 'Not Found.json',
  dataNotFound2: 'No-Data.json',
  treeCreationLoader: 'tree.json',
  treeCreationLoader2: 'Animated plant loader.json',
  signUploader: 'Thank you.json',
  noTreeFoundLoader: 'Brown Leaves.json',
  welcomeLoader:'Welcome.json',
  addPerson:'Add people social.json'
};

// Simple in-memory cache (store raw imported JSON)
const _lottieCache = new Map();

// Vite: lazy import all JSON files in this directory as JSON modules
const _importers = import.meta.glob('./*.json', { as: 'json' });

function cloneData(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  // fallback
  return JSON.parse(JSON.stringify(obj));
}

export const getLottieUrl = (name) => {
  const fileName = lottieMappings[name];
  if (!fileName) {
    console.warn(`No Lottie mapping found for: ${name}`);
    return null;
  }
  try {
    return new URL(`./${fileName}`, import.meta.url).href;
  } catch (err) {
    console.error('Error resolving Lottie file URL:', err);
    return null;
  }
};

// Returns a deep-clone of the cached (or newly imported) JSON so callers get a mutable object
export const getLottieData = async (name) => {
  const fileName = lottieMappings[name];
  if (!fileName) {
    console.warn(`No Lottie mapping found for: ${name}`);
    return null;
  }

  // If cached raw JSON available, return a clone of it
  if (_lottieCache.has(fileName)) {
    return cloneData(_lottieCache.get(fileName));
  }

  const importerKey = `./${fileName}`;
  const importer = _importers[importerKey];
  if (!importer) {
    console.error(`Lottie file not found in assets folder: ${fileName}`);
    return null;
  }

  try {
    const json = await importer();
    // Some bundlers return module with default export
    const raw = json && json.default ? json.default : json;
    // Cache the raw object (do not mutate it)
    _lottieCache.set(fileName, raw);
    // Return a mutable clone
    return cloneData(raw);
  } catch (err) {
    console.error(`Error importing Lottie "${fileName}":`, err);
    return null;
  }
};

// Preload a single animation (store raw import in cache)
export const preloadLottie = async (name) => {
  const fileName = lottieMappings[name];
  if (!fileName) return;
  if (_lottieCache.has(fileName)) return;
  const importerKey = `./${fileName}`;
  const importer = _importers[importerKey];
  if (!importer) return;
  try {
    const json = await importer();
    const raw = json && json.default ? json.default : json;
    _lottieCache.set(fileName, raw);
  } catch (err) {
    console.warn(`preloadLottie failed for ${fileName}`, err);
  }
};

export const preloadAllLotties = async () => {
  const entries = Object.values(lottieMappings);
  await Promise.all(entries.map(async (fileName) => {
    if (_lottieCache.has(fileName)) return;
    const importerKey = `./${fileName}`;
    const importer = _importers[importerKey];
    if (!importer) return;
    try {
      const json = await importer();
      const raw = json && json.default ? json.default : json;
      _lottieCache.set(fileName, raw);
    } catch (err) {
      console.warn(`preloadAllLotties failed for ${fileName}`, err);
    }
  }));
};

export const availableLottieNames = Object.keys(lottieMappings);
