const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

const CONFIG_DIR = __dirname;
const BACKEND_ROOT = path.resolve(CONFIG_DIR, '..', '..');
const MONOREPO_ROOT = path.resolve(BACKEND_ROOT, '..');

let initialized = false;

function resolveCredentialFilePath(relOrAbs) {
  const trimmed = String(relOrAbs).trim();
  if (!trimmed) return { resolved: null, candidates: [] };

  if (path.isAbsolute(trimmed)) {
    return { resolved: path.normalize(trimmed), candidates: [path.normalize(trimmed)] };
  }

  const candidates = [
    path.normalize(path.resolve(BACKEND_ROOT, trimmed)),
    path.normalize(path.resolve(CONFIG_DIR, trimmed)),
    path.normalize(path.resolve(MONOREPO_ROOT, trimmed)),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { resolved: candidate, candidates };
    }
  }

  return { resolved: path.normalize(path.resolve(BACKEND_ROOT, trimmed)), candidates };
}

/**
 * Parse service account JSON from env; normalize escaped newlines in private_key (common in Render secrets).
 * @param {string} raw
 * @param {string} label
 * @param {{ throwOnError: boolean }} opts
 */
function parseServiceAccountFromString(raw, label, opts = { throwOnError: false }) {
  const throwOnError = opts.throwOnError === true;
  if (!raw || !String(raw).trim()) {
    const msg = `${label} is missing or empty`;
    if (throwOnError) throw new Error(msg);
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(String(raw).trim());
  } catch (err) {
    const msg = `${label} is not valid JSON: ${err.message}`;
    if (throwOnError) throw new Error(msg, { cause: err });
    logger.error(msg);
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const msg = `${label} must be a JSON object`;
    if (throwOnError) throw new Error(msg);
    logger.error(msg);
    return null;
  }

  if (parsed.private_key != null) {
    parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
  }

  if (!parsed.private_key || !parsed.client_email || !parsed.project_id) {
    const msg = `${label} must include private_key, client_email, and project_id`;
    if (throwOnError) throw new Error(msg);
    logger.error(msg);
    return null;
  }

  return parsed;
}

function loadCredentialFromPath() {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!envPath || !String(envPath).trim()) return null;

  const { resolved, candidates } = resolveCredentialFilePath(envPath);
  if (!resolved) return null;

  if (!fs.existsSync(resolved)) {
    logger.error(
      `FIREBASE_SERVICE_ACCOUNT_PATH: file not found at ${resolved}` +
        (candidates.length > 1 ? ` (checked: ${candidates.join('; ')})` : '')
    );
    return null;
  }

  let fileContents;
  try {
    fileContents = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    logger.error(`FIREBASE_SERVICE_ACCOUNT_PATH: read failed: ${err.message}`);
    return null;
  }

  return parseServiceAccountFromString(fileContents, `FIREBASE_SERVICE_ACCOUNT_PATH (${resolved})`, {
    throwOnError: false,
  });
}

function loadCredentialFromGoogleApplicationCredentials() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw || !String(raw).trim()) return null;

  const { resolved, candidates } = resolveCredentialFilePath(raw);
  if (!resolved) return null;

  if (!fs.existsSync(resolved)) {
    logger.error(
      `GOOGLE_APPLICATION_CREDENTIALS: file not found at ${resolved}` +
        (candidates.length > 1 ? ` (checked: ${candidates.join('; ')})` : '')
    );
    return null;
  }

  let fileContents;
  try {
    fileContents = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    logger.error(`GOOGLE_APPLICATION_CREDENTIALS: read failed: ${err.message}`);
    return null;
  }

  return parseServiceAccountFromString(fileContents, `GOOGLE_APPLICATION_CREDENTIALS (${resolved})`, {
    throwOnError: false,
  });
}

function initializeWithCredential(credential, sourceLabel) {
  if (admin.apps.length !== 0) {
    initialized = true;
    logger.debug(`Firebase Admin already initialized; skipping duplicate (${sourceLabel})`);
    return true;
  }

  admin.initializeApp({
    credential: admin.credential.cert(credential),
  });
  initialized = true;
  logger.info(`Firebase Admin initialized (${sourceLabel})`);
  return true;
}

/**
 * Production: only FIREBASE_SERVICE_ACCOUNT_JSON; throws on missing/invalid.
 * Development: JSON env, then file-based credentials; returns false if unset.
 */
function initFirebaseAdmin() {
  if (initialized && admin.apps.length > 0) {
    return true;
  }

  if (admin.apps.length > 0) {
    initialized = true;
    return true;
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const cred = parseServiceAccountFromString(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      'FIREBASE_SERVICE_ACCOUNT_JSON',
      { throwOnError: true }
    );
    logger.info('Firebase Admin credential source: FIREBASE_SERVICE_ACCOUNT_JSON');
    return initializeWithCredential(cred, 'FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  const fromEnv = parseServiceAccountFromString(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    'FIREBASE_SERVICE_ACCOUNT_JSON',
    { throwOnError: false }
  );
  if (fromEnv) {
    logger.info('Firebase Admin credential source: FIREBASE_SERVICE_ACCOUNT_JSON (environment)');
    return initializeWithCredential(fromEnv, 'FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  const fromPath = loadCredentialFromPath();
  if (fromPath) {
    return initializeWithCredential(fromPath, 'FIREBASE_SERVICE_ACCOUNT_PATH');
  }

  const fromGac = loadCredentialFromGoogleApplicationCredentials();
  if (fromGac) {
    return initializeWithCredential(fromGac, 'GOOGLE_APPLICATION_CREDENTIALS');
  }

  logger.warn(
    'Firebase Admin not configured — set FIREBASE_SERVICE_ACCOUNT_JSON or (dev only) PATH / GOOGLE_APPLICATION_CREDENTIALS'
  );
  return false;
}

function getFirebaseAuth() {
  const ok = initFirebaseAdmin();
  if (!ok || admin.apps.length === 0) {
    throw new Error('Firebase Admin is not configured');
  }
  return admin.auth();
}

module.exports = { initFirebaseAdmin, getFirebaseAuth };
