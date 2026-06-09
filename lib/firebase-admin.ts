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
