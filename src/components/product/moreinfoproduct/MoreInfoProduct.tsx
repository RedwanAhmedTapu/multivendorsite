"use client";

import React, { useState } from "react";
import { Star, Check, Truck, RotateCcw, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: number;
  user: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
}

const MoreInfoProduct = () => {
  const [activeTab, setActiveTab] = useState("description");
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Sample reviews data
  const reviews: Review[] = [
    {
      id: 1,
      user: "John D.",
      rating: 5,
      date: "2023-10-15",
      title: "Excellent flashlight!",
      content: "This flashlight is very bright and the battery lasts a long time. Perfect for camping trips.",
      verified: true
    },
    {
      id: 2,
      user: "Sarah M.",
      rating: 4,
      date: "2023-09-22",
      title: "Good value for money",
      content: "Works well for the price. The charging is convenient and it's quite durable.",
      verified: true
    },
    {
      id: 3,
      user: "Alex T.",
      rating: 3,
      date: "2023-08-30",
      title: "Average product",
      content: "It's okay but not as bright as I expected. The build quality could be better.",
      verified: false
    }
  ];

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className={`${isFullScreen ? "fixed inset-0 z-50 bg-white p-6 overflow-auto" : "mt-12 border-t pt-8"} relative`}>
      
      

      {/* Tabs Navigation */}
      <div className="flex justify-center items-center flex-wrap border-b sticky top-0 bg-white z-10">
        {[
          { id: "description", label: "Description" },
          { id: "additional", label: "Additional Information" },
          { id: "reviews", label: `Reviews (${reviews.length})` },
          { id: "shipping", label: "Shipping & Returns" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm md:text-base transition-colors ${
              activeTab === tab.id
                ? "text-teal-700 border-b-2 border-teal-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`p-6 max-w-7xl mx-auto`}>
        {/* Description Tab */}
        {activeTab === "description" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Description</h3>
            <p className="text-gray-700">
              The Geepas GP-007 Rechargeable LED Flashlight is a powerful and versatile lighting solution 
              designed for both everyday use and emergency situations. With its advanced LED technology, 
              this flashlight provides intense brightness while maintaining energy efficiency.
            </p>
            
            <h4 className="font-medium text-gray-900">Key Features:</h4>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>High-intensity LED with 300 lumens output</li>
              <li>Rechargeable 18650 lithium battery included</li>
              <li>Multiple lighting modes: High, Medium, Low, and Strobe</li>
              <li>USB charging port for convenient recharging</li>
              <li>Durable aluminum alloy construction</li>
              <li>Water-resistant design (IPX4 rating)</li>
              <li>Adjustable focus from spotlight to floodlight</li>
              <li>Built-in power indicator</li>
            </ul>
            
            <p className="text-gray-700">
              Perfect for outdoor activities, emergency preparedness, home use, and professional applications. 
              The compact yet powerful design makes it easy to carry in your backpack, glove compartment, or tool bag.
            </p>
          </div>
        )}

        {/* Additional Information Tab */}
        {activeTab === "additional" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Specifications</h4>
                <table className="w-full text-sm text-gray-700">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium pr-4">Brand</td>
                      <td className="py-2">Geepas</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium pr-4">Model</td>
                      <td className="py-2">GP-007</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium pr-4">Light Source</td>
                      <td className="py-2">LED</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium pr-4">Battery Type</td>
                      <td className="py-2">Rechargeable 18650 Lithium</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium pr-4">Brightness</td>
                      <td className="py-2">300 Lumens</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium pr-4">Beam Distance</td>
                      <td className="py-2">200 meters</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium pr-4">Water Resistance</td>
                      <td className="py-2">IPX4 (Splash Proof)</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium pr-4">Weight</td>
                      <td className="py-2">180g</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Whats in the Box</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>1x Geepas GP-007 Flashlight</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>1x 18650 Rechargeable Battery</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>1x USB Charging Cable</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>1x User Manual</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>1x Wrist Strap</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Customer Reviews</h3>
                <div className="flex items-center mt-1">
                  <div className="flex">
                    {renderStars(4)}
                  </div>
                  <span className="ml-2 text-gray-600 text-sm">Based on {reviews.length} reviews</span>
                </div>
              </div>
              
              <Button className="bg-teal-700 hover:bg-teal-800">
                Write a Review
              </Button>
            </div>
            
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{review.user}</h4>
                      <div className="flex items-center mt-1">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="ml-2 text-gray-500 text-sm">{review.date}</span>
                      </div>
                    </div>
                    {review.verified && (
                      <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        <Check className="w-3 h-3 mr-1" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  
                  <h5 className="font-medium text-gray-900 mt-2">{review.title}</h5>
                  <p className="text-gray-700 mt-1">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping & Returns Tab */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                
                <div className="flex items-start mb-6">
                  <Truck className="w-6 h-6 text-teal-700 mr-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Delivery Options</h4>
                    <ul className="mt-3 space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Standard Shipping: ৳135 (2-3 business days)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Express Shipping: ৳250 (1-2 business days)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Free shipping on orders over ৳600</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-teal-700 mr-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">International Shipping</h4>
                    <p className="mt-3 text-gray-700">
                      We ship to most countries worldwide. International shipping rates and delivery times vary by destination.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Return Policy</h3>
                
                <div className="flex items-start mb-6">
                  <RotateCcw className="w-6 h-6 text-teal-700 mr-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Returns & Exchanges</h4>
                    <ul className="mt-3 space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>7-day easy return policy</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Items must be unused and in original packaging</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Return shipping fees are the customers responsibility</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-teal-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span>Refunds processed within 3-5 business days after inspection</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-teal-700 mr-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Warranty</h4>
                    <p className="mt-3 text-gray-700">
                      This product comes with a 1-year manufacturer warranty covering defects in materials and workmanship.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mt-6">
              <h4 className="font-medium mb-3 text-lg">Need Help?</h4>
              <p className="text-gray-700">
                Contact our customer support team for assistance with shipping, returns, or any other questions.
                <br />
                <strong>Email:</strong> support@electrohub.com | <strong>Phone:</strong> +880 XXX-XXXXXXX
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoreInfoProduct;