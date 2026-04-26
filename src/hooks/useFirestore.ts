import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestore(colName: string, orderField: string = 'name', docId?: string, limitDocs?: number) {
  const [data, setData] = useState<any[] | any>(docId ? null : []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (docId) {
      const docRef = doc(db, colName, docId);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        setData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null);
        setLoading(false);
      }, (err) => {
        console.error(err);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      let q = query(collection(db, colName), orderBy(orderField, orderField === 'timestamp' ? 'desc' : 'asc'));
      if (limitDocs) {
        q = query(collection(db, colName), orderBy(orderField, orderField === 'timestamp' ? 'desc' : 'asc'), limit(limitDocs));
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setData(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
        setLoading(false);
      }, (err) => {
        console.error(err);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [colName, orderField, docId, limitDocs]);

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
    return await handleCall(async () => {
        const docRef = await addDoc(collection(db, colName), item);
        return docRef.id;
    });
  };

  const update = async (id: string, item: any) => {
    await handleCall(() => updateDoc(doc(db, colName, id), item));
  };

  const remove = async (id: string) => {
    await handleCall(() => deleteDoc(doc(db, colName, id)));
  };

  return { data, loading, add, update, remove };
}
