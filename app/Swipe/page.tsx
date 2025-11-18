"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";

interface UserProfile {
  id: number;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  image: string;
  budget: string;
  cleanlinessLevel: string;
}

// Mock data - trong thực tế sẽ fetch từ database
const mockProfiles: UserProfile[] = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    age: 22,
    location: "Quận 1, TP.HCM",
    bio: "Sinh viên IT, thích sạch sẽ, không hút thuốc. Tìm bạn cùng phòng để share chi phí ở gần trường.",
    interests: ["Coding", "Gaming", "Movies", "Coffee"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
    budget: "3-5 triệu/tháng",
    cleanlinessLevel: "Rất sạch sẽ"
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    age: 24,
    location: "Quận 3, TP.HCM",
    bio: "Nhân viên marketing, thích nấu ăn và tập yoga. Tìm bạn nữ cùng phòng, không nuôi thú cưng.",
    interests: ["Yoga", "Cooking", "Reading", "Travel"],
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b167?w=400&h=600&fit=crop&crop=face",
    budget: "4-6 triệu/tháng",
    cleanlinessLevel: "Sạch sẽ"
  },
  {
    id: 3,
    name: "Lê Minh Cường",
    age: 26,
    location: "Quận 7, TP.HCM",
    bio: "Kỹ sư phần mềm, làm việc remote. Thích không gian yên tĩnh để làm việc, có thể chia sẻ wifi tốc độ cao.",
    interests: ["Technology", "Music", "Fitness", "Photography"],
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
    budget: "5-8 triệu/tháng",
    cleanlinessLevel: "Bình thường"
  },
  {
    id: 4,
    name: "Phạm Thu Hương",
    age: 23,
    location: "Quận 2, TP.HCM",
    bio: "Designer freelance, thích trang trí nhà cửa. Tìm bạn cùng sở thích để tạo không gian sống đẹp.",
    interests: ["Design", "Art", "Plants", "Decoration"],
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
    budget: "3-5 triệu/tháng",
    cleanlinessLevel: "Rất sạch sẽ"
  },
  {
    id: 5,
    name: "Hoàng Minh Tuấn",
    age: 25,
    location: "Quận 5, TP.HCM",
    bio: "Bác sĩ nội trú, làm việc ca đêm thường xuyên. Tìm bạn hiểu biết về lịch làm việc không đều.",
    interests: ["Medicine", "Books", "Running", "Chess"],
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face",
    budget: "4-7 triệu/tháng",
    cleanlinessLevel: "Sạch sẽ"
  }
];

export default function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const currentProfile = mockProfiles[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    // Simulate swipe action
    console.log(`${direction === 'left' ? 'Rejected' : 'Liked'}: ${currentProfile.name}`);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % mockProfiles.length);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Chỉ mở modal nếu không đang drag và không đang animate
    if (!isDragging && !isAnimating && Math.abs(currentX) < 10) {
      setShowDetailModal(true);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không còn profile nào!</h2>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="btn btn-primary"
          >
            Bắt đầu lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Roomatinder</h1>
          <p className="text-gray-600">Tìm bạn cùng phòng hoàn hảo</p>
        </div>

        {/* Card Container */}
        <div className="relative h-[600px] mb-6">
          
          <div
            ref={cardRef}
            className={`absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 ${
              swipeDirection === 'left' ? 'transform -translate-x-full rotate-12' :
              swipeDirection === 'right' ? 'transform translate-x-full -rotate-12' : ''
            }`}
            style={{
              transform: isDragging ? `translateX(${currentX}px) rotate(${currentX / 10}deg)` : undefined,
            }}
            onClick={handleCardClick}
          >
            {/* Profile Image */}
            <div className="h-72 relative">
              <img
                src={currentProfile.image}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{currentProfile.name}, {currentProfile.age}</h2>
                <p className="text-sm opacity-90">{currentProfile.location}</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Giới thiệu</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{currentProfile.bio}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Sở thích</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-800">Ngân sách</h4>
                  <p className="text-gray-600">{currentProfile.budget}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Độ sạch sẽ</h4>
                  <p className="text-gray-600">{currentProfile.cleanlinessLevel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe Indicators */}
          {isDragging && (
            <>
              <div className={`absolute top-20 left-4 p-4 rounded-full ${currentX > 50 ? 'bg-green-500 opacity-100' : 'bg-gray-300 opacity-50'} transition-all`}>
                <Icon icon="mdi:heart" className="text-white text-2xl" />
              </div>
              <div className={`absolute top-20 right-4 p-4 rounded-full ${currentX < -50 ? 'bg-red-500 opacity-100' : 'bg-gray-300 opacity-50'} transition-all`}>
                <Icon icon="mdi:close" className="text-white text-2xl" />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mb-6">
          {/* Dislike Button */}
          <button
            onClick={() => handleSwipe('left')}
            disabled={isAnimating}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full border-none text-white disabled:opacity-50 flex flex-col justify-center items-center shadow-lg transition-all duration-200"
          >
            <Icon icon="mdi:close" className="text-4xl" />
          </button>
          
          {/* Like Button */}
          <button
            onClick={() => handleSwipe('right')}
            disabled={isAnimating}
            className="w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full border-none text-white disabled:opacity-50 flex flex-col justify-center items-center shadow-lg transition-all duration-200"
          >
            <Icon icon="mdi:heart" className="text-4xl" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6"
          onClick={closeDetailModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 space-y-6">
              <img
                src={currentProfile.image}
                alt={currentProfile.name}
                className="w-128 h-128 object-top rounded-t-2xl block mx-auto"
              />
              <button
                onClick={closeDetailModal}
                className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">

              {/* Profile Name and Location */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-1 text-gray-800">{currentProfile.name}, {currentProfile.age}</h2>
                <p className="text-sm text-gray-600 flex items-center justify-center">
                  <Icon icon="mdi:map-marker" className="mr-1 text-sm" />
                  {currentProfile.location}
                </p>
              </div>
              
              {/* Bio Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:account-circle" className="mr-2 text-xl text-blue-600" />
                  Giới thiệu bản thân
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{currentProfile.bio}</p>
              </div>

              {/* Interests Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:heart-multiple" className="mr-2 text-xl text-pink-600" />
                  Sở thích
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-pink-100 to-blue-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-pink-200 shadow-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                    <Icon icon="mdi:cash-multiple" className="mr-2 text-lg text-green-600" />
                    Ngân sách
                  </h4>
                  <p className="text-gray-700 text-sm font-medium">{currentProfile.budget}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                    <Icon icon="mdi:broom" className="mr-2 text-lg text-blue-600" />
                    Độ sạch sẽ
                  </h4>
                  <p className="text-gray-700 text-sm font-medium">{currentProfile.cleanlinessLevel}</p>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:information" className="mr-2 text-xl text-gray-600" />
                  Thông tin thêm
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <Icon icon="mdi:cake-variant" className="mr-2 text-base text-orange-500" />
                    <span className="text-gray-700"><strong>Tuổi:</strong> {currentProfile.age}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:account-group" className="mr-2 text-base text-purple-500" />
                    <span className="text-gray-700"><strong>ID:</strong> #{currentProfile.id}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    closeDetailModal();
                    handleSwipe('left');
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Icon icon="mdi:close-circle" className="text-lg" />
                  Bỏ qua
                </button>
                <button
                  onClick={() => {
                    closeDetailModal();
                    handleSwipe('right');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Icon icon="mdi:heart-circle" className="text-lg" />
                  Thích
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}