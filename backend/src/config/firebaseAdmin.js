const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const logger = require('../utils/logger');

/** Directory containing this file: backend/src/config */
const CONFIG_DIR = __dirname;
/** Backend package root (contains firebase-service-account.json, package.json, .env) */
const BACKEND_ROOT = path.resolve(CONFIG_DIR, '..', '..');
/** Monorepo root (parent of backend/) — supports paths like backend/firebase-service-account.json */
const MONOREPO_ROOT = path.resolve(BACKEND_ROOT, '..');

let initialized = false;

/**
 * Resolve a relative credential path without using process.cwd().
 * Tries, in order: backend root, path relative to this module's dir, monorepo root.
 */
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

function parseServiceAccountJson(raw, label) {
  try {
    return JSON.parse(String(raw).trim());
  } catch (err) {
    logger.error(`${label}: invalid JSON — ${err.message}`);
    throw err;
  }
}

function validateServiceAccountShape(parsed, label) {
  if (!parsed.private_key || !parsed.client_email || !parsed.project_id) {
    logger.error(
      `${label}: service account JSON must include private_key, client_email, and project_id`
    );
    return false;
  }
  return true;
}

function loadCredentialFromEnvJson() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw || !String(raw).trim()) return null;

  const parsed = parseServiceAccountJson(raw, 'FIREBASE_SERVICE_ACCOUNT_JSON');
  if (!validateServiceAccountShape(parsed, 'FIREBASE_SERVICE_ACCOUNT_JSON')) return null;

  logger.info('Firebase Admin credential source: FIREBASE_SERVICE_ACCOUNT_JSON (environment)');
  return parsed;
}

function loadCredentialFromPath() {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!envPath || !String(envPath).trim()) return null;

  const { resolved, candidates } = resolveCredentialFilePath(envPath);
  if (!resolved) return null;

  if (!fs.existsSync(resolved)) {
    logger.error(
      `FIREBASE_SERVICE_ACCOUNT_PATH: file not found at resolved path ${resolved}` +
        (candidates.length > 1 ? `. Candidates checked: ${candidates.join('; ')}` : '')
    );
    return null;
  }

  let fileContents;
  try {
    fileContents = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    logger.error(`FIREBASE_SERVICE_ACCOUNT_PATH: failed to read file ${resolved}: ${err.message}`);
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(fileContents);
  } catch (err) {
    logger.error(`FIREBASE_SERVICE_ACCOUNT_PATH: invalid JSON in ${resolved} — ${err.message}`);
    throw err;
  }

  if (!validateServiceAccountShape(parsed, `FIREBASE_SERVICE_ACCOUNT_PATH (${resolved})`)) {
    return null;
  }

  logger.info('Firebase Admin credential source: FIREBASE_SERVICE_ACCOUNT_PATH (file)');
  logger.info(`Firebase Admin resolved service account path: ${resolved}`);
  return parsed;
}

function loadCredentialFromGoogleApplicationCredentials() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw || !String(raw).trim()) return null;

  const { resolved, candidates } = resolveCredentialFilePath(raw);
  if (!resolved) return null;

  if (!fs.existsSync(resolved)) {
    logger.error(
      `GOOGLE_APPLICATION_CREDENTIALS: file not found at resolved path ${resolved}` +
        (candidates.length > 1 ? `. Candidates checked: ${candidates.join('; ')}` : '')
    );
    return null;
  }

  let fileContents;
  try {
    fileContents = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    logger.error(`GOOGLE_APPLICATION_CREDENTIALS: failed to read file ${resolved}: ${err.message}`);
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(fileContents);
  } catch (err) {
    logger.error(`GOOGLE_APPLICATION_CREDENTIALS: invalid JSON in ${resolved} — ${err.message}`);
    throw err;
  }

  if (!validateServiceAccountShape(parsed, `GOOGLE_APPLICATION_CREDENTIALS (${resolved})`)) {
    return null;
  }

  logger.info('Firebase Admin credential source: GOOGLE_APPLICATION_CREDENTIALS (file)');
  logger.info(`Firebase Admin resolved GOOGLE_APPLICATION_CREDENTIALS path: ${resolved}`);
  return parsed;
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
  logger.info(`Firebase Admin initialized successfully (${sourceLabel})`);
  return true;
}

/**
 * Initialize Firebase Admin once (credential resolution does not depend on process.cwd()).
 *
 * Order (production hosts like Render should use 1 — no key file on disk):
 * 1) FIREBASE_SERVICE_ACCOUNT_JSON
 * 2) FIREBASE_SERVICE_ACCOUNT_PATH
 * 3) GOOGLE_APPLICATION_CREDENTIALS (JSON key file)
 *
 * Only calls admin.initializeApp when admin.apps.length === 0.
 */
function initFirebaseAdmin() {
  if (initialized && admin.apps.length > 0) {
    return true;
  }

  if (admin.apps.length > 0) {
    initialized = true;
    return true;
  }

  try {
    const fromEnvJson = loadCredentialFromEnvJson();
    if (fromEnvJson) {
      return initializeWithCredential(fromEnvJson, 'env JSON');
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
      'Firebase Admin not configured — set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or GOOGLE_APPLICATION_CREDENTIALS. Firebase Console → Project settings → Service accounts → Generate new private key.'
    );
    return false;
  } catch (err) {
    logger.error('Firebase Admin initialization failed', { message: err.message });
    throw err;
  }
}

function getFirebaseAuth() {
  const ok = initFirebaseAdmin();
  if (!ok || admin.apps.length === 0) {
    throw new Error('Firebase Admin is not configured');
  }
  return admin.auth();
}

module.exports = { initFirebaseAdmin, getFirebaseAuth };
