import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseAdminConfig = {
  type: 'service_account',
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: 'https://accounts.google.com/o/oauth2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  authProviderX509CertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
  clientX509CertUrl: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || '')}`,
}

type FirebaseAdminConfig = {
  type: string
  projectId?: string
  privateKeyId?: string
  privateKey?: string
  clientEmail?: string
  clientId?: string
  authUri: string
  tokenUri: string
  authProviderX509CertUrl: string
  clientX509CertUrl: string
}

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert(firebaseAdminConfig as FirebaseAdminConfig),
  })
}

export const adminDb = getFirestore()

/**
 * Returns the Firestore collection name for tasks.
 * Prefixes with "test_" in development to avoid
 * polluting the production collection.
 */
export function tasksCollection() {
  const prefix = process.env.NODE_ENV === 'development' ? 'test_' : ''
  return `${prefix}tasks`
}

/**
 * Returns the Firestore collection name for deletion tombstones.
 * These records track permanent hard deletions so other devices
 * can learn about them during sync.
 */
export function deletionsCollection() {
  const prefix = process.env.NODE_ENV === 'development' ? 'test_' : ''
  return `${prefix}_deletions`
}
