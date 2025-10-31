"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../../firebase";
import { useRouter } from "next/navigation";
import db from "../../firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");

    if (password !== confirmation) {
      setError("Confirmation password does not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(getAuth(app), email, password);

      try {
        await setDoc(
          doc(collection(db, "users"), 
          email.split("@")[0]), 
          {
            name: name,
            email: email,
            role: "user",
            permissions: [],
            date_joined: new Date(),
          }
        );
        console.log("New user added with email: ", email);
      } catch (e) {
        setError("An internal error occurred.");
        console.error("Error writing new user to database: ", email);
      }
      
      router.push("/login");
    } catch (e) {
      setTimeout(() => {
        setError((e as Error).message);
      }, 500);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-base-200">
      <div className="w-full bg-base-100 rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-base-content md:text-2xl">Register</h1>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6" action="#">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-base-content">
                Full name
              </label>
              <input type="name" name="name" value={name} onChange={(e) => setName(e.target.value)} id="name" className="bg-base-200 border border-base-300 text-base-content sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Nguyen Van A" required />
            </div>
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-base-content">
                Email address
              </label>
              <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} id="email" className="bg-base-200 border border-base-300 text-base-content sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="example@gmail.com" required />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-base-content">
                Password
              </label>
              <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} id="password" placeholder="••••••••" className="bg-base-200 border border-base-300 text-base-content sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-base-content">
                Confirm password
              </label>
              <input type="password" name="confirm-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} id="confirm-password" placeholder="••••••••" className="bg-base-200 border border-base-300 text-base-content sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" required />
            </div>
            <button type="submit" className="w-full text-primary-content bg-primary transform hover:scale-105 transition duration-200 ease-in-out font-medium rounded-lg text-sm px-5 py-2.5 text-center">
              Create an account
            </button>
            {error && (
              <div className="text-red-700 relative text-sm font-bold" role="alert">
                <span className="block sm:inline">⚠ {error}</span>
              </div>
            )}
            <p className="text-sm font-light text-info-content">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-base-content hover:underline">
                Login here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
