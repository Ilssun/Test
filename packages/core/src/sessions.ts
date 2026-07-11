import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import { Session, Document as SessionDoc } from "./types";
import { uid } from "./utils";

const SESSIONS = "sessions";

export const listSessions = async (): Promise<Session[]> => {
  const snap = await getDocs(query(collection(db, SESSIONS), orderBy("createdAt")));
  return snap.docs.map((d) => d.data() as Session);
};

export interface SessionFile {
  name: string;
  uri: string;
  blob?: Blob;
}

const uploadSessionDoc = async (sessionId: string, file: SessionFile): Promise<SessionDoc> => {
  const path = `session-docs/${sessionId}-${file.name}`;
  const storageRef = ref(storage, path);
  const blob = file.blob ?? (await (await fetch(file.uri)).blob());
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return { name: file.name, path, url };
};

export interface NewSessionInput {
  name: string;
  desc: string;
  details: string;
  catId: string;
  file?: SessionFile | null;
}

export const addSession = async (input: NewSessionInput, existing: Session[]): Promise<Session> => {
  const n = input.name.trim();
  if (!n) throw new Error("Donne un nom à la séance");
  if (existing.some((s) => s.name.toLowerCase() === n.toLowerCase())) throw new Error("Cette séance existe déjà");
  const id = uid();
  let document: SessionDoc | null = null;
  if (input.file) document = await uploadSessionDoc(id, input.file);
  const session: Session = {
    id,
    name: n,
    desc: input.desc.trim(),
    details: input.details.trim(),
    document,
    catId: input.catId || "",
    createdAt: Date.now(),
  };
  await setDoc(doc(db, SESSIONS, id), session);
  return session;
};

// file: undefined = unchanged, null = remove, object = replace
export const updateSessionDetails = async (
  session: Session,
  details: string,
  file: SessionFile | null | undefined
): Promise<void> => {
  let document = session.document ?? null;
  if (file === null) {
    if (session.document) await deleteObject(ref(storage, session.document.path)).catch(() => {});
    document = null;
  } else if (file) {
    if (session.document) await deleteObject(ref(storage, session.document.path)).catch(() => {});
    document = await uploadSessionDoc(session.id, file);
  }
  await updateDoc(doc(db, SESSIONS, session.id), { details: details.trim(), document });
};

export const moveSession = (id: string, catId: string) => updateDoc(doc(db, SESSIONS, id), { catId });

export const removeSession = async (session: Session) => {
  await deleteDoc(doc(db, SESSIONS, session.id));
  if (session.document) await deleteObject(ref(storage, session.document.path)).catch(() => {});
};

export const bulkImportSessions = async (
  lines: string[],
  catId: string,
  existing: Session[]
): Promise<number> => {
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));
  let added = 0;
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    const name = parts[0];
    if (!name || existingNames.has(name.toLowerCase())) continue;
    existingNames.add(name.toLowerCase());
    const session: Session = {
      id: uid(),
      name,
      desc: parts[1] || "",
      details: parts[2] || "",
      document: null,
      catId: catId || "",
      createdAt: Date.now(),
    };
    await setDoc(doc(db, SESSIONS, session.id), session);
    added++;
  }
  return added;
};
