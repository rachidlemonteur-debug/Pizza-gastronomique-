import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestore(colName: string, orderField: string = 'name') {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, colName), orderBy(orderField));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [colName, orderField]);

  const handleCall = async (fn: () => Promise<any>) => {
    try {
      return await fn();
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('permission')) {
        alert("Action refusée : Vous n'avez pas la permission de faire ça. Connectez-vous avec un compte Administrateur.");
      } else {
        alert("Une erreur est survenue : " + (err.message || 'Erreur inconnue'));
      }
      console.error(err);
      throw err;
    }
  };

  const add = async (item: any) => {
    await handleCall(() => addDoc(collection(db, colName), item));
  };

  const update = async (id: string, item: any) => {
    await handleCall(() => updateDoc(doc(db, colName, id), item));
  };

  const remove = async (id: string) => {
    await handleCall(() => deleteDoc(doc(db, colName, id)));
  };

  return { data, loading, add, update, remove };
}
