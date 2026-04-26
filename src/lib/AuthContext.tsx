import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, getDocFromServer, onSnapshot, addDoc, collection } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { handleFirestoreError } from './errorHandler';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    // CRITICAL: Validate Connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Cleanup previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      setUser(user);
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Log access
        addDoc(collection(db, `users/${user.uid}/accessLogs`), {
          action: 'Authorized Session Established',
          type: 'login',
          source: 'Neural Auth 3.0',
          timestamp: serverTimestamp()
        }).catch(e => console.warn("Failed to log access:", e));

        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            const newProfile = {
              displayName: user.displayName || 'Anonymous User',
              email: user.email || 'no-email@prince-star.ai',
              conversationsCount: 0,
              progress: 0,
              totalBadges: 0,
              badges: ['Early Adopter'],
              lastActive: serverTimestamp(),
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile).catch(e => handleFirestoreError(e, 'create', `users/${user.uid}`));
          }

          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data());
            }
          }, (err) => {
            handleFirestoreError(err, 'get', `users/${user.uid}`);
          });
        } catch (err) {
          console.error("Auth initialization error:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('Auth popup closed or overlapping request.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      } else {
        console.error('Login error:', error);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { ...data, lastActive: serverTimestamp() }, { merge: true })
      .catch(e => handleFirestoreError(e, 'update', `users/${user.uid}`));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signingIn, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
