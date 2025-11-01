"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { app, auth, googleProvider } from "../../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          await fetch("/api/login", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          router.push("/");
        }
      } catch (e: any) {
        console.error("Google redirect error:", e);
        setError(e?.message ?? "Google sign-in failed.");
      }
    })();
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const credential = await signInWithEmailAndPassword(getAuth(app), email, password);
      const idToken = await credential.user.getIdToken();

      await fetch("/api/login", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      router.push("/");
    } catch (e) {
      console.error("Error logging in: ", e);
      setError("Email or password is invalid.");
    }
  }

  async function handleGoogle() {
    setError("");
    setLoadingGoogle(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      await fetch("/api/login", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      router.push("/");
    } catch (e: any) {
      if (e?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      console.error("Google sign-in error:", e);
      const msg =
        e?.code === "auth/account-exists-with-different-credential"
          ? "This email was registered using another method. Please sign in using the old method and link Google in your account settings."
          : e?.message ?? "Google sign-in failed.";
      setError(msg);
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-base-200">
      <div className="w-full bg-base-100 rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-black md:text-2xl">
            Log in
          </h1>

          {/* google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loadingGoogle}
            className="w-full bg-white dark:bg-white border border-base-300 rounded-lg px-5 py-2.5 font-medium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.99] transition !text-black"
          >
            {/* logo gg */}
            <svg width="18" height="18" viewBox="0 0 48 48" className="-ml-1" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.732 32.291 29.251 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.69 6.053 29.104 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c10.493 0 19-8.507 19-19 0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.494 16.4 18.879 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.69 6.053 29.104 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.818-1.977 13.309-5.191l-6.154-5.208C29.108 35.174 26.671 36 24 36c-5.214 0-9.706-3.726-11.289-8.733l-6.53 5.03C9.479 39.556 16.181 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.018 3.291-3.536 5.988-6.849 7.098l6.154 5.208C36.355 41.038 43 36 43 25c0-1.341-.138-2.651-.389-3.917z"/>
            </svg>
            {loadingGoogle ? "Signing in..." : "Continue with Google"}
          </button>


          <div className="divider my-2 divider-neutral !text-black before:bg-base-300 after:bg-base-300">
            or
          </div>


          { }
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6" action="#">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-black">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                className="bg-base-200 border border-base-300 text-black sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                placeholder="abc@gmail.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-black">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                placeholder="••••••••"
                className="bg-base-200 border border-base-300 text-black sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full text-primary-content bg-primary transform hover:scale-105 transition duration-200 ease-in-out font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Log in
            </button>

            {error && (
              <div className="text-red-700 relative text-sm font-bold" role="alert">
                <span className="block sm:inline">⚠ {error}</span>
              </div>
            )}

            <p className="text-sm font-light text-black/70">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-black hover:underline">
                Register here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
