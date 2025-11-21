"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./globals.css";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getProfile } from "@/lib/profileService";
import { useRouter } from "next/navigation";

function NavBar() {
  const router = useRouter();
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's profile slug for navigation
  useEffect(() => {
    // Set light theme
    document.documentElement.setAttribute("data-theme", "light");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getProfile(currentUser.uid);
        if (profile?.slug) {
          setProfileSlug(profile.slug);
        } else {
          setProfileSlug(null);
        }
      } else {
        setProfileSlug(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch("/api/logout");
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
                Trang chủ
              </Link>
            </li>
            <li>
              <Link
                href={profileSlug ? `/profile/${profileSlug}` : "/profile"}
                className="text-base text-gray-900 font-semibold"
              >
                Hồ sơ
              </Link>
            </li>
            <li>
              <Link href="/chatroom" className="text-base text-gray-900 font-semibold">
                Tin nhắn
              </Link>
            </li>
            <li>
              <Link href="/aboutus" className="text-base text-gray-900 font-semibold">
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-base text-gray-900 font-semibold">
                Liên hệ
              </Link>
            </li>
            {!isLoading && (
              <>
                {user ? (
                  <li>
                    <button onClick={handleLogout} className="text-base text-gray-600 font-semibold">
                      Đăng xuất
                    </button>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="text-base text-gray-900 font-semibold">
                        Đăng nhập
                      </Link>
                    </li>
                    <li>
                      <Link href="/register" className="text-base text-gray-900 font-semibold">
                        Đăng ký
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
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
              Trang chủ
            </Link>
          </li>
          <li>
            <Link
              href={profileSlug ? `/profile/${profileSlug}` : "/profile"}
              className="text-base text-gray-900 font-semibold"
            >
              Hồ sơ
            </Link>
          </li>
          <li>
            <Link href="/chatroom" className="text-base text-gray-900 font-semibold">
              Tin nhắn
            </Link>
          </li>
          <li>
            <Link href="/aboutus" className="text-base text-gray-900 font-semibold">
              Giới thiệu
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-base text-gray-900 font-semibold">
              Liên hệ
            </Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        {!isLoading && (
          <>
            {user ? (
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm gap-2 text-gray-600 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Đăng nhập
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Đăng ký
                </Link>
              </div>
            )}
          </>
        )}
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
