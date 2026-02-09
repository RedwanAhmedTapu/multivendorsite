"use client";

import { useState, useEffect } from "react";
import {
  Store,
  ShieldCheck,
  Truck,
  HeadphonesIcon,
  Award,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Sparkles,
  Heart,
  TrendingUp,
  Package,
  Star,
} from "lucide-react";
import Link from "next/link";

const AboutPage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { icon: Users, label: "Happy Customers", value: "50,000+" },
    { icon: Package, label: "Products Delivered", value: "100,000+" },
    { icon: Store, label: "Categories", value: "25+" },
    { icon: Award, label: "Years of Trust", value: "5+" },
  ];

  const values = [
    {
      icon: ShieldCheck,
      title: "Authentic Products",
      description:
        "Every product undergoes strict quality checks to ensure 100% authenticity and reliability.",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description:
        "Swift and reliable delivery across Bangladesh with real-time tracking for your convenience.",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      description:
        "Our dedicated customer service team is always ready to assist you with any queries.",
    },
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Your satisfaction is our priority. We go the extra mile to ensure a delightful shopping experience.",
    },
  ];

  const features = [
    {
      icon: CheckCircle,
      text: "Quality-checked products from trusted brands",
    },
    {
      icon: CheckCircle,
      text: "Secure payment options including bKash, Nagad, and cards",
    },
    {
      icon: CheckCircle,
      text: "Easy returns with 7-day money-back guarantee",
    },
    {
      icon: CheckCircle,
      text: "Competitive pricing with regular offers and discounts",
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }

        .shimmer-bg {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }

        .about-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .display-font {
          font-family: 'Playfair Display', serif;
        }

        .gradient-text {
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(13, 148, 136, 0.15);
        }
      `}</style>

      <div className="about-page min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Floating Icons Background */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <Store className="absolute top-20 left-10 w-16 h-16 animate-float" style={{ animationDelay: '0s' }} />
            <Package className="absolute top-40 right-20 w-20 h-20 animate-float" style={{ animationDelay: '1s' }} />
            <Heart className="absolute bottom-20 left-1/4 w-12 h-12 animate-float" style={{ animationDelay: '2s' }} />
            <Star className="absolute bottom-40 right-1/3 w-14 h-14 animate-float" style={{ animationDelay: '1.5s' }} />
          </div>

          <div className="relative container mx-auto px-4 py-16 sm:py-24 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Your Trusted E-Commerce Partner</span>
              </div>
              
              <h1 className="display-font text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up leading-tight">
                Welcome to <span className="text-teal-200">Finix Mart</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-teal-50 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Bangladesh's fastest-growing online marketplace, bringing quality products 
                and exceptional service directly to your doorstep.
              </p>

              <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <a
                  href="#contact"
                  className="bg-white text-teal-700 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Get in Touch
                </a>
                <a
                  href="#our-story"
                  className="bg-teal-500/20 backdrop-blur-sm border-2 border-white/50 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-500/30 transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>

          {/* Wave Separator */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 -mt-12 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="glass-effect rounded-2xl p-6 text-center border border-teal-100 hover-lift animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl mb-3">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 display-font">
                    {stat.value}
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section id="our-story" className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 lg:mb-16">
                <h2 className="display-font text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Our <span className="gradient-text">Story</span>
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Building a better shopping experience for Bangladesh
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Store className="w-5 h-5 text-teal-600" />
                      </div>
                      About Finix Mart
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Finix Mart is a leading e-commerce platform in Bangladesh, dedicated to 
                      transforming the online shopping experience. We connect customers with 
                      a diverse range of quality products from trusted brands across multiple 
                      categories including electronics, fashion, home appliances, beauty products, 
                      and more.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      With a commitment to authenticity, competitive pricing, and exceptional 
                      customer service, we've become a trusted destination for thousands of 
                      shoppers across the country. Our platform combines cutting-edge technology 
                      with reliable logistics to ensure a seamless shopping journey from browsing 
                      to delivery.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl p-6 lg:p-8 border border-teal-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      Our Mission
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      To provide Bangladeshi shoppers with a trusted, convenient, and delightful 
                      online shopping experience by offering genuine products, transparent pricing, 
                      fast delivery, and outstanding customer support that exceeds expectations.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover-lift">
                    <Globe className="w-8 h-8 text-teal-600 mb-3" />
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Wide Selection</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Explore thousands of products across 25+ categories, all carefully curated 
                      to meet your needs and lifestyle.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover-lift">
                    <ShieldCheck className="w-8 h-8 text-teal-600 mb-3" />
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Quality Assurance</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Every product undergoes strict quality checks to ensure you receive 
                      only authentic and reliable items.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover-lift">
                    <Truck className="w-8 h-8 text-teal-600 mb-3" />
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Nationwide Delivery</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Fast and reliable delivery service covering all major cities and districts 
                      across Bangladesh.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 lg:mb-16">
                <h2 className="display-font text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Why Choose <span className="gradient-text">Finix Mart</span>
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  We're committed to excellence in every aspect of your shopping experience
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {values.map((value, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100 hover-lift text-center group"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <value.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <h2 className="display-font text-3xl lg:text-4xl font-bold text-white mb-8 text-center">
                    What We Offer
                  </h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                      >
                        <feature.icon className="w-5 h-5 text-teal-200 flex-shrink-0 mt-0.5" />
                        <p className="text-white text-sm font-medium leading-relaxed">
                          {feature.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 lg:mb-16">
                <h2 className="display-font text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Get in <span className="gradient-text">Touch</span>
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  We're here to help! Reach out to us anytime
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <HeadphonesIcon className="w-6 h-6 text-teal-600" />
                      Contact Information
                    </h3>
                    
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            HM Hasem Mansion (6th Floor)<br />
                            Purana Paltan, Paltan<br />
                            Dhaka-1000, Bangladesh
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                          <p className="text-gray-600 text-sm">
                            <a href="tel:+8809647415199" className="hover:text-teal-600 transition-colors">
                              +880 9647-415199
                            </a>
                          </p>
                          <p className="text-gray-600 text-sm">
                            <a href="tel:+8801911802804" className="hover:text-teal-600 transition-colors">
                              +880 1911-802804
                            </a>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                          <p className="text-gray-600 text-sm">
                            <a href="mailto:support@finixmart.com.bd" className="hover:text-teal-600 transition-colors">
                              support@finixmart.com.bd
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl p-6 border border-teal-200">
                    <h4 className="font-bold text-gray-900 mb-3">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <span className="font-semibold">DBID Number:</span> 567849
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Trade License:</span> E457/684
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Card */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-8 lg:p-10 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl" />
                  
                  <div className="relative z-10">
                    <h3 className="display-font text-3xl font-bold mb-4">
                      Ready to Start Shopping?
                    </h3>
                    <p className="text-teal-50 mb-8 leading-relaxed">
                      Join thousands of satisfied customers and experience the best 
                      online shopping in Bangladesh. Browse our extensive collection 
                      of quality products today!
                    </p>
                    
                    <div className="space-y-4">
                      <Link
                        href="/products"
                        className="block w-full bg-white text-teal-700 px-6 py-4 rounded-xl font-bold text-center hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        Explore Products
                      </Link>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href="tel:+8809647415199"
                          className="flex items-center justify-center gap-2 bg-teal-500/20 backdrop-blur-sm border-2 border-white/30 px-4 py-3 rounded-lg font-semibold text-sm hover:bg-teal-500/30 transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          Call Us
                        </a>
                        <a
                          href="mailto:support@finixmart.com.bd"
                          className="flex items-center justify-center gap-2 bg-teal-500/20 backdrop-blur-sm border-2 border-white/30 px-4 py-3 rounded-lg font-semibold text-sm hover:bg-teal-500/30 transition-all"
                        >
                          <Mail className="w-4 h-4" />
                          Email Us
                        </a>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/20">
                      <p className="text-teal-100 text-sm text-center">
                        Customer support available 24/7
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-12 bg-gray-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm mb-2">
              © 2024 Finix Mart. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Building trust through quality and service
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;