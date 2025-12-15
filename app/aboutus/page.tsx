import React from 'react';
import { Icon } from '@iconify/react';
import { GreenHomeBackground } from '@/components/magicui/green-home-background';

export default function AboutUsPage() {
  return (
    <GreenHomeBackground>
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            About <span className="text-blue-600">Roomatinder</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-pink-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Smart roommate matching application that connects people with similar interests and lifestyles to create the perfect living space.
          </p>
        </div>

        {/* Problem & Solution */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:alert-circle" className="text-3xl text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Current Problems</h2>
            </div>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Difficulty finding compatible roommates</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Lack of information about lifestyle and preferences</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>Complex and time-consuming search process</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:close-circle" className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <span>No compatibility assessment tools available</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:lightbulb" className="text-3xl text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Our Solution</h2>
            </div>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Smart Tinder-like swipe interface for easy searching</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Detailed profiles with lifestyle and preference information</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Compatibility-based matching system</span>
              </li>
              <li className="flex items-start">
                <Icon icon="mdi:check-circle" className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Integrated chat feature for easy connection</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:swap-horizontal" className="text-4xl text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Smart Swipe</h3>
              <p className="text-gray-600 text-sm">Swipe right to like, swipe left to pass - simple and intuitive</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:account-heart" className="text-4xl text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Accurate Matching</h3>
              <p className="text-gray-600 text-sm">Smart algorithms analyze preferences and lifestyle compatibility</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:chat-processing" className="text-4xl text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Integrated Chat</h3>
              <p className="text-gray-600 text-sm">Direct messaging after successful matches</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:shield-check" className="text-4xl text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Safe & Secure</h3>
              <p className="text-gray-600 text-sm">Identity verification and personal information protection</p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Technology Stack</h2>
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
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Development Team</h2>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white text-center">
            <div className="mb-6">
              <Icon icon="mdi:code-tags" className="text-6xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Team devebugger</h3>
            </div>
            
            <div className="grid md:grid-cols-1 gap-6 text-left">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold mb-3">Our Goals</h4>
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


        {/* Contact Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Contact Us</h2>
          <p className="text-center text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
            We are always ready to listen to your feedback and support you. Contact the <strong className="text-blue-600">devebugger</strong> team through the channels below.
          </p>
          
          {/* Contact Info Cards */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:email" className="text-2xl text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Email</h3>
                <p className="text-blue-600 font-medium mb-2">devebugger@gmail.com</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:map-marker" className="text-2xl text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Address</h3>
                <p className="text-blue-600 font-medium mb-2">Ho Chi Minh City</p>
                <p className="text-gray-600 text-sm">University of Science - VNU-HCM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-pink-500 to-blue-500 rounded-3xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Join us in finding your perfect roommate</h2>
          <p className="text-lg mb-8 text-pink-100">
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="btn btn-white text-blue-600 btn-lg">
              <Icon icon="mdi:account-plus" className="mr-2" />
              Sign Up Now
            </a>
          </div>
        </div>

      </div>
    </div>
    </GreenHomeBackground>
  );
}
