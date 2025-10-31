"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-base-200">
      <div className="w-full bg-base-100 rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-base-content md:text-2xl">Log in</h1>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6" action="#">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-base-content">
                Email address
              </label>
              <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} id="email" className="bg-base-200 border border-base-300 text-base-content sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="abc@gmail.com" required />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-base-content">
                Password
              </label>
              <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} id="password" placeholder="••••••••" className="bg-base-200 border border-base-300 text-base-content sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
            </div>
            <button type="submit" className="w-full text-primary-content bg-primary transform hover:scale-105 transition duration-200 ease-in-out font-medium rounded-lg text-sm px-5 py-2.5 text-center">
              Log in
            </button>
            {error && (
              <div className="text-red-700 relative text-sm font-bold" role="alert">
                <span className="block sm:inline">⚠ {error}</span>
              </div>
            )}
            <p className="text-sm font-light text-info-content">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-base-content hover:underline">
                Register here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
