import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const provider = new GoogleAuthProvider();
// Request explicit Google Drive and Sheets scopes
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Force Google prompt to consent to scopes
provider.setCustomParameters({
  prompt: 'consent'
});

let cachedAccessToken: string | null = null;

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    // Save token to localStorage to preserve between reloads if desired
    localStorage.setItem('google_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  }
};

export const restoreGoogleToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem('google_access_token');
  }
  return cachedAccessToken;
};

export const clearGoogleToken = () => {
  cachedAccessToken = null;
  localStorage.removeItem('google_access_token');
};

// Operator interface
export interface OperatorUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string; // Plain/Simulated for the sake of secure matching in Firestore or standard storage
  createdAt: string;
}

// Custom Authentication Helpers
export const registerOperator = async (operator: Omit<OperatorUser, 'id' | 'createdAt'>): Promise<string> => {
  try {
    // Check if user already exists
    const q = query(collection(db, 'operators'), where('email', '==', operator.email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error('Operator dengan email tersebut sudah terdaftar.');
    }

    // Add to collection
    const docRef = await addDoc(collection(db, 'operators'), {
      name: operator.name,
      email: operator.email.toLowerCase(),
      role: operator.role,
      passwordHash: operator.passwordHash,
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error: any) {
    console.error('Gagal meregistrasi operator:', error);
    throw error;
  }
};

export const authenticateOperator = async (email: string, passwordHash: string): Promise<OperatorUser | null> => {
  try {
    const q = query(
      collection(db, 'operators'), 
      where('email', '==', email.toLowerCase()), 
      where('passwordHash', '==', passwordHash)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: data.passwordHash,
      createdAt: data.createdAt,
    };
  } catch (error: any) {
    console.error('Gagal otentikasi operator:', error);
    throw error;
  }
};

export const getAllOperators = async (): Promise<OperatorUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'operators'));
    const operators: OperatorUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      operators.push({
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: data.passwordHash,
        createdAt: data.createdAt,
      });
    });
    return operators;
  } catch (error) {
    console.error('Gagal mengambil daftar operator:', error);
    return [];
  }
};

