"use client"
import React, { useState } from 'react';
import { Download, ChevronRight, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Tooltip Component
const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelpCircle className="w-4 h-4 text-gray-400 inline-block ml-1 cursor-help" />
  );
};

// Empty State Component
const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-32 h-32 mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-200 to-teal-300 rounded-2xl transform rotate-6"></div>
        <div className="absolute inset-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl"></div>
        <div className="absolute top-4 right-4 w-3 h-3 bg-teal-500 rounded-full animate-bounce"></div>
        <div className="absolute top-2 right-8">
          <div className="w-8 h-1 bg-teal-400 rounded-full"></div>
          <div className="w-6 h-1 bg-teal-300 rounded-full mt-1"></div>
        </div>
      </div>
      <p className="text-gray-800 font-semibold text-lg">No Data</p>
    </div>
  );
};

// Checkbox Component
const Checkbox: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
        checked ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
      }`} onClick={onChange}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-gray-600 text-sm">{label}</span>
      <Tooltip />
    </label>
  );
};

// FAQ Accordion Item Component
const FAQItem: React.FC<{ question: string; answer: string; isOpen: boolean; onToggle: () => void }> = ({ 
  question, 
  answer, 
  isOpen, 
  onToggle 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="font-medium text-gray-800 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-teal-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

// FAQ Component
const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqData = [
    {
      question: "How can Business Advisor help to improve my sales?",
      answer: `Business Advisor (BA) provides business insights on various aspects of your business. The respective BA sections present valuable data and opportunities for business growth.

Dashboard: Understand the overall store performance by checking real-time traffic and sales data and trend.
Product: Deep dive into product analysis to identify the hero and underperforming products.
Traffic: Understand major sources of traffic and identify the most efficient channel that drives the highest conversion.
Promotion: Analyse promotion performances and leverage the most suitable platform opportunities to grow your business.
Service: Evaluate your chat performance. Keep up with the good response rate and time to maintain quality customer service.
Market: Monitor and stay tuned to the marketing trend.`
    },
    {
      question: "I don't understand the metrics shown in Business Advisor. Where can I learn more?",
      answer: "You can hover your mouse on the question mark or the metric to see the detailed definition."
    },
    {
      question: "How do I get a complete set of my SKU data?",
      answer: "You can export data for 2000 SKUs at a time. If you need more data, you may utilize the Category/Brand filters to export data in batches."
    },
    {
      question: "Why are there empty fields for some date selections?",
      answer: "This may be found in the case of comparing values, which are usually represented by a dash. It means that either comparison is not applicable to the metric, or the historical data is unavailable or zero."
    },
    {
      question: "How often is data refreshed?",
      answer: "Real-time data is refreshed every 2-5 seconds, e.g. Live Monitor, Real-time Performance on Dashboard, real-time traffic sources on Traffic, real-time ranking on Product. Other than that, data is refreshed daily latest by 8AM in your local time. Note that only the last day's data is accessible, e.g. after 8AM on 2 Jan, you should be able to view the data of 1 Jan."
    },
    {
      question: "How far back can I go with date selection?",
      answer: "You can choose from yesterday, last 7 days, last 30 days, any date in the last 90 days, any week in the last 14 weeks, any month in the last 13 months. A customized date selection will be available in due course."
    },
    {
      question: "What is the displayed currency?",
      answer: "All revenue and price figures are displayed in local currency."
    },
    {
      question: "Why the revenue in Business Advisor does not match with the sum of paid price in Seller Center?",
      answer: `There are 3 possible reasons for this, namely:

1) The revenue calculation in Business Advisor differs from others: Revenue is calculated based on the final buyer paid amount as well as other platform incurred costs, during the selected time period.
Revenue = Buyer Paid Amount (incl. shipping fee paid by buyers) + Platform Discount + Platform Shipping Fee Subsidies

2) The time stamp at which Business Advisor calculates a store's revenue differs from others: In Business Advisor, we count successful orders only, for Non-Cash on Delivery orders, we only count paid orders, for Cash on Delivery orders, we count orders successfully placed. However, in Order Management module, you can find all created orders. Also, Business Advisor uses the order successfully placed time, For example, an order is placed at 23:40hrs on 1 Jan but successfully paid at 00:10hrs on 2 Jan, Business Advisor will include this order on 2 Jan, but Seller Center on 1 Jan.

3) Returns/Refunds are NOT excluded in the calculation: Revenue in Business Advisor does not take into account returns/refunds. Eg. If an order has been refunded after buyer has paid, it will NOT be excluded from the calculation.`
    },
    {
      question: "Why the orders and units sold in Business Advisor do not match with the numbers in the orders tab in Seller Center?",
      answer: `In Business Advisor, we count successful orders only, for Non-Cash on Delivery orders, we only count paid orders, for Cash on Delivery orders, we count orders successfully placed. However, in Order Management module, you can find all created orders.

Also, Business Advisor uses the order successfully placed time, For example, an order is placed at 23:40hrs on 1 Jan but successfully paid at 00:10hrs on 2 Jan, Business Advisor will include this order on 2 Jan, but Seller Center on 1 Jan.`
    },
    {
      question: "Why the Return/Refund and Cancelled amount in Business Advisor do not match with the numbers in the orders tab in Seller Center?",
      answer: `There are 2 possible reasons for this, namely:

1) The revenue calculation in Business Advisor differs from others: Revenue is calculated based on the final buyer paid amount as well as other platform incurred costs, during the selected time period.
Revenue = Buyer Paid Amount (incl. shipping fee paid by buyers) + Platform Discount + Platform Shipping Fee Subsidies

2) The time stamp at which Business Advisor calculates a store's returns/refund & cancellation differs from others: For Returns/Refunds & Cancellation in Business Advisor, we will only take into account those orders that were successfully returned/refunded/cancelled during the selected time period. For example, an order was successfully placed and paid on 1st Jan. The amount paid by buyers will be calculated into 1st Jan's Revenue. If this order is successfully refunded on 2nd Jan, this order will then be calculated into the returns/refunds amount of 2nd Jan.`
    },
    {
      question: "What's the difference between pageviews and visitors?",
      answer: "Pageviews measures how many times your store or product pages have been viewed. Visitors refers to the number of unique visitors who have viewed your pages. If a customer has viewed your store 2 times during the selected time period, pageviews is 2 and visitors is 1."
    },
    {
      question: "Why is the value of visitors on Dashboard not equal to the sum of total product visitors?",
      answer: `Visitors on Dashboard includes total visitors to all your store pages, including the visitors to your Store Homepage, Store Campaign Page, Store Category Page, Feed Page, Product Detail Pages, etc. The sum of product visitors is a subset of the total visitors displayed on the Dashboard page.

Secondly, visitors on Dashboard record unique visitors despite them viewing multiple products. A visitor who has viewed Product A, B and C will only be counted once in the visitors metric on Dashboard, however, one for each product. The sum of product visitors of Product A, B and C is not equal to the unique visitors count for the store.`
    },
    {
      question: "Why is the value of visitors on Dashboard not equal to the sum of total visitors from different traffic sources under the traffic tab?",
      answer: `Traffic Source provides information on where your visitors come from and the respective purchase conversion rate. This helps you to identify the efficient sources, invest more resources in the higher traffic/conversion sources and optimize the ones with lower conversion.

Currently, traffic source only captures the traffic data on App. External traffic source data is unavailable at the moment. The sum of visitors from different traffic sources may be expected to be lower than your store total visitors.

Sometimes, the sum up of visitors from different traffic sources is higher than store visitors. This may be due to the same customer coming from different traffic sources. For example, a customer searches your product and comes to your Product Details Page. Next, he/she leaves your store and browser "Just For You" and views one of your products from there. Since store visitors only count unique visitors, the visitors on Dashboard will be 1, and 1 for 'Search 'and 1 for "Just For You" under the traffic tab.`
    },
    {
      question: "Why is active SKUs not equal to purchasable SKUs in the Product Dashboard?",
      answer: "Active SKUs refers to the SKUs that are active and visible to customers. Purchasable SKUs are the active SKUs with stock so that they can be purchased by customers. The gap implies that some of the SKUs do not have enough stock units; you will need to replenish the stocks accordingly."
    },
    {
      question: "Why is Smart Diagnosis not available to me?",
      answer: "Since Smart Diagnosis is based on past 30 days' store data, sellers with data less than 30 days will not be able to view the Smart Diagnosis section."
    },
    {
      question: "What's the difference between previous and new definition of 'Pageview' and 'Product Pageviews' metrics?",
      answer: "The definition of 'Pageview' metric has been changed to exclude views brought by buyers clicking different SKUs of the same product. The 'Product Pageviews' you see is the number of times buyers visit your product details page. The same logic applies to 'Store Pageviews' and 'Store Visitors'. You can continue to download the Pageviews at SKU level until 28 Feb, 2023. After that, only product level Pageviews metrics remain."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Frequently Asked Questions</h2>
        <p className="text-gray-600 text-sm">Find answers to common questions about Business Advisor</p>
      </div>
      
      <div className="space-y-0">
        {faqData.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => toggleFAQ(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Product Dashboard Component (Placeholder)
const ProductDashboard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Dashboard</h2>
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Product analysis and insights</p>
        <EmptyState />
      </div>
    </div>
  );
};

// Realtime Ranking Component
const RealtimeRanking: React.FC = () => {
  const [activeTab, setActiveTab] = useState('visitors');
  const [metrics, setMetrics] = useState({
    productVisitors: true,
    productPageviews: true,
    addToCartUsers: true,
    addToCartConversion: false,
    orders: false,
    buyers: false,
    conversionRate: false,
    revenueShare: false,
  });

  const tabs = [
    { id: 'visitors', label: 'By Visitors' },
    { id: 'revenue', label: 'By Revenue' },
    { id: 'units', label: 'By Units Sold' },
    { id: 'cart', label: 'By Add to Cart Units' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 lg:mb-0">
          Realtime Ranking (Top 100)
        </h2>
        <p className="text-sm text-gray-500">
          Accumulated period: 2025-12-19 00:00:00~2025-12-19 09:23:19
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Checkbox
            label="Product Visitors"
            checked={metrics.productVisitors}
            onChange={() => setMetrics({ ...metrics, productVisitors: !metrics.productVisitors })}
          />
          <Checkbox
            label="Product Pageviews"
            checked={metrics.productPageviews}
            onChange={() => setMetrics({ ...metrics, productPageviews: !metrics.productPageviews })}
          />
          <Checkbox
            label="Add to Cart Users"
            checked={metrics.addToCartUsers}
            onChange={() => setMetrics({ ...metrics, addToCartUsers: !metrics.addToCartUsers })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Checkbox
          label="Add to Cart Conversion Rate"
          checked={metrics.addToCartConversion}
          onChange={() => setMetrics({ ...metrics, addToCartConversion: !metrics.addToCartConversion })}
        />
        <Checkbox
          label="Orders"
          checked={metrics.orders}
          onChange={() => setMetrics({ ...metrics, orders: !metrics.orders })}
        />
        <Checkbox
          label="Buyers"
          checked={metrics.buyers}
          onChange={() => setMetrics({ ...metrics, buyers: !metrics.buyers })}
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Checkbox
          label="Conversion Rate"
          checked={metrics.conversionRate}
          onChange={() => setMetrics({ ...metrics, conversionRate: !metrics.conversionRate })}
        />
        <Checkbox
          label="Revenue Share"
          checked={metrics.revenueShare}
          onChange={() => setMetrics({ ...metrics, revenueShare: !metrics.revenueShare })}
        />
      </div>

      <div className="flex justify-end mb-4">
        <span className="text-sm text-gray-600">Selected: 3/8</span>
        <button className="ml-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
          Reset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">#</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product Information</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product Visitors</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product Pageviews</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Add to Cart Users</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
            </tr>
          </thead>
        </table>
        <EmptyState />
      </div>
    </div>
  );
};

// Realtime Performance Component
const RealtimePerformance: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Realtime Performance</h2>
        <p className="text-sm text-gray-500">Update Time 2025-12-19 09:23:57</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">৳</span>
          </div>
          <span className="text-gray-600 text-sm">Revenue</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-gray-600">BDT</span>
          <span className="text-5xl font-bold text-gray-800">0.00</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          vs. Yesterday same period
          <span className="ml-2 text-gray-800">0.00%—</span>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          Yesterday same period
          <span className="ml-2 text-gray-800">0.00</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-500 rounded"></div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-500 rounded"></div>
            <span className="text-sm text-gray-600">Yesterday</span>
          </div>
        </div>
        <div className="relative h-64 border border-gray-200 rounded-lg p-4">
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Click to see today's trend for this metric.
            <button className="ml-2 text-teal-600 hover:text-teal-700 font-medium">Got it</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Visitors', 'Buyers', 'Pageviews', 'Orders'].map((metric) => (
          <div key={metric} className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm text-gray-600 mb-2">{metric}</h3>
            <p className="text-3xl font-bold text-gray-800 mb-2">0</p>
            <p className="text-sm text-gray-500">
              vs. Yesterday same period
              <span className="ml-2 text-gray-800">0.00%—</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Realtime Ranking Widget
const RealtimeRankingWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Realtime Ranking</h3>
        <span className="text-sm text-gray-500">by Revenue</span>
        <button className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
          More <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">#</span>
          <span className="text-sm text-gray-600">Revenue(BDT)</span>
        </div>
      </div>
      <EmptyState />
    </div>
  );
};

// Promotional Banner
const PromotionalBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white relative overflow-hidden">
      <div className="absolute right-0 top-0 w-64 h-64 opacity-20">
        <div className="absolute right-8 top-8 w-32 h-32 bg-white rounded-lg transform rotate-12"></div>
        <div className="absolute right-4 top-16 w-24 h-24 bg-white rounded-lg transform -rotate-6"></div>
        <div className="absolute right-12 top-4 w-16 h-16 bg-white rounded-lg"></div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-teal-600 text-xs font-bold">BA</span>
          </div>
          <span className="font-semibold">Business Advisor</span>
        </div>
        <h3 className="text-2xl font-bold mb-2">Want To Know</h3>
        <h3 className="text-2xl font-bold mb-4">Your Product's Realtime Performance?</h3>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2 rounded-full flex items-center gap-2 transition-colors">
          View Realtime ranking <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Campaign Performance Component
const CampaignPerformance: React.FC = () => {
  const [teasingMetrics, setTeasingMetrics] = useState({
    productVisitors: false,
    addToCartUsers: false,
    addToCartUnits: false,
    addToCartConversion: false,
    wishlistUsers: false,
    wishlists: false,
  });

  const [campaignMetrics, setCampaignMetrics] = useState({
    productVisitors: true,
    revenue: true,
    orders: false,
    buyers: false,
    conversionRate: false,
    unitsSold: false,
    revenuePerBuyer: false,
    averageOrderValue: false,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Campaign Performance</h2>
        <button className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-gray-600 font-medium">Date Range</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="w-5 h-5 rounded-full border-2 border-teal-500 flex items-center justify-center">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
            </div>
            <span className="text-sm text-gray-700">Campaign Products Only</span>
          </label>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Key Metrics (Teasing Period)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Checkbox
            label="Product Visitors"
            checked={teasingMetrics.productVisitors}
            onChange={() => setTeasingMetrics({ ...teasingMetrics, productVisitors: !teasingMetrics.productVisitors })}
          />
          <Checkbox
            label="Add to Cart Users"
            checked={teasingMetrics.addToCartUsers}
            onChange={() => setTeasingMetrics({ ...teasingMetrics, addToCartUsers: !teasingMetrics.addToCartUsers })}
          />
          <Checkbox
            label="Add to Cart Units"
            checked={teasingMetrics.addToCartUnits}
            onChange={() => setTeasingMetrics({ ...teasingMetrics, addToCartUnits: !teasingMetrics.addToCartUnits })}
          />
          <Checkbox
            label="Add to Cart Conversion Rate"
            checked={teasingMetrics.addToCartConversion}
            onChange={() => setTeasingMetrics({ ...teasingMetrics, addToCartConversion: !teasingMetrics.addToCartConversion })}
          />
          <Checkbox
            label="Wishlist Users"
            checked={teasingMetrics.wishlistUsers}
            onChange={() => setTeasingMetrics({ ...teasingMetrics, wishlistUsers: !teasingMetrics.wishlistUsers })}
          />
          <Checkbox
            label="Wishlists"
            checked={teasingMetrics.wishlists}
            onChange={() => setTeasingMetrics({ ...teasingMetrics, wishlists: !teasingMetrics.wishlists })}
          />
        </div>
        <div className="flex justify-end mt-3">
          <span className="text-sm text-gray-600">Selected: 0/6</span>
          <button className="ml-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
            Reset
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Key Metrics (Campaign Period)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Checkbox
            label="Product Visitors"
            checked={campaignMetrics.productVisitors}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, productVisitors: !campaignMetrics.productVisitors })}
          />
          <Checkbox
            label="Revenue"
            checked={campaignMetrics.revenue}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, revenue: !campaignMetrics.revenue })}
          />
          <Checkbox
            label="Orders"
            checked={campaignMetrics.orders}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, orders: !campaignMetrics.orders })}
          />
          <Checkbox
            label="Buyers"
            checked={campaignMetrics.buyers}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, buyers: !campaignMetrics.buyers })}
          />
          <Checkbox
            label="Conversion Rate"
            checked={campaignMetrics.conversionRate}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, conversionRate: !campaignMetrics.conversionRate })}
          />
          <Checkbox
            label="Units Sold"
            checked={campaignMetrics.unitsSold}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, unitsSold: !campaignMetrics.unitsSold })}
          />
          <Checkbox
            label="Revenue per Buyer"
            checked={campaignMetrics.revenuePerBuyer}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, revenuePerBuyer: !campaignMetrics.revenuePerBuyer })}
          />
          <Checkbox
            label="Average Order Value"
            checked={campaignMetrics.averageOrderValue}
            onChange={() => setCampaignMetrics({ ...campaignMetrics, averageOrderValue: !campaignMetrics.averageOrderValue })}
          />
        </div>
        <div className="flex justify-end mt-3">
          <span className="text-sm text-gray-600">Selected: 2/8</span>
          <button className="ml-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-teal-50">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Teasing Period</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Campaign Period</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product Visitors</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Revenue(BDT)</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
        </table>
        <EmptyState />
      </div>
    </div>
  );
};

// Main Demo Component
const BusinessAdvisorDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BA</span>
                </div>
                <span className="font-semibold text-gray-800">Business Advisor</span>
              </div>
              <nav className="hidden md:flex gap-6">
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className={`font-medium transition-colors ${
                    activeView === 'dashboard' ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveView('product')}
                  className={`font-medium transition-colors ${
                    activeView === 'product' ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
                  }`}
                >
                  Product
                </button>
                <button 
                  onClick={() => setActiveView('promotion')}
                  className={`font-medium transition-colors ${
                    activeView === 'promotion' ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
                  }`}
                >
                  Promotion
                </button>
                <button 
                  onClick={() => setActiveView('faq')}
                  className={`font-medium transition-colors ${
                    activeView === 'faq' ? 'text-teal-600' : 'text-gray-600 hover:text-teal-600'
                  }`}
                >
                  FAQ
                </button>
              </nav>
            </div>
            <span className="text-sm text-gray-500">Time Zone: GMT</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <>
            {/* View Selector */}
            <div className="mb-6 flex gap-4 flex-wrap">
              <button
                onClick={() => setActiveView('ranking')}
                className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                Realtime Ranking
              </button>
              <button
                onClick={() => setActiveView('performance')}
                className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                Realtime Performance
              </button>
              <button
                onClick={() => setActiveView('campaign')}
                className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                Campaign Performance
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Business Advisor Dashboard</h2>
              <p className="text-gray-600">Select a view above to see detailed analytics</p>
            </div>
          </>
        )}

        {/* Ranking View */}
        {activeView === 'ranking' && (
          <div className="grid grid-cols-1 gap-6">
            <RealtimeRanking />
          </div>
        )}

        {/* Performance View */}
        {activeView === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RealtimePerformance />
            </div>
            <div className="space-y-6">
              <RealtimeRankingWidget />
              <PromotionalBanner />
            </div>
          </div>
        )}

        {/* Campaign View */}
        {activeView === 'campaign' && (
          <div className="grid grid-cols-1 gap-6">
            <CampaignPerformance />
          </div>
        )}

        {/* Product View */}
        {activeView === 'product' && (
          <div className="grid grid-cols-1 gap-6">
            <ProductDashboard />
          </div>
        )}

        {/* Promotion View */}
        {activeView === 'promotion' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Promotion Dashboard</h2>
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Promotion performance and analytics</p>
                <EmptyState />
              </div>
            </div>
          </div>
        )}

        {/* FAQ View */}
        {activeView === 'faq' && (
          <div className="grid grid-cols-1 gap-6">
            <FAQSection />
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessAdvisorDashboard;