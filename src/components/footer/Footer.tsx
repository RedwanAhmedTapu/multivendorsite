import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Phone, 
  Mail, 
  Twitter, 
  Facebook, 
  Youtube, 
  Instagram, 
  MessageCircle 
} from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 pt-12 pb-6 md:pt-16 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-10 md:mb-12">
          {/* Left Section - Contact Info */}
          <div className="space-y-6 md:space-y-8">
            {/* Call Section */}
            <div className="flex items-start space-x-3 md:space-x-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">Call</h3>
                <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">
                  Call us from 8am to<br />12am ET.
                </p>
                <p className="text-gray-900 font-medium text-sm md:text-base">1-866-237-8289</p>
              </div>
            </div>

            {/* Email Section */}
            <div className="flex items-start space-x-3 md:space-x-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 md:mb-2">Email</h3>
                <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">
                  Our response time is<br />1 to 3 business days.
                </p>
                <button className="text-gray-900 font-medium text-sm md:text-base hover:text-gray-700 transition-colors">
                  Send a Message
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Newsletter */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Let's keep in touch</h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Get recommendations, tips, updates, promotions and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Input 
                type="email"
                placeholder="Enter your email address"
                className="flex-1 h-10 md:h-12 px-3 md:px-4 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
              <Button 
                className="h-10 md:h-12 px-4 md:px-8 text-sm md:text-base bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Brand and Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 py-8 md:py-12 border-t border-gray-200">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Motta<span className="text-red-500">.</span><span className="text-blue-500">.</span><span className="text-yellow-500">.</span>
              </h2>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Best For Shopping</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 leading-relaxed">
              Sed do eiusmod tempor incididunt ut labore dolore magna.
            </p>
            {/* Social Links */}
            <div className="flex space-x-3 md:space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Twitter className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Facebook className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Youtube className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Instagram className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>

          {/* Get to Know Us */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Get to Know Us</h4>
            <ul className="space-y-2 md:space-y-4">
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">About Us</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">News & Blog</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Careers</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Investors</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Customer Service</h4>
            <ul className="space-y-2 md:space-y-4">
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ's</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Accessibility</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Feedback</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Size Guide</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Payment Method</a></li>
            </ul>
          </div>

          {/* Orders & Returns */}
          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Orders & Returns</h4>
            <ul className="space-y-2 md:space-y-4">
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Track Order</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Shipping & Delivery</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Return & Exchange</a></li>
              <li><a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">Price Match Guarantee</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center pt-6 md:pt-8 border-t border-gray-200">
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 mb-4 lg:mb-0">
            <a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Terms of Use
            </a>
            <a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Legal
            </a>
            <a href="#" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Site Map
            </a>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
            <div className="flex items-center space-x-1 text-gray-400 text-xs md:text-sm">
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs font-medium">BANK</span>
            </div>
            <div className="text-gray-400 text-xs md:text-sm font-semibold">VISA</div>
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <div className="text-gray-400 text-xs md:text-sm">mastercard</div>
            <div className="text-blue-600 text-xs md:text-sm font-semibold">PayPal</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;