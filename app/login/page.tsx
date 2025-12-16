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
  User,
} from "firebase/auth";
import { app, auth, googleProvider } from "../../firebase";
import { getProfile, hasCompletedRequiredFields, createProfile } from "@/lib/profileService";
import { GreenHomeBackground } from "@/components/magicui/green-home-background";
import { Icon } from '@iconify/react';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const router = useRouter();

  // Function to check profile completion and redirect accordingly
  const checkProfileAndRedirect = async (user: User) => {
    let profile = await getProfile(user.uid);
    
    // If profile doesn't exist (e.g., Google sign-in first time), create it
    if (!profile) {
      try {
        await createProfile(user.uid, user.email || "", {
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          // Initialize with default/empty required fields
          budgetMin: 0,
          budgetMax: 0,
          sleepSchedule: "flexible",
          cleanlinessLevel: "moderate",
          smokingPolicy: "no-smoking",
          petPolicy: "no-pets",
        });
        profile = await getProfile(user.uid);
      } catch (error) {
        console.error("Error creating profile:", error);
      }
    }
    
    if (!profile || !hasCompletedRequiredFields(profile)) {
      // First time login or incomplete profile - redirect to profile setup
      router.push("/profile");
    } else {
      // Profile complete - redirect to home
      router.push("/");
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Check if user has completed profile
      await checkProfileAndRedirect(credential.user);
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
      await checkProfileAndRedirect(cred.user);
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
    <div className="relative overflow-x-hidden bg-[#4a6b5a]">
      {/* Hero Section with Background */}
      <section className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0">
          <GreenHomeBackground><></></GreenHomeBackground>
        </div>

        {/* Navigation Menu */}
        <div className="relative z-20 pt-6 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <nav className="flex justify-center gap-8 text-[#4a6b5a] font-semibold">
              <a 
                href="#about" 
                className="hover:text-[#6b9b7f] transition-colors duration-200 text-lg drop-shadow-md"
              >
                About
              </a>
              <a 
                href="#features" 
                className="hover:text-[#6b9b7f] transition-colors duration-200 text-lg drop-shadow-md"
              >
                Features
              </a>
              <a 
                href="#team" 
                className="hover:text-[#6b9b7f] transition-colors duration-200 text-lg drop-shadow-md"
              >
                Team
              </a>
              <a 
                href="#contact" 
                className="hover:text-[#6b9b7f] transition-colors duration-200 text-lg drop-shadow-md"
              >
                Contact Us
              </a>
            </nav>
          </div>
        </div>

        {/* Centered Content */}
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 sm:px-8 z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#4a6b5a] mb-8 drop-shadow-2xl leading-tight">
              Finding your best<br />roommates
            </h1>
            
            {/* Sign In Button */}
            <button
              onClick={() => (document.getElementById('signin_modal') as HTMLDialogElement)?.showModal()}
              className="inline-block px-16 py-5 text-2xl font-bold text-[#4a6b5a] rounded-full shadow-2xl hover:scale-105 hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-[#E8FFD7] via-[#d4f5c4] to-[#c0edb0] border-none cursor-pointer"
            >
              Sign In
            </button>
            
            {/* Sign Up Link */}
            <p className="mt-4 text-[#4a6b5a] text-lg font-medium drop-shadow-md">
              <Link 
                href="/register"
                className="hover:underline cursor-pointer"
              >
                Sign up if you do not have an account.
              </Link>
            </p>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <Icon icon="mdi:chevron-down" className="text-5xl text-white drop-shadow-lg" />
          </div>
        </div>
      </section>

      {/* About Section - Scrollable Content */}
      <section id="about" className="relative bg-gradient-to-b from-[#4a6b5a] via-[#6b9b7f] via-[#a0d4a0] to-[#e8f5e1] py-20">
        <div className="container mx-auto px-4">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              About <span className="text-[#e8f5e1]">Roomatinder</span>
            </h2>
            <p className="text-xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              Smart roommate matching application that connects people with similar interests and lifestyles to create the perfect living space.
            </p>
          </div>

          {/* Problem & Solution */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 hover:scale-105 transition-transform duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icon icon="mdi:alert-circle" className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Current Problems</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center p-3 bg-red-50 rounded-xl">
                  <Icon icon="mdi:close-circle" className="text-2xl text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Difficulty finding compatible roommates</span>
                </li>
                <li className="flex items-center p-3 bg-red-50 rounded-xl">
                  <Icon icon="mdi:close-circle" className="text-2xl text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Lack of information about lifestyle and preferences</span>
                </li>
                <li className="flex items-center p-3 bg-red-50 rounded-xl">
                  <Icon icon="mdi:close-circle" className="text-2xl text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Complex and time-consuming search process</span>
                </li>
                <li className="flex items-center p-3 bg-red-50 rounded-xl">
                  <Icon icon="mdi:close-circle" className="text-2xl text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">No compatibility assessment tools available</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 hover:scale-105 transition-transform duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6b9b7f] to-[#4a6b5a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icon icon="mdi:lightbulb" className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Our Solution</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center p-3 bg-green-50 rounded-xl">
                  <Icon icon="mdi:check-circle" className="text-2xl text-[#6b9b7f] mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Smart Tinder-like swipe interface for easy searching</span>
                </li>
                <li className="flex items-center p-3 bg-green-50 rounded-xl">
                  <Icon icon="mdi:check-circle" className="text-2xl text-[#6b9b7f] mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Detailed profiles with lifestyle and preference information</span>
                </li>
                <li className="flex items-center p-3 bg-green-50 rounded-xl">
                  <Icon icon="mdi:check-circle" className="text-2xl text-[#6b9b7f] mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Compatibility-based matching system</span>
                </li>
                <li className="flex items-center p-3 bg-green-50 rounded-xl">
                  <Icon icon="mdi:check-circle" className="text-2xl text-[#6b9b7f] mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Integrated chat feature for easy connection</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Features */}
          <div id="features" className="mb-16">
            <h3 className="text-4xl font-bold text-center text-white mb-12">Key Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Icon icon="mdi:swap-horizontal" className="text-3xl text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Smart Swipe</h4>
                <p className="text-gray-600 text-sm">Swipe right to like, swipe left to pass - simple and intuitive</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6b9b7f] to-[#4a6b5a] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Icon icon="mdi:account-heart" className="text-3xl text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Accurate Matching</h4>
                <p className="text-gray-600 text-sm">Smart algorithms analyze preferences and lifestyle compatibility</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Icon icon="mdi:chat-processing" className="text-3xl text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Integrated Chat</h4>
                <p className="text-gray-600 text-sm">Direct messaging after successful matches</p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Icon icon="mdi:shield-check" className="text-3xl text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">Safe & Secure</h4>
                <p className="text-gray-600 text-sm">Identity verification and personal information protection</p>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-16">
            <h3 className="text-4xl font-bold text-center text-gray-800 mb-8">Technology Stack</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">Frontend</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Icon icon="logos:react" className="text-2xl mr-2" />
                      <span className="text-gray-700">React 18</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon="logos:nextjs-icon" className="text-2xl mr-2" />
                      <span className="text-gray-700">Next.js 14</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon="logos:tailwindcss-icon" className="text-2xl mr-2" />
                      <span className="text-gray-700">TailwindCSS</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon="simple-icons:daisyui" className="text-2xl mr-2" />
                      <span className="text-gray-700">DaisyUI</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">Backend</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Icon icon="logos:firebase" className="text-2xl mr-2" />
                      <span className="text-gray-700">Firebase</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon="logos:google-cloud" className="text-2xl mr-2" />
                      <span className="text-gray-700">Firestore</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon="mdi:api" className="text-2xl mr-2" />
                      <span className="text-gray-700">REST API</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">AI & ML</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Icon icon="simple-icons:openai" className="text-2xl mr-2" />
                      <span className="text-gray-700">OpenAI API</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon="mdi:brain" className="text-2xl mr-2" />
                      <span className="text-gray-700">Matching Algorithm</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Icon icon="mdi:chart-line" className="text-2xl mr-2" />
                      <span className="text-gray-700">Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* Development Team */}
          <div id="team" className="mb-16">
            <h3 className="text-4xl font-bold text-center text-white mb-12">Development Team</h3>
            <div className="bg-gradient-to-r from-[#4a6b5a] to-[#6b9b7f] text-white shadow-2xl rounded-3xl">
              <div className="card-body text-center">
                <div className="mb-6">
                  <Icon icon="mdi:code-tags" className="text-6xl mx-auto mb-4" />
                  <h4 className="text-2xl font-bold mb-2">Team devebugger</h4>
                </div>
                
                <div className="grid md:grid-cols-1 gap-6 text-left">
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h5 className="font-semibold mb-3">Our Goals</h5>
                    <ul className="space-y-2 text-sm">
                      <li>• Solve real-world problems</li>
                      <li>• Apply cutting-edge technology</li>
                      <li>• Create products with social value</li>
                      <li>• Learn and develop skills</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div id="contact" className="mb-16">
            <h3 className="text-4xl font-bold text-center text-white mb-12">Contact Us</h3>
            <p className="text-center text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-12">
              We are always ready to listen to your feedback and support you. Contact the <strong className="text-[#e8f5e1]">devebugger</strong> team through the channels below.
            </p>
            
            {/* Contact Info Cards */}
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#E8FFD7] to-[#b8e6a0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon icon="mdi:email" className="text-2xl text-[#4a6b5a]" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Email</h4>
                    <p className="text-[#6b9b7f] font-semibold mb-2">devebugger@gmail.com</p>
                  </div>
                </div>
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#E8FFD7] to-[#b8e6a0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon icon="mdi:map-marker" className="text-2xl text-[#4a6b5a]" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Address</h4>
                    <p className="text-[#6b9b7f] font-semibold mb-2">Ho Chi Minh City</p>
                    <p className="text-gray-600 text-sm">University of Science - VNU-HCM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Sign In Modal */}
      <dialog id="signin_modal" className="modal">
        <div className="modal-box max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-[#a0d4a0]">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 hover:bg-[#E8FFD7]">✕</button>
          </form>
          
          <h3 className="font-bold text-3xl mb-6 text-[#4a6b5a] text-center">Sign In</h3>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loadingGoogle}
            className="w-full px-6 py-3 rounded-xl border-2 border-[#6b9b7f] text-[#4a6b5a] font-semibold hover:bg-[#E8FFD7] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.732 32.291 29.251 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.69 6.053 29.104 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c10.493 0 19-8.507 19-19 0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.494 16.4 18.879 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C33.69 6.053 29.104 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.818-1.977 13.309-5.191l-6.154-5.208C29.108 35.174 26.671 36 24 36c-5.214 0-9.706-3.726-11.289-8.733l-6.53 5.03C9.479 39.556 16.181 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.018 3.291-3.536 5.988-6.849 7.098l6.154 5.208C36.355 41.038 43 36 43 25c0-1.341-.138-2.651-.389-3.917z"/>
            </svg>
            <span>{loadingGoogle ? "Signing in..." : "Continue with Google"}</span>
          </button>

          <div className="divider text-[#6b9b7f]">or</div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="input input-bordered flex items-center gap-2 border-2 border-[#a0d4a0] focus-within:border-[#6b9b7f] rounded-xl">
              <Icon icon="mdi:email" className="text-[#6b9b7f]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="grow text-[#4a6b5a]"
                required
              />
            </label>

            <label className="input input-bordered flex items-center gap-2 border-2 border-[#a0d4a0] focus-within:border-[#6b9b7f] rounded-xl">
              <Icon icon="mdi:lock" className="text-[#6b9b7f]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="grow text-[#4a6b5a]"
                required
              />
            </label>

            <button 
              type="submit" 
              className="w-full px-8 py-3 text-lg font-bold text-[#4a6b5a] rounded-xl shadow-lg hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#E8FFD7] via-[#d4f5c4] to-[#c0edb0] border-none"
            >
              Sign In
            </button>

            {error && (
              <div className="alert bg-red-50 border-2 border-red-300 text-red-700 rounded-xl">
                <Icon icon="mdi:alert-circle" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-sm text-center text-[#6b9b7f]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#4a6b5a] font-semibold hover:underline">
                Sign up here
              </Link>
            </p>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
