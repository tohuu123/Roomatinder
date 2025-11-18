"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: "mdi:email",
      title: "Email",
      content: "devebugger@gmail.com",
    },
    {
      icon: "mdi:map-marker",
      title: "Địa chỉ",
      content: "TP. Hồ Chí Minh",
      description: "Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM"
    },
  ];

  const faqItems = [
    {
      question: "Dữ liệu cá nhân có được bảo mật không?",
      answer: "Tuyệt đối có. Chúng tôi sử dụng Firebase với các biện pháp bảo mật cao và không chia sẻ thông tin cá nhân với bên thứ ba."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Liên hệ với chúng tôi
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-pink-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe ý kiến và hỗ trợ bạn. Hãy liên hệ với nhóm <strong className="text-blue-600">devebugger</strong> qua các kênh bên dưới.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="flex justify-center mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((info, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon={info.icon} className="text-2xl text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{info.title}</h3>
              <p className="text-blue-600 font-medium mb-2">{info.content}</p>
              <p className="text-gray-600 text-sm">{info.description}</p>
            </div>
            ))}
          </div>
        </div>    
      </div>
    </div>
  );
}