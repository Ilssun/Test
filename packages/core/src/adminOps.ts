import { getFunctions, httpsCallable } from "firebase/functions";
import app from "./firebase";

// These call Cloud Functions (see /functions) because the client SDK can only
// change the password / delete the account of the currently signed-in user —
// resetting or removing *another* member's account requires the Admin SDK.
const functions = getFunctions(app);

export const adminResetPassword = async (targetUserId: string, newPassword: string) => {
  const fn = httpsCallable(functions, "adminResetPassword");
  await fn({ targetUserId, newPassword });
};

export const adminDeleteUser = async (targetUserId: string) => {
  const fn = httpsCallable(functions, "adminDeleteUser");
  await fn({ targetUserId });
};
