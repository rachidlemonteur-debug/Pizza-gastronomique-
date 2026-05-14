import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signOut, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'driver' | 'editor' | 'viewer';

interface AdminContextProps {
  user: User | null;
  role: AdminRole | null;
  selectedPosId: string | 'ALL';
  setSelectedPosId: (id: string | 'ALL') => void;
  posList: any[];
  loadingAuth: boolean;
  logout: () => void;
  activePOS: any | null; // The POS object currently selected
}

const AdminContext = createContext<AdminContextProps>({} as AdminContextProps);

export const AdminContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [selectedPosId, setSelectedPosId] = useState<string | 'ALL'>('ALL');
  
  const { data: posList } = useFirestore('points_of_sale', 'name');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          const idTokenResult = await getIdTokenResult(u, true);
          
          if (u.email === 'beidoufadimatou1998@gmail.com' || idTokenResult.claims.admin === true) {
            if (!snap.exists() || snap.data().role !== 'super_admin') {
               await setDoc(userRef, { email: u.email, role: 'super_admin' }, { merge: true });
            }
            setRole('super_admin');
          } else if (snap.exists()) {
            setRole(snap.data().role as AdminRole);
            // If manager, auto-select their assigned POS (simplified logic: check if user has assignedPosId)
            if (snap.data().role === 'manager' && snap.data().posId) {
               setSelectedPosId(snap.data().posId);
            }
          } else {
            await setDoc(userRef, { email: u.email, role: 'viewer' });
            setRole('viewer');
          }
        } catch (e) {
          console.error("Failed to load role", e);
          setRole('viewer');
        }
      } else {
        setRole(null);
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const activePOS = selectedPosId === 'ALL' ? null : posList.find((p: any) => p.id === selectedPosId);

  return (
    <AdminContext.Provider value={{
      user, role, loadingAuth, logout,
      selectedPosId, setSelectedPosId,
      posList, activePOS
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
