"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getProfile } from "@/lib/profileService";
import { UserProfile } from "@/types/profile";
import { Post, PostCategory, CreatePostData } from "@/types/post";
import {
  getPosts,
  createPost,
  toggleLikePost,
  addComment,
  deletePost,
  incrementPostViews,
} from "@/lib/postService";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { GreenHomeBackground } from "@/components/magicui/green-home-background";

// Helper function to convert name to URL-friendly slug
const nameToSlug = (name: string): string => {
  // Normalize Vietnamese characters to ASCII equivalents
  const vietnameseMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
  };

  let normalized = name.toLowerCase().trim();
  
  // Replace Vietnamese characters
  for (const [viet, ascii] of Object.entries(vietnameseMap)) {
    normalized = normalized.replace(new RegExp(viet, 'g'), ascii);
  }
  
  return normalized
    .replace(/[^a-z0-9\s-]/g, '') // Remove remaining special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export default function PostPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Create post form state
  const [newPost, setNewPost] = useState<CreatePostData>({
    content: "",
    category: "general",
    images: [],
  });

  // Load user and posts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getProfile(user.uid);
        setCurrentUser(profile);
        await loadPosts();
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Reload posts when category filter changes
  useEffect(() => {
    if (currentUser) {
      console.log('[Post Page] Category changed to:', selectedCategory);
      const fetchPosts = async () => {
        setLoading(true);
        const category = selectedCategory === "all" ? undefined : selectedCategory;
        console.log('[Post Page] Fetching with category filter:', category);
        const fetchedPosts = await getPosts(50, category);
        console.log('[Post Page] Received posts:', fetchedPosts.length);
        setPosts(fetchedPosts);
        setLoading(false);
      };
      fetchPosts();
    }
  }, [selectedCategory, currentUser]);

  const loadPosts = async () => {
    setLoading(true);
    const category = selectedCategory === "all" ? undefined : selectedCategory;
    const fetchedPosts = await getPosts(50, category);
    setPosts(fetchedPosts);
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!currentUser || !newPost.content.trim()) {
      return;
    }

    const postId = await createPost(
      currentUser.userId,
      currentUser.displayName || currentUser.nickname || "Anonymous",
      currentUser.photoURL,      currentUser.slug,      newPost
    );

    if (postId) {
      // Reset form
      setNewPost({
        content: "",
        category: "general",
        images: [],
      });
      setShowCreateModal(false);
      // Reload posts
      await loadPosts();
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;

    await toggleLikePost(postId, currentUser.userId);
    // Update local state
    setPosts((prev) =>
      prev.map((post) => {
        if (post.postId === postId) {
          const isLiked = post.likes.includes(currentUser.userId);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter((id) => id !== currentUser.userId)
              : [...post.likes, currentUser.userId],
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser || !commentText.trim()) return;

    const commentId = await addComment(
      postId,
      currentUser.userId,
      currentUser.displayName || currentUser.nickname || "Anonymous",
      currentUser.photoURL,
      currentUser.slug,
      commentText
    );

    if (commentId) {
      setCommentText("");
      // Reload posts to get updated comments
      await loadPosts();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      const success = await deletePost(postId);
      if (success) {
        await loadPosts();
      }
    }
  };

  const handleViewPost = async (postId: string) => {
    await incrementPostViews(postId);
    // Update local state
    setPosts((prev) =>
      prev.map((post) =>
        post.postId === postId ? { ...post, views: post.views + 1 } : post
      )
    );
  };

  const formatDate = (date: Date | any) => {
    // Convert Firestore Timestamp to Date if needed
    let dateObj: Date;
    if (date?.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return 'Just now';
    }

    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  const categories: { value: PostCategory | "all"; label: string; icon: string }[] = [
    { value: "all", label: "All", icon: "mdi:view-grid" },
    { value: "accommodation", label: "Accommodation", icon: "mdi:home" },
    { value: "roommate", label: "Roommate", icon: "mdi:account-group" },
    { value: "general", label: "General", icon: "mdi:forum" },
    { value: "news", label: "News", icon: "mdi:newspaper" },
    { value: "tips", label: "Tips", icon: "mdi:lightbulb" },
  ];

  if (loading) {
    return (
      <GreenHomeBackground>
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </GreenHomeBackground>
    );
  }

  return (
    <GreenHomeBackground>
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-700">Posts</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Icon icon="mdi:plus" className="h-5 w-5" />
            Create Post
          </button>
        </div>

        {/* Category Filter */}
        <div className="tabs tabs-box mb-6 bg-base-100 p-2 rounded-lg shadow">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`tab gap-2 ${
                selectedCategory === cat.value ? "tab-active" : ""
              }`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              <Icon icon={cat.icon} className="h-5 w-5 text-gray-700" />
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="card bg-base-100 shadow-xl p-8 text-center">
              <Icon icon="mdi:post-outline" className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.postId}
                className="card bg-base-100 shadow-xl"
                onClick={() => handleViewPost(post.postId)}
              >
                <div className="card-body">
                  {/* Post Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {post.authorId ? (
                        <Link
                          href={`/profile/${nameToSlug(post.authorName)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-full">
                              {post.authorPhoto ? (
                                <img src={post.authorPhoto} alt={post.authorName} />
                              ) : (
                                <div className="bg-neutral text-neutral-content flex items-center justify-center h-full">
                                  {post.authorName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">{post.authorName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{formatDate(post.createdAt)}</span>
                              <span>•</span>
                              <span className="badge badge-sm">{post.category}</span>
                              {post.source === "internet" && (
                                <>
                                  <span>•</span>
                                  <span className="text-xs">from {post.sourceName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-full">
                              {post.authorPhoto ? (
                                <img src={post.authorPhoto} alt={post.authorName} />
                              ) : (
                                <div className="bg-neutral text-neutral-content flex items-center justify-center h-full">
                                  {post.authorName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">{post.authorName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{formatDate(post.createdAt)}</span>
                              <span>•</span>
                              <span className="badge badge-sm">{post.category}</span>
                              {post.source === "internet" && (
                                <>
                                  <span>•</span>
                                  <span className="text-xs">from {post.sourceName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Delete button (only for own posts) */}
                    {currentUser && post.authorId === currentUser.userId && (
                      <button
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.postId);
                        }}
                      >
                        <Icon icon="mdi:delete" className="h-5 w-5 text-gray-700" />
                      </button>
                    )}
                  </div>

                  {/* Post Title */}
                  {post.title && (
                    <h2 className="card-title mt-2 text-gray-700">{post.title}</h2>
                  )}

                  {/* Post Content */}
                  <p className="whitespace-pre-wrap text-gray-700">{post.content}</p>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          className="rounded-lg w-full h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Post Metadata (for accommodation posts) */}
                  {post.category === "accommodation" && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.districts && post.districts.length > 0 && (
                        <div className="badge badge-outline gap-1">
                          <Icon icon="mdi:map-marker" className="h-4 w-4 text-gray-700" />
                          {post.districts.join(", ")}
                        </div>
                      )}
                      {post.price && (
                        <div className="badge badge-outline gap-1">
                          <Icon icon="mdi:cash" className="h-4 w-4 text-gray-700" />
                          {post.price.toLocaleString()} VND
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="badge badge-ghost">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Engagement Bar */}
                  <div className="card-actions justify-between items-center mt-4 pt-4 border-t">
                    <div className="flex gap-4">
                      <button
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePost(post.postId);
                        }}
                      >
                        <Icon
                          icon={
                            currentUser && post.likes.includes(currentUser.userId)
                              ? "mdi:heart"
                              : "mdi:heart-outline"
                          }
                          className={`h-5 w-5 ${
                            currentUser && post.likes.includes(currentUser.userId)
                              ? "text-red-500"
                              : "text-gray-700"
                          }`}
                        />
                        <span className="text-gray-700">{post.likes.length}</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowComments(
                            showComments === post.postId ? null : post.postId
                          );
                        }}
                      >
                        <Icon icon="mdi:comment-outline" className="h-5 w-5 text-gray-700" />
                        <span className="text-gray-700">{post.comments.length}</span>
                      </button>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Icon icon="mdi:eye" className="h-5 w-5" />
                        <span>{post.views}</span>
                      </div>
                    </div>

                    {/* Source Link */}
                    {post.sourceUrl && (
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon icon="mdi:open-in-new" className="h-4 w-4 text-gray-700" />
                        View Source
                      </a>
                    )}
                  </div>

                  {/* Comments Section */}
                  {showComments === post.postId && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <textarea
                          className="textarea textarea-bordered flex-1 text-gray-700"
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={2}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddComment(post.postId)}
                          disabled={!commentText.trim()}
                        >
                          <Icon icon="mdi:send" className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Comments List */}
                      {post.comments.map((comment) => (
                        <div key={comment.commentId} className="flex gap-3">
                          {comment.authorId ? (
                            <Link
                              href={`/profile/${nameToSlug(comment.authorName)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:opacity-80 transition-opacity"
                            >
                              <div className="avatar">
                                <div className="w-8 h-8 rounded-full">
                                  {comment.authorPhoto ? (
                                    <img
                                      src={comment.authorPhoto}
                                      alt={comment.authorName}
                                    />
                                  ) : (
                                    <div className="bg-neutral text-neutral-content flex items-center justify-center h-full text-sm">
                                      {comment.authorName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full">
                                {comment.authorPhoto ? (
                                  <img
                                    src={comment.authorPhoto}
                                    alt={comment.authorName}
                                  />
                                ) : (
                                  <div className="bg-neutral text-neutral-content flex items-center justify-center h-full text-sm">
                                    {comment.authorName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="bg-base-200 rounded-lg p-3">
                              <p className="font-semibold text-sm text-gray-700">
                                {comment.authorName}
                              </p>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(comment.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4 text-gray-700">Create New Post</h3>

            {/* Category Selection */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                className="select select-bordered text-gray-700"
                value={newPost.category}
                onChange={(e) =>
                  setNewPost({ ...newPost, category: e.target.value as PostCategory })
                }
              >
                <option value="general">General</option>
                <option value="accommodation">Accommodation</option>
                <option value="roommate">Roommate</option>
                <option value="news">News</option>
                <option value="tips">Tips</option>
              </select>
            </div>

            {/* Title (optional) */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Title (optional)</span>
              </label>
              <input
                type="text"
                className="input input-bordered text-gray-700"
                placeholder="Enter post title..."
                value={newPost.title || ""}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>

            {/* Content */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Content</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32 text-gray-700"
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              />
            </div>

            {/* Accommodation specific fields */}
            {newPost.category === "accommodation" && (
              <>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Price (VND)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered text-gray-700"
                    placeholder="e.g., 3000000"
                    value={newPost.price || ""}
                    onChange={(e) =>
                      setNewPost({ ...newPost, price: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Districts (comma separated)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered text-gray-700"
                    placeholder="e.g., District 1, District 3"
                    onChange={(e) =>
                      setNewPost({
                        ...newPost,
                        districts: e.target.value.split(",").map((d) => d.trim()),
                      })
                    }
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Contact Info</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered text-gray-700"
                    placeholder="Phone or email"
                    value={newPost.contactInfo || ""}
                    onChange={(e) =>
                      setNewPost({ ...newPost, contactInfo: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div className="modal-action">
              <button className="btn" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreatePost}
                disabled={!newPost.content.trim()}
              >
                Post
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
        </div>
      )}
    </div>
    </GreenHomeBackground>
  );
}
