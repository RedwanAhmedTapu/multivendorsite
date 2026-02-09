// components/help-center/HelpCenter.tsx
"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetFaqsQuery, useGetCategoriesQuery } from "@/features/faqApi";
import {
  User,
  CreditCard,
  MapPin,
  Package,
  XCircle,
  RotateCcw,
  Lock,
  Bell,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

const quickActions = [
  {
    icon: User,
    label: "Edit My Profile",
    href: "/profile/edit",
  },
  {
    icon: CreditCard,
    label: "Payment Pending",
    href: "/orders?status=payment-pending",
  },
  {
    icon: MapPin,
    label: "My Addresses",
    href: "/profile/addresses",
  },
  {
    icon: Package,
    label: "Track My Order",
    href: "/orders/track",
  },
  {
    icon: XCircle,
    label: "Cancel My Order",
    href: "/orders?action=cancel",
  },
  {
    icon: RotateCcw,
    label: "Return Product",
    href: "/orders/returns",
  },
  {
    icon: Lock,
    label: "Change Password",
    href: "/profile/security",
  },
  {
    icon: Bell,
    label: "Notification Settings",
    href: "/profile/notifications",
  },
];

export default function HelpCenter() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: faqsData, isLoading } = useGetFaqsQuery({
    isActive: true,
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const categories = categoriesData?.data || [];
  const allFaqs = faqsData?.data || [];

  const toggleCategory = (category: string) => {
    if (activeCategory === category) {
      setActiveCategory(null);
      setActiveFaq(null);
    } else {
      setActiveCategory(category);
      setActiveFaq(null);
    }
  };

  const toggleFaq = (faqId: string) => {
    setActiveFaq(activeFaq === faqId ? null : faqId);
  };

  const getFaqsByCategory = (category: string) => {
    return allFaqs
      .filter((faq) => faq.category === category)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50 mb-10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Help Center
        </h1>

        {/* Hero Banner */}
        <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-8 rounded-sm mb-8 shadow-sm">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">
              Welcome to Cartup Help Center
            </h2>
            <p className="text-sm sm:text-xl font-medium">
              Hi
              {user?.name ? (
                <span className="font-bold">, {user.name}</span>
              ) : (
                ""
              )}
              , How can we help?
            </p>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href} className="group">
                <Card className="p-3 text-center rounded-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-teal-500 h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors flex-shrink-0">
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-teal-600 transition-colors text-center leading-tight line-clamp-2">
                      {action.label}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* FAQ Categories */}
        <div className="bg-white rounded-sm shadow-sm">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading FAQs...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No FAQ categories available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category) => {
                const categoryFaqs = getFaqsByCategory(category);
                const isOpen = activeCategory === category;

                return (
                  <div key={category}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between py-3.5 px-5 text-left hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-base font-medium text-gray-900">
                        {category}
                      </span>
                      <ChevronRight
                        className={cn(
                          "w-5 h-5 text-gray-600 transition-transform duration-300 flex-shrink-0",
                          isOpen && "rotate-90",
                        )}
                      />
                    </button>

                    {/* Category FAQs */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isOpen
                          ? "max-h-[3000px] opacity-100"
                          : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="bg-gray-50 px-5 pb-4">
                        <div className="pt-3 space-y-0 divide-y divide-gray-200">
                          {categoryFaqs.length === 0 ? (
                            <p className="text-gray-500 text-sm py-3">
                              No FAQs available in this category
                            </p>
                          ) : (
                            categoryFaqs.map((faq) => {
                              const isFaqOpen = activeFaq === faq.id;

                              return (
                                <div key={faq.id} className="bg-white">
                                  {/* Question */}
                                  <button
                                    onClick={() => toggleFaq(faq.id)}
                                    className="w-full flex items-center justify-between py-3.5 px-4 text-left hover:bg-gray-50 transition-colors group"
                                  >
                                    <span className="text-sm font-normal text-gray-900 pr-3 flex-1">
                                      {faq.question}
                                    </span>
                                    <ChevronDown
                                      className={cn(
                                        "w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200",
                                        isFaqOpen && "rotate-180 text-teal-600",
                                      )}
                                    />
                                  </button>

                                  {/* Answer */}
                                  <div
                                    className={cn(
                                      "overflow-hidden transition-all duration-300 ease-in-out",
                                      isFaqOpen
                                        ? "max-h-[1000px] opacity-100"
                                        : "max-h-0 opacity-0",
                                    )}
                                  >
                                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                                      <div
                                        className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none pt-3"
                                        dangerouslySetInnerHTML={{
                                          __html: faq.answer,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
