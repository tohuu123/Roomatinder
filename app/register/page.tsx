"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { app, auth, googleProvider } from "../../firebase";
import { useRouter } from "next/navigation";
import { createProfile, getProfile, hasCompletedRequiredFields } from "@/lib/profileService";
import { GreenHomeBackground } from "@/components/magicui/green-home-background";
import { Icon } from '@iconify/react';

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const router = useRouter();

  // Check profile completion and redirect
  const checkProfileAndRedirect = async (user: any) => {
    let profile = await getProfile(user.uid);
    
    if (!profile) {
      try {
        await createProfile(user.uid, user.email || "", {
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
        });
        profile = await getProfile(user.uid);
      } catch (error) {
        console.error("Error creating profile:", error);
      }
    }
    
    if (!profile || !hasCompletedRequiredFields(profile)) {
      router.push("/profile");
    } else {
      router.push("/");
    }
  };

  // Handle Google redirect result
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          await fetch("/api/login", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          await checkProfileAndRedirect(result.user);
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

    if (password !== confirmation) {
      setError("Confirmation password does not match.");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(getAuth(app), email, password);
      const user = credential.user;

      try {
        // Create a basic profile with minimal data
        await createProfile(user.uid, email, {
          displayName: name,
          photoURL: user.photoURL || undefined,
        });
        console.log("New user profile created with email: ", email);
      } catch (e) {
        setError("An internal error occurred while creating profile.");
        console.error("Error creating user profile: ", e);
        return;
      }
      
      // Sign out the user after registration so they need to sign in
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      setTimeout(() => {
        setError((e as Error).message);
      }, 500);
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
      await checkProfileAndRedirect(cred.user);
    } catch (e: any) {
      if (e?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      console.error("Google sign-in error:", e);
      const msg =
        e?.code === "auth/account-exists-with-different-credential"
          ? "This email was registered using another method. Please sign in using the old method."
          : e?.message ?? "Google sign-in failed.";
      setError(msg);
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="relative overflow-x-hidden">
      {/* Hero Section with Background */}
      <section className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0">
          <GreenHomeBackground><></></GreenHomeBackground>
        </div>

        {/* Centered Content */}
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 sm:px-8 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full">
            <h1 className="text-3xl font-bold text-center text-[#4a6b5a] mb-8">Create Account</h1>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loadingGoogle}
              className="btn btn-outline w-full mb-4 hover:scale-105 transition-transform"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.732 32.291 29.251 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.69 6.053 29.104 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c10.493 0 19-8.507 19-19 0-1.341-.138-2.651-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.494 16.4 18.879 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.69 6.053 29.104 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.818-1.977 13.309-5.191l-6.154-5.208C29.108 35.174 26.671 36 24 36c-5.214 0-9.706-3.726-11.289-8.733l-6.53 5.03C9.479 39.556 16.181 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.018 3.291-3.536 5.988-6.849 7.098l6.154 5.208C36.355 41.038 43 36 43 25c0-1.341-.138-2.651-.389-3.917z"/>
              </svg>
              {loadingGoogle ? "Signing in..." : "Continue with Google"}
            </button>

            <div className="divider">or</div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="input input-bordered flex items-center gap-2">
                <Icon icon="mdi:account" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="grow"
                  required
                />
              </label>

              <label className="input input-bordered flex items-center gap-2">
                <Icon icon="mdi:email" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="grow"
                  required
                />
              </label>

              <label className="input input-bordered flex items-center gap-2">
                <Icon icon="mdi:lock" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="grow"
                  required
                />
              </label>

              <label className="input input-bordered flex items-center gap-2">
                <Icon icon="mdi:lock-check" />
                <input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Confirm Password"
                  className="grow"
                  required
                />
              </label>

              <button 
                type="submit" 
                className="w-full px-8 py-3 text-lg font-bold text-[#4a6b5a] rounded-full shadow-lg hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#E8FFD7] via-[#d4f5c4] to-[#c0edb0] border-none"
              >
                Sign Up
              </button>

              {error && (
                <div className="alert alert-error">
                  <Icon icon="mdi:alert-circle" />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-[#4a6b5a] font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
