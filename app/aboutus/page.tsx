import React from 'react';
import { Icon } from '@iconify/react';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Về <span className="text-blue-600">Roomatinder</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-pink-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Ứng dụng tìm bạn cùng phòng thông minh, kết nối những người có cùng sở thích và lối sống để tạo nên không gian sống lý tưởng.
          </p>
        </div>

        {/* Problem & Solution */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:alert-circle" className="text-3xl text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Vấn đề hiện tại</h2>
            </div>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Khó khăn trong việc tìm kiếm bạn cùng phòng phù hợp</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Thiếu thông tin về sở thích và lối sống của đối phương</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Quy trình tìm kiếm và kết nối phức tạp, tốn thời gian</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Không có công cụ hỗ trợ đánh giá độ tương thích</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:lightbulb" className="text-3xl text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Giải pháp của chúng tôi</h2>
            </div>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Giao diện swipe thông minh như Tinder để tìm kiếm dễ dàng</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Hồ sơ chi tiết với thông tin sở thích và lối sống</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Hệ thống matching dựa trên độ tương thích</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Tính năng chat tích hợp để dễ dàng kết nối</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Tính năng nổi bật</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:swap-horizontal" className="text-4xl text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Swipe Thông Minh</h3>
              <p className="text-gray-600 text-sm">Vuốt phải để thích, vuốt trái để bỏ qua - đơn giản và trực quan</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:account-heart" className="text-4xl text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Matching Chính Xác</h3>
              <p className="text-gray-600 text-sm">Thuật toán thông minh phân tích sở thích và lối sống</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:chat-processing" className="text-4xl text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Chat Tích Hợp</h3>
              <p className="text-gray-600 text-sm">Nhắn tin trực tiếp sau khi match thành công</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:shield-check" className="text-4xl text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">An Toàn & Bảo Mật</h3>
              <p className="text-gray-600 text-sm">Xác thực danh tính và bảo vệ thông tin cá nhân</p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Công nghệ sử dụng</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Frontend</h3>
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
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Backend</h3>
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
              <h3 className="text-xl font-semibold text-gray-800 mb-4">AI & ML</h3>
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
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Đội ngũ phát triển</h2>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white text-center">
            <div className="mb-6">
              <Icon icon="mdi:code-tags" className="text-6xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Nhóm devebugger</h3>
            </div>
            
            <div className="grid md:grid-cols-1 gap-6 text-left">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold mb-3">Mục tiêu</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Giải quyết vấn đề thực tế trong cuộc sống</li>
                  <li>• Ứng dụng công nghệ tiên tiến</li>
                  <li>• Tạo ra sản phẩm có giá trị xã hội</li>
                  <li>• Học hỏi và phát triển kỹ năng</li>
                </ul>
              </div>
            </div>
          </div>
        </div>


        {/* Call to Action */}
        <div className="bg-gradient-to-r from-pink-500 to-blue-500 rounded-3xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Tham gia cùng chúng tôi tìm bạn cùng phòng của bạn</h2>
          <p className="text-lg mb-8 text-pink-100">
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="btn btn-white text-blue-600 btn-lg">
              <Icon icon="mdi:account-plus" className="mr-2" />
              Đăng ký ngay
            </a>
            <a href="/contact" className="btn btn-outline btn-white btn-lg">
              <Icon icon="mdi:email" className="mr-2" />
              Liên hệ với chúng tôi
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
