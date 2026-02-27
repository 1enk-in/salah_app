import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

    if (!firebaseUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    // 🔐 BLOCK UNVERIFIED USERS
    if (!firebaseUser || !firebaseUser.emailVerified) {
  setUser(null);
  setRole(null);
  setLoading(false);
  return;
}

    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(
        userRef,
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "user",
          photoURL: firebaseUser.photoURL || null,
          role: "user",
          createdAt: serverTimestamp(),
          hasOnboarded: false
        },
        { merge: true }
      );
    }

    const updatedSnap = await getDoc(userRef);
    const userData = updatedSnap.data();

    setUser({
      ...firebaseUser,
      hasOnboarded: userData?.hasOnboarded ?? false
    });

    setRole(userData?.role);
    setLoading(false);

  });

  return () => unsubscribe();
}, []);

  async function logout() {
    localStorage.removeItem("cpa_active_mcq");
    await signOut(auth);
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
  value={{
    user,
    setUser,
    role,
    loading,
    logout
  }}
>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
