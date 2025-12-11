import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  Mail,
  MapPin,
  Twitter,
  Facebook,
  Youtube,
  Instagram,
} from "lucide-react";
import { Container } from "../Container";
import Image from "next/image";

const Footer = () => {
  return (
    <Container className="bg-white border-t-2 border-gray-200">
      {/* Main Footer Content */}
      <div className="py-12 lg:py-16">
        <div className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Info Section */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold text-gray-800 mb-6 pl-1">
                Finix Mart 
              </h4>
              
              {/* Contact Details */}
              <div className="space-y-4 pl-1">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      HM Hasem Mansion (6th Floor), Purana Paltan, Paltan, Dhaka-1000.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600 text-sm">
                      support@finixmart.com.bd
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600 text-sm">+880 9647-415199</p>
                    <p className="text-gray-600 text-sm">+880 1911-802804</p>
                  </div>
                </div>
              </div>

              {/* Business IDs */}
              <div className="mt-6 space-y-1 pl-1">
                <p className="text-sm font-bold text-gray-800">
                  DBID NUMBER: <span className="font-normal">567849</span>
                </p>
                <p className="text-sm font-bold text-gray-800">
                  TRADE LICENSE: <span className="font-normal">E457/684</span>
                </p>
              </div>
            </div>

            {/* Get to Know Us */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-6 pl-1">
                Get to Know Us
              </h4>
              <ul className="space-y-3 pl-1">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">About Us</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/news"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">News & Blog</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Careers</span>
                  </Link>
                </li>
                {/* <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Contact Us</span>
                  </Link>
                </li> */}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-6 pl-1">
                Customer Service
              </h4>
              <ul className="space-y-3 pl-1">
                <li>
                  <Link
                    href="/customer-complain"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Customer Complain</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Help Center</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track-order"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Track Order</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sitemap"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Site Map</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-6 pl-1">
                Legal
              </h4>
              <ul className="space-y-3 pl-1">
                <li>
                  <Link
                    href="/terms-condition?type=PRIVACY_POLICY"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-condition?type=GENERAL"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Terms of Use</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-condition?type=GENERAL"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Shipping & Delivery</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-condition?type=GENERAL"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Return & Exchange</span>
                  </Link>
                </li>
                {/* <li>
                  <Link
                    href="/terms-condition?type=PAYMENT_METHOD"
                    className="text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2 group text-sm"
                  >
                    
                    <span className="ml-1">Payment Method</span>
                  </Link>
                </li> */}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold text-gray-800 mb-6 pl-1">
                Let's keep in touch
              </h4>
              <div className="pl-1">
                <p className="text-gray-600 text-sm mb-4">
                  Get recommendations, tips, updates and more.
                </p>

                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 text-sm"
                  />
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm py-2">
                    Subscribe
                  </Button>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8 pl-1">
                <h5 className="font-semibold text-gray-800 mb-4 text-sm">
                  Stay Connected
                </h5>
                <div className="flex gap-4">
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-emerald-600 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-emerald-600 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-emerald-600 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-emerald-600 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-emerald-600 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
            {/* Copyright */}
            <p className="text-gray-600 text-sm text-center md:text-left">
              Copyright © 2025 <span className="font-semibold">FinixMart</span>, All rights reserved.
            </p>

            {/* Payment Methods */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
             <Image
                src="/footer/ssl-commerz-bangladesh.png"
                width={300}
                height={300}
                alt="SSL Commerz Banner"
                className="h-8 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Footer;