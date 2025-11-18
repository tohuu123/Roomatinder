"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./globals.css";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getProfile } from "@/lib/profileService";

function NavBar() {
  const [profileSlug, setProfileSlug] = useState<string | null>(null);

  // Get user's profile slug for navigation
  useEffect(() => {
    // Set light theme
    document.documentElement.setAttribute("data-theme", "light");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getProfile(user.uid);
        if (profile?.slug) {
          setProfileSlug(profile.slug);
        } else {
          setProfileSlug(null);
        }
      } else {
        setProfileSlug(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="navbar sticky top-0 z-50 bg-base-100 drop-shadow-lg w-full">
      <div className="navbar-start mr-auto">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <Link href="/" className="text-base text-gray-900 font-semibold">
                Home
              </Link>
            </li>
            <li>
              <Link
                href={profileSlug ? `/profile/${profileSlug}` : "/profile"}
                className="text-base text-gray-900 font-semibold"
              >
                Profile
              </Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-gray-900 text-lg">
          Roomatinder
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/" className="text-base text-gray-900 font-semibold">
              Home
            </Link>
          </li>
          <li>
            <Link
              href={profileSlug ? `/profile/${profileSlug}` : "/profile"}
              className="text-base text-gray-900 font-semibold"
            >
              Profile
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Roomatinder</title>
        <meta name="description" content="Roommate Matching App" />
      </head>
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
