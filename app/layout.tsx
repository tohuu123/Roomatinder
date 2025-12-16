"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import "./globals.css";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getProfile } from "@/lib/profileService";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from '@iconify/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '@/types/profile';

interface MatchNotification {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userSlug?: string;
  createdAt: Date;
  read: boolean;
}

function NavBar() {
  const router = useRouter();
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const previousLikedBy = useRef<Set<string>>(new Set());
  const currentLikedUsers = useRef<Set<string>>(new Set());
  const isFirstSnapshot = useRef<boolean>(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  // Log notification state changes
  useEffect(() => {
    console.log('[Layout] 📊 Notifications state updated. Total:', notifications.length);
    console.log('[Layout] 📊 Current notifications:', notifications);
  }, [notifications]);

  // Force light theme immediately
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Get user's profile slug for navigation and monitor likedBy changes
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log('[Layout] User logged in:', currentUser.uid);
        const profile = await getProfile(currentUser.uid);
        setCurrentUserProfile(profile);
        if (profile?.slug) {
          setProfileSlug(profile.slug);
        } else {
          setProfileSlug(null);
        }
        
        // Initialize with current likedBy and likedUsers
        if (profile) {
          // Load previous likedBy from localStorage
          const storedLikedBy = localStorage.getItem(`likedBy_${currentUser.uid}`);
          const oldLikedBy = storedLikedBy ? JSON.parse(storedLikedBy) : [];
          previousLikedBy.current = new Set(oldLikedBy);
          
          const currentLikedBy = new Set(profile.likedBy || []);
          currentLikedUsers.current = new Set(profile.likedUsers || []);
          isFirstSnapshot.current = true; // Reset for this session
          
          console.log('[Layout] 📊 ========== INITIALIZATION ==========');
          console.log('[Layout] 📊 User ID:', currentUser.uid);
          console.log('[Layout] 📊 Previous likedBy (from localStorage):', Array.from(previousLikedBy.current));
          console.log('[Layout] 📊 Current likedBy:', Array.from(currentLikedBy));
          console.log('[Layout] 📊 Current likedUsers:', Array.from(currentLikedUsers.current));
          console.log('[Layout] 📊 ====================================');
          
          // Check for new likedBy on login
          const newLikedBy = Array.from(currentLikedBy).filter(
            userId => !previousLikedBy.current.has(userId)
          );
          
          console.log('[Layout] 🆕 New likedBy users since last login:', newLikedBy);
          
          if (newLikedBy.length > 0) {
            console.log('[Layout] ⚡ Checking for mutual matches in new likes...');
            const loginNotifications: MatchNotification[] = [];
            
            for (const userId of newLikedBy) {
              console.log('[Layout] 🔍 Checking userId:', userId);
              console.log('[Layout] 🔍 Is in my likedUsers?', currentLikedUsers.current.has(userId));
              console.log('[Layout] 🔍 My likedUsers list:', Array.from(currentLikedUsers.current));
              
              // Check if this is a mutual match (user also liked them)
              if (currentLikedUsers.current.has(userId)) {
                console.log('[Layout] 🎉 ✅ Mutual match found on login:', userId);
                
                const matchedUserProfile = await getProfile(userId);
                if (matchedUserProfile) {
                  loginNotifications.push({
                    id: `match-${userId}-${Date.now()}`,
                    userId: userId,
                    userName: matchedUserProfile.displayName || 'Someone',
                    userPhoto: matchedUserProfile.photoURL,
                    userSlug: matchedUserProfile.slug,
                    createdAt: new Date(),
                    read: false
                  });
                  console.log('[Layout] ✅ Created login notification for:', matchedUserProfile.displayName);
                } else {
                  console.log('[Layout] ⚠️ Could not fetch profile for:', userId);
                }
              } else {
                console.log('[Layout] 👤 New like (not mutual):', userId);
              }
            }
            
            if (loginNotifications.length > 0) {
              console.log('[Layout] 🔔 Adding', loginNotifications.length, 'notifications from login check');
              setNotifications(loginNotifications);
            }
          }
          
          // Save current likedBy to localStorage for next login
          localStorage.setItem(`likedBy_${currentUser.uid}`, JSON.stringify(Array.from(currentLikedBy)));
          console.log('[Layout] 💾 Saved current likedBy to localStorage');
        }
        
        // Subscribe to real-time profile updates to detect new likedBy
        console.log('[Layout] Setting up profile monitoring for:', currentUser.uid);
        const profileRef = doc(db, 'profiles', currentUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            const currentLikedBy = new Set(profileData.likedBy || []);
            const currentLikedUsersSet = new Set(profileData.likedUsers || []);
            
            console.log('[Layout] 🔄 ========== SNAPSHOT RECEIVED ==========');
            console.log('[Layout] 🔄 Is first snapshot?', isFirstSnapshot.current);
            console.log('[Layout] 📬 Current likedBy:', Array.from(currentLikedBy));
            console.log('[Layout] 💚 Current likedUsers:', Array.from(currentLikedUsersSet));
            console.log('[Layout] 📊 Previous likedBy:', Array.from(previousLikedBy.current));
            console.log('[Layout] 🔄 ========================================');
            
            // Update current liked users reference
            currentLikedUsers.current = currentLikedUsersSet;
            
            // Skip first snapshot to avoid processing initial data
            if (isFirstSnapshot.current) {
              console.log('[Layout] ⏭️ Skipping first snapshot (already processed in login check)');
              isFirstSnapshot.current = false;
              previousLikedBy.current = currentLikedBy;
              localStorage.setItem(`likedBy_${currentUser.uid}`, JSON.stringify(Array.from(currentLikedBy)));
              return;
            }
            
            // Check if someone was removed from likedBy (unliked us)
            const removedLikedBy = Array.from(previousLikedBy.current).filter(
              userId => !currentLikedBy.has(userId)
            );
            
            if (removedLikedBy.length > 0) {
              console.log('[Layout] 💔 Users who unliked us:', removedLikedBy);
              // Remove notifications for users who unliked us
              setNotifications(prev => {
                const filtered = prev.filter(n => !removedLikedBy.includes(n.userId));
                console.log('[Layout] 🗑️ Removed', prev.length - filtered.length, 'notifications');
                return filtered;
              });
            }
            
            // Find new people who liked this user
            const newLikedBy = Array.from(currentLikedBy).filter(
              userId => !previousLikedBy.current.has(userId)
            );
            
            console.log('[Layout] 🆕 New likedBy users detected:', newLikedBy);
            
            if (newLikedBy.length > 0) {
              console.log('[Layout] ⚡ Processing', newLikedBy.length, 'new likes in real-time...');
              const newNotifications: MatchNotification[] = [];
              
              for (const userId of newLikedBy) {
                console.log('[Layout] 🔍 [REAL-TIME] Checking user:', userId);
                console.log('[Layout] 🔍 [REAL-TIME] Current user liked them?', currentLikedUsersSet.has(userId));
                console.log('[Layout] 🔍 [REAL-TIME] My likedUsers:', Array.from(currentLikedUsersSet));
                
                // Check if current user also liked this person (mutual match)
                if (currentLikedUsersSet.has(userId)) {
                  console.log('[Layout] 🎉 [REAL-TIME] ✅ MUTUAL MATCH DETECTED:', userId);
                  
                  // Check for duplicate notification
                  const existingNotification = notifications.find(n => n.userId === userId);
                  if (existingNotification) {
                    console.log('[Layout] ⚠️ Notification already exists, skipping');
                    continue;
                  }
                  
                  // Fetch the user's profile to get their info
                  const matchedUserProfile = await getProfile(userId);
                  console.log('[Layout] 📝 Matched user profile:', matchedUserProfile?.displayName);
                  
                  if (matchedUserProfile) {
                    const notification = {
                      id: `match-${userId}-${Date.now()}`,
                      userId: userId,
                      userName: matchedUserProfile.displayName || 'Someone',
                      userPhoto: matchedUserProfile.photoURL,
                      userSlug: matchedUserProfile.slug,
                      createdAt: new Date(),
                      read: false
                    };
                    newNotifications.push(notification);
                    console.log('[Layout] ✅ Created notification:', notification);
                  } else {
                    console.log('[Layout] ⚠️ Could not fetch matched user profile');
                  }
                } else {
                  console.log('[Layout] 👤 New like (not mutual) from:', userId);
                }
              }
              
              if (newNotifications.length > 0) {
                console.log('[Layout] 🔔 Adding', newNotifications.length, 'new match notifications to state');
                setNotifications(prev => {
                  // Filter out duplicates
                  const existingUserIds = new Set(prev.map(n => n.userId));
                  const uniqueNotifications = newNotifications.filter(n => !existingUserIds.has(n.userId));
                  const updated = [...uniqueNotifications, ...prev];
                  console.log('[Layout] 🔔 Updated notifications state:', updated);
                  return updated;
                });
              } else {
                console.log('[Layout] ℹ️ No mutual matches or all duplicates');
              }
            } else {
              console.log('[Layout] ℹ️ No new likedBy users detected');
            }
            
            // Update previous likedBy for next comparison
            previousLikedBy.current = currentLikedBy;
            // Save to localStorage
            localStorage.setItem(`likedBy_${currentUser.uid}`, JSON.stringify(Array.from(currentLikedBy)));
            console.log('[Layout] 💾 Updated localStorage with new likedBy');
          } else {
            console.log('[Layout] ⚠️ Profile document does not exist');
          }
        });
      } else {
        console.log('[Layout] User logged out');
        setProfileSlug(null);
        setNotifications([]);
        previousLikedBy.current = new Set();
        currentLikedUsers.current = new Set();
        isFirstSnapshot.current = true;
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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
            <li>
              <Link href="/chatroom" className="text-base text-gray-900 font-semibold">
                Messages
              </Link>
            </li>
            <li>
              <Link href="/post" className="text-base text-gray-900 font-semibold">
                Posts
              </Link>
            </li>
            <li>
              <Link href="/people" className="text-base text-gray-900 font-semibold">
                People
              </Link>
            </li>
            {user && (
              <li>
                <button
                  onClick={() => {
                    console.log('[Layout] 🔔 Notification button clicked');
                    console.log('[Layout] 🔔 Current notifications:', notifications);
                    console.log('[Layout] 🔔 Total notifications:', notifications.length);
                    console.log('[Layout] 🔔 Unread notifications:', notifications.filter(n => !n.read).length);
                    setShowNotifications(!showNotifications);
                  }}
                  className="text-base text-gray-900 font-semibold flex items-center gap-2"
                >
                  <Icon icon="mdi:bell" className="h-5 w-5" />
                  Notifications
                  {/* Always show count for debugging */}
                  <span className={`badge badge-xs ${notifications.filter(n => !n.read).length > 0 ? 'badge-primary' : 'badge-ghost'}`}>
                    {notifications.length}
                  </span>
                </button>
              </li>
            )}
            <li>
              <Link href="/aboutus" className="text-base text-gray-900 font-semibold">
                About
              </Link>
            </li>
            {!isLoading && !user && (
              <li>
                <Link href="/login" className="text-base text-gray-900 font-semibold">
                  Sign In
                </Link>
              </li>
            )}
            {!isLoading && user && (
              <li>
                <button onClick={handleLogout} className="text-base text-gray-600 font-semibold">
                  Sign Out
                </button>
              </li>
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
          <li>
            <Link href="/chatroom" className="text-base text-gray-900 font-semibold">
              Messages
            </Link>
          </li>
          <li>
            <Link href="/post" className="text-base text-gray-900 font-semibold">
              Posts
            </Link>
          </li>
          <li>
            <Link href="/people" className="text-base text-gray-900 font-semibold">
              People
            </Link>
          </li>
          <li>
            <Link href="/aboutus" className="text-base text-gray-900 font-semibold">
              About
            </Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        {!isLoading && user && (
          <>
          {/* Visibility Toggle Button */}
          <div className="mr-2">
            <button
              className="btn btn-ghost btn-circle"
              onClick={async () => {
                if (!currentUserProfile) return;
                const newVisibility = !(currentUserProfile.isVisible ?? true);
                try {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const { db } = await import('@/firebase');
                  await updateDoc(doc(db, 'profiles', user.uid), {
                    isVisible: newVisibility,
                    updatedAt: new Date()
                  });
                  setCurrentUserProfile({ ...currentUserProfile, isVisible: newVisibility });
                } catch (error) {
                  console.error('Error updating visibility:', error);
                }
              }}
              title={currentUserProfile?.isVisible ?? true ? 'Visible to others' : 'Hidden from others'}
            >
              <Icon 
                icon={currentUserProfile?.isVisible ?? true ? 'mdi:eye' : 'mdi:eye-off'}
                className={`h-6 w-6 ${
                  currentUserProfile?.isVisible ?? true 
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-gray-400 hover:text-gray-500'
                }`}
              />
            </button>
          </div>
          
          {/* Notification Dropdown */}
          <div className="dropdown dropdown-end mr-4">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle"
              onClick={() => {
                console.log('[Layout] 🔔 Desktop bell clicked');
                console.log('[Layout] 🔔 Notifications:', notifications);
                setShowNotifications(!showNotifications);
              }}
            >
              <div className="indicator">
                <Icon 
                  icon="mdi:bell" 
                  className="h-6 w-6 text-gray-700 hover:text-gray-900"
                />
                {/* Show count for debugging - highlight if unread */}
                {notifications.length > 0 && (
                  <span className={`badge badge-sm indicator-item ${
                    notifications.filter(n => !n.read).length > 0 ? 'badge-primary' : 'badge-ghost border border-gray-300'
                  }`}>
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </span>
                )}
              </div>
            </div>
            {showNotifications && (
              <div
                tabIndex={0}
                className="dropdown-content z-50 menu p-2 shadow bg-white rounded-box w-80 border border-gray-200 max-h-96 overflow-y-auto"
              >
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {/* Debug info */}
                  <p className="text-xs text-gray-500 mt-1">Total: {notifications.length} | Unread: {notifications.filter(n => !n.read).length}</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Icon icon="mdi:bell-outline" className="text-4xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                    <p className="text-xs mt-2 opacity-70">Waiting for matches...</p>
                  </div>
                ) : (
                  <ul className="menu p-0">
                    {notifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          className={`flex items-start gap-3 p-3 hover:bg-gray-50 ${
                            !notification.read ? 'bg-[#e8f5e1]' : ''
                          }`}
                          onClick={() => {
                            // Mark as read
                            if (!notification.read) {
                              setNotifications(prev => 
                                prev.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                )
                              );
                            }
                            
                            // Navigate to user profile
                            if (notification.userSlug) {
                              router.push(`/profile/${notification.userSlug}`);
                            } else {
                              router.push(`/profile/${notification.userId}`);
                            }
                            setShowNotifications(false);
                          }}
                        >
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              {notification.userPhoto ? (
                                <Image src={notification.userPhoto} alt={notification.userName} width={40} height={40} className="rounded-full" unoptimized />
                              ) : (
                                <div className="bg-[#a0d4a0] flex items-center justify-center w-full h-full">
                                  <Icon icon="mdi:account" className="text-white text-xl" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900">
                              You matched with {notification.userName}!
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.createdAt.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <Icon icon="mdi:heart" className="text-[#6b9b7f] text-xl" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="p-3 border-t border-gray-200">
                    <button 
                      className="w-full text-center text-sm text-[#6b9b7f] hover:text-[#4a6b5a] font-medium"
                      onClick={() => {
                        setNotifications(prev => 
                          prev.map(n => ({ ...n, read: true }))
                        );
                      }}
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </>
        )}
        {!isLoading && !user && (
          <Link href="/login" className="btn btn-primary btn-sm">
            Sign In
          </Link>
        )}
        {!isLoading && user && (
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm gap-2 text-gray-600 hover:text-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
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
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const hideNavBar = isLoginPage || isRegisterPage;

  return (
    <html lang="en">
      <head>
        <title>Roomatinder</title>
        <meta name="description" content="Roommate Matching App" />
      </head>
      <body>
        {!hideNavBar && <NavBar />}
        {children}
      </body>
    </html>
  );
}
