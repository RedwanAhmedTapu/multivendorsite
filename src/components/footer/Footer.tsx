import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SSLEcommerzBanner from "../../../public/footer/sslcommerz-banner.png";
import {
  Phone,
  Mail,
  MapPin,
  Twitter,
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  MessageCircle,
  Shield,
  Truck,
  Headphones,
  CreditCard,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-gray-800">
      

      {/* Main Footer Content */}
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Finix<span className="text-emerald-600">Mart</span>
                </h2>
                <p className="text-gray-600 mt-2">
                  Your Trusted Shopping Destination
                </p>
              </div>

              <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
                Experience seamless shopping with the widest selection of
                products, competitive prices, and exceptional customer service.
              </p>

              {/* Newsletter Subscription */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Subscribe to Newsletter
                </h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500"
                  />
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Subscribe
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Get updates on new products and special offers
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-600">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-600">support@finixmart.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-600">
                    123 Business Ave, Suite 100
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Blog & News
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sitemap"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Site Map
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Customer Service
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/help"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    FAQ's
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link
                    href="/returns"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Returns & Exchanges
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track-order"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Track Your Order
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Policies
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/terms-condition?type=PRIVACY_POLICY"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-condition?type=GENERAL"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-condition"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Legal Information
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookie-policy"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/accessibility"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Media & App Download */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Social Media */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 text-center md:text-left">
                  Connect With Us
                </h4>
                <div className="flex gap-3 justify-center md:justify-start">
                  <a
                    href="#"
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-sky-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-pink-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-blue-700 hover:text-white rounded-lg transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* App Download */}
              <div className="text-center md:text-right">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Download Our App
                </h4>
                <div className="flex gap-3 justify-center md:justify-end">
                  <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center gap-2 transition-colors">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="text-sm">App Store</span>
                  </button>
                  <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center gap-2 transition-colors">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3 20.5V3.5C3 2.91 3.34 2.5 3.75 2.5H15L21 8.5V20.5C21 21.09 20.66 21.5 20.25 21.5H3.75C3.34 21.5 3 21.09 3 20.5Z" />
                    </svg>
                    <span className="text-sm">Google Play</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

     

      {/* SSLCOMMERZ Banner */}
      <div className="w-full bg-gradient-to-r from-emerald-50 to-blue-50 border-t border-gray-200">
        <div className="w-full px-0">
          <div className="relative w-full h-16 sm:h-20 md:h-24">
            <Image
              src={SSLEcommerzBanner}
              alt="SSLCOMMERZ Secure Payment"
              fill
              className="object-contain w-full"
              priority
              sizes="100vw"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;