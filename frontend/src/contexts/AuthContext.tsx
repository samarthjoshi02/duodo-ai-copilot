import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface UserProfile {
  id: string; // Internal db uuid
  firebase_uid: string;
  name: string;
  email: string;
  photo: string;
  created_at?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Set the default base URL for Axios calls
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const syncUserWithBackend = async (authToken: string, firebaseUser: { uid: string; email: string; displayName: string; photoURL: string }) => {
    try {
      const response = await axios.post('/api/user/sync', {
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photo: firebaseUser.photoURL
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to sync authenticated user with DB:", error);
      // Fallback: build a profile client-side so user doesn't get blocked
      setUser({
        id: firebaseUser.uid,
        firebase_uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Market Investor',
        email: firebaseUser.email || '',
        photo: firebaseUser.photoURL || 'https://lh3.googleusercontent.com/a/default-user',
      });
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setLoading(true);
        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            setToken(idToken);
            await syncUserWithBackend(idToken, {
              uid: fbUser.uid,
              email: fbUser.email || "",
              displayName: fbUser.displayName || "Market Investor",
              photoURL: fbUser.photoURL || "https://lh3.googleusercontent.com/a/default-user"
            });
          } catch (e) {
            console.error("Error retrieving Firebase ID token:", e);
          }
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Offline/Demo Mode Persistent Authentication Check
      const storedToken = localStorage.getItem('duodo_demo_token');
      const storedUser = localStorage.getItem('duodo_demo_user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('duodo_demo_token');
          localStorage.removeItem('duodo_demo_user');
        }
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        setToken(idToken);
        await syncUserWithBackend(idToken, {
          uid: result.user.uid,
          email: result.user.email || "",
          displayName: result.user.displayName || "Market Investor",
          photoURL: result.user.photoURL || "https://lh3.googleusercontent.com/a/default-user"
        });
        toast.success(`Welcome back, ${result.user.displayName || 'Investor'}!`);
      } catch (error: any) {
        console.error("Firebase Sign In Error:", error);
        toast.error(`Login failed: ${error.message}`);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // Simulate Google Sign-In with Demo credentials
      setTimeout(() => {
        const mockUid = "demo_investor_99";
        const mockEmail = "investor@duodo.ai";
        const mockName = "Demo Investor";
        const mockPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";
        
        // Mock token schema matched in backend: demo-token:uid:email:name:photo
        const mockToken = `demo-token:${mockUid}:${mockEmail}:${mockName.replace(/ /g, "-")}:${mockPhoto}`;
        
        const mockProfile: UserProfile = {
          id: "demo-user-uuid-1001",
          firebase_uid: mockUid,
          name: mockName,
          email: mockEmail,
          photo: mockPhoto,
          created_at: new Date().toISOString()
        };

        setToken(mockToken);
        setUser(mockProfile);
        
        localStorage.setItem('duodo_demo_token', mockToken);
        localStorage.setItem('duodo_demo_user', JSON.stringify(mockProfile));
        setLoading(false);
        toast.success(`Welcome to DUODO Demo, ${mockName}!`);
      }, 800);
    }
  };

  const logout = async () => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
        toast.success('Successfully logged out.');
      } catch (e: any) {
        console.error("Error signing out:", e);
        toast.error('Failed to log out.');
      }
    } else {
      localStorage.removeItem('duodo_demo_token');
      localStorage.removeItem('duodo_demo_user');
      toast.success('Logged out of demo mode.');
    }
    setUser(null);
    setToken(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      signInWithGoogle,
      logout,
      isDemoMode: !isFirebaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
