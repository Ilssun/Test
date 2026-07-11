import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { LogEntry } from "./types";
import { uid } from "./utils";

const LOGS = "logEntries";

export const listLogEntries = async (): Promise<LogEntry[]> => {
  const snap = await getDocs(query(collection(db, LOGS), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => d.data() as LogEntry);
};

export interface NewLogEntryInput {
  date: string;
  sessionId: string;
  sessionName: string;
  rating?: number;
  comment?: string;
  userId: string;
  userName: string;
  groupId: string;
}

export const addLogEntry = async (input: NewLogEntryInput, existing: LogEntry[]): Promise<LogEntry> => {
  const already = existing.some(
    (e) => e.userId === input.userId && e.date === input.date && e.sessionId === input.sessionId
  );
  if (already) throw new Error("Déjà validée pour ce jour");
  const entry: LogEntry = {
    id: uid(),
    date: input.date,
    sessionId: input.sessionId,
    sessionName: input.sessionName,
    userId: input.userId,
    userName: input.userName,
    groupId: input.groupId,
    createdAt: Date.now(),
  };
  if (input.rating && input.rating > 0) entry.rating = input.rating;
  if (input.comment && input.comment.trim()) entry.comment = input.comment.trim();
  await setDoc(doc(db, LOGS, entry.id), entry);
  return entry;
};

export const deleteLogEntry = (entry: LogEntry) => deleteDoc(doc(db, LOGS, entry.id));
