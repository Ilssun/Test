import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { Transaction, Receipt } from "./types";
import { uid } from "./utils";

const TRANSACTIONS = "transactions";

export const listTransactions = async (): Promise<Transaction[]> => {
  const snap = await getDocs(query(collection(db, TRANSACTIONS), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => d.data() as Transaction);
};

export const listMyRecentTransactions = async (userId: string, max = 6): Promise<Transaction[]> => {
  const all = await listTransactions();
  return all.filter((t) => t.userId === userId).slice(0, max);
};

export interface NewTransactionInput {
  date: string;
  type: Transaction["type"];
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  amount: number;
  note: string;
  userId: string;
  userName: string;
  groupId: string;
  file?: { name: string; uri: string; blob?: Blob } | null;
}

export const addTransaction = async (input: NewTransactionInput): Promise<Transaction> => {
  if (!(input.amount > 0)) throw new Error("Le montant doit être supérieur à 0");
  const id = uid();
  let receipt: Receipt | null = null;
  if (input.file) {
    const path = `receipts/${id}-${input.file.name}`;
    const storageRef = ref(storage, path);
    const blob = input.file.blob ?? (await (await fetch(input.file.uri)).blob());
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    receipt = { name: input.file.name, path, url };
  }
  const tx: Transaction = {
    id,
    date: input.date,
    type: input.type,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    accountId: input.accountId,
    accountName: input.accountName,
    amount: input.amount,
    note: input.note.trim(),
    receipt,
    userId: input.userId,
    userName: input.userName,
    groupId: input.groupId,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, TRANSACTIONS, id), tx);
  return tx;
};

export const deleteTransaction = async (tx: Transaction) => {
  await deleteDoc(doc(db, TRANSACTIONS, tx.id));
  if (tx.receipt) {
    try {
      await deleteObject(ref(storage, tx.receipt.path));
    } catch {
      // receipt file already gone — ignore
    }
  }
};

export { fsLimit };
