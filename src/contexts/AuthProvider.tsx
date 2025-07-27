'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  OAuthProvider,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  updatePassword: (password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<boolean>;
  updateProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This function now fetches the user's data from Firestore to check for admin status
const formatUser = async (user: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const isAdmin = userDoc.exists() && userDoc.data()?.isAdmin === true;

    return {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        isAdmin: isAdmin,
        emailVerified: user.emailVerified,
    }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthError = useCallback((error: any) => {
    console.error("Authentication error:", error);
    let message = "An unexpected error occurred.";
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                message = 'Invalid email or password.';
                break;
            case 'auth/email-already-in-use':
                message = 'This email address is already in use.';
                break;
            case 'auth/weak-password':
                message = 'The password is too weak.';
                break;
            case 'auth/permission-denied':
                 message = 'You do not have the necessary permissions.';
                 break;
            case 'auth/too-many-requests':
                message = 'Too many requests. Please try again later.';
                break;
            default:
                message = error.message;
        }
    }
    toast({
      variant: 'destructive',
      title: "Authentication Failed",
      description: message,
    });
  }, [toast]);
  
  // This function now correctly handles new vs existing users to avoid permission errors
  const handleAuthSuccess = useCallback(async (firebaseUser: FirebaseUser, name?: string) => {
    let displayName = name || firebaseUser.displayName;

    if (name && !firebaseUser.displayName) {
        await firebaseUpdateProfile(firebaseUser, { displayName: name });
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    // Only create a new document if one doesn't already exist.
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        name: displayName,
        email: firebaseUser.email,
        createdAt: serverTimestamp(),
        // isAdmin is false by default. It must be set manually in Firestore for security.
        isAdmin: false, 
      });
    }
    
    // Refresh the user state with data from Firestore
    const appUser = await formatUser({ ...firebaseUser, displayName } as FirebaseUser);
    setUser(appUser);
    return appUser;
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await formatUser(firebaseUser);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthSuccess(userCredential.user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const signupWithEmail = async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox (and spam folder) to verify your email address.',
      });
      await handleAuthSuccess(userCredential.user, name);
      router.push('/signup/details');
    } catch (error) {
      handleAuthError(error);
    }
  };
  
  const sendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'No user is signed in.' });
        return;
    }
    try {
        await sendEmailVerification(currentUser);
        toast({
            title: 'Verification Email Sent',
            description: 'Please check your inbox (and spam folder) to verify your email address.',
        });
    } catch (error) {
        handleAuthError(error);
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthSuccess(userCredential.user);
    } catch (error) {
      handleAuthError(error);
    }
  };
  
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/');
     toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  const reauthenticate = async (password: string): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return false;

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    try {
      await reauthenticateWithCredential(currentUser, credential);
      return true;
    } catch (error) {
      console.error("Reauthentication failed:", error);
      return false;
    }
  }

  const updatePassword = async (password: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user is signed in.");
      await firebaseUpdatePassword(currentUser, password);
  }

  const updateProfile = async (profile: { displayName?: string; photoURL?: string }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user is signed in.");
    await firebaseUpdateProfile(currentUser, profile);
    // Refresh the user state
    const updatedUser = await formatUser(auth.currentUser as FirebaseUser);
    setUser(updatedUser);
  };
  
  const sendPasswordResetEmail = async (email: string) => {
    try {
        await firebaseSendPasswordResetEmail(auth, email);
        toast({
            title: "Password Reset Email Sent",
            description: `An email has been sent to ${email} with instructions to reset their password.`,
        });
    } catch (error) {
        handleAuthError(error);
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, signupWithEmail, signInWithGoogle, logout, updatePassword, reauthenticate, updateProfile, sendPasswordResetEmail, sendVerificationEmail }}>
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
