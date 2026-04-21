import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestore(colName: string, orderField: string = 'name') {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, colName), orderBy(orderField));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [colName, orderField]);

  const add = async (item: any) => {
    await addDoc(collection(db, colName), item);
  };

  const update = async (id: string, item: any) => {
    await updateDoc(doc(db, colName, id), item);
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, colName, id));
  };

  return { data, loading, add, update, remove };
}
