import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  UserCredential,
} from "firebase/auth";
import { auth, db, googleProvider } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

async function ensureUserProfile(user: UserCredential["user"]) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      provider: user.providerData?.[0]?.providerId ?? "google",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      ref,
      { updatedAt: serverTimestamp(), photoURL: user.photoURL ?? "" },
      { merge: true }
    );
  }
}

export async function signInWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(cred.user);
    return cred;
  } catch (err: any) {
    if (err?.name === "FirebaseError" && err?.code === "auth/popup-blocked") {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    if (err?.code === "auth/account-exists-with-different-credential") {
      const email = err.customData?.email as string | undefined;
      const pendingCred = GoogleAuthProvider.credentialFromError(err);

      if (email && pendingCred) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes(EmailAuthProvider.PROVIDER_ID)) {
          const password = prompt("This account was registered with email/password. Enter password to link Google:");
          if (!password) throw err;
          const emailCred = await signInWithEmailAndPassword(auth, email, password);
          await linkWithCredential(emailCred.user, pendingCred);
          await ensureUserProfile(emailCred.user);
          return emailCred;
        }
      }
    }
    throw err;
  }
}

export async function handleRedirectResult() {
  const result = await getRedirectResult(auth);
  if (result?.user) {
    await ensureUserProfile(result.user);
    return result;
  }
  return null;
}
