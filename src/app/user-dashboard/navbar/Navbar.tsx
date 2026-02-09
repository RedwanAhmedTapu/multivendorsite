"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { 
  Search, Bell, ShoppingCart, Menu, 
  ChevronDown, X, Package, CreditCard,
  Heart, Tag, MessageSquare
} from "lucide-react";

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type FlatMenuItem = {
  title: string;
  href: string;
  icon: Icon;
  keywords: string[];
};

interface UserNavbarProps {
  onMobileMenuClick: () => void;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  showMenuButton: boolean;
  menuItems: FlatMenuItem[];
}

export function UserNavbar({
  onMobileMenuClick,
  onMenuClick,
  isSidebarOpen,
  showMenuButton,
  menuItems,
}: UserNavbarProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll to show/hide navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide navbar when scrolling down (after 10px)
      else if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Mock data - replace with actual API calls
  const notifications = [
    { id: 1, text: "Your order #ORD-7842 has been shipped", time: "2 min ago", read: false },
    { id: 2, text: "Payment received for order #ORD-7841", time: "15 min ago", read: false },
    { id: 3, text: "Special offer: 20% off on electronics", time: "1 hour ago", read: true },
    { id: 4, text: "Your review was helpful to others", time: "2 hours ago", read: true },
  ];

  const cartItems = [
    { id: 1, name: "Wireless Earbuds", price: "$99.99", quantity: 1, image: "🎧" },
    { id: 2, name: "Smart Watch", price: "$249.99", quantity: 1, image: "⌚" },
    { id: 3, name: "USB-C Hub", price: "$29.99", quantity: 2, image: "🔌" },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.keywords.some(keyword =>
      keyword.includes(searchQuery.toLowerCase())
    )
  ).slice(0, 5);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <nav 
      className={`sticky z-40 bg-white border-b shadow-sm transition-all duration-300 ${
        isVisible ? 'top-0' : 'top-20'
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMobileMenuClick}
              className="md:hidden p-2 hover:bg-teal-50 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Desktop Menu Toggle */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="hidden md:block p-2 hover:bg-teal-50 rounded-lg transition-colors"
                aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>

          {/* Center: Search */}
          <div className={`flex-1 max-w-2xl ${searchOpen ? 'block' : 'hidden md:block'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, orders, help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
              
              {/* Search Results Dropdown */}
              {searchQuery && filteredMenuItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                  {filteredMenuItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 border-b last:border-b-0 transition-colors"
                      onClick={() => setSearchQuery("")}
                    >
                      <item.icon className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-gray-800">{item.title}</span>
                      <span className="text-xs text-teal-600 ml-auto">Menu</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              aria-label="Toggle search"
            >
              {searchOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>

            {/* Cart */}
            <div className="hidden md:relative">
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className="relative p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
                    {cartItems.length}
                  </span>
                )}
              </button>

              {/* Cart Dropdown */}
              {cartOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCartOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
                      <h3 className="font-bold text-gray-800 text-lg">Shopping Cart</h3>
                      <p className="text-sm text-teal-600">{cartItems.length} items</p>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="p-4 border-b hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-2xl">
                              {item.image}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{item.name}</h4>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-teal-600 font-semibold">{item.price}</span>
                                <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-600 font-medium">Total:</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">$409.96</span>
                      </div>
                      <Link
                        href="/user-dashboard/cart"
                        className="block w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-center rounded-lg hover:shadow-lg transition-all font-medium"
                        onClick={() => setCartOpen(false)}
                      >
                        View Cart & Checkout
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
                      <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                      <p className="text-sm text-teal-600">You have {notifications.filter(n => !n.read).length} unread</p>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-teal-50/50' : ''}`}
                        >
                          <p className="text-sm text-gray-800 font-medium">{notification.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{notification.time}</span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/user-dashboard/notifications"
                      className="block p-3 text-center text-teal-600 hover:bg-teal-50 border-t font-medium transition-colors"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View All Notifications
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions Dropdown */}
            <div className="relative hidden lg:block">
              <button 
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-teal-50 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Quick Actions</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${quickActionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {quickActionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setQuickActionsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl z-50">
                    <Link
                      href="/user-dashboard/orders"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 border-b transition-colors"
                      onClick={() => setQuickActionsOpen(false)}
                    >
                      <Package className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium">My Orders</span>
                    </Link>
                    <Link
                      href="/user-dashboard/payment-methods"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 border-b transition-colors"
                      onClick={() => setQuickActionsOpen(false)}
                    >
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium">Payment Methods</span>
                    </Link>
                    <Link
                      href="/user-dashboard/wishlist"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 border-b transition-colors"
                      onClick={() => setQuickActionsOpen(false)}
                    >
                      <Heart className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium">Wishlist</span>
                    </Link>
                    <Link
                      href="/user-dashboard/vouchers"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 border-b transition-colors"
                      onClick={() => setQuickActionsOpen(false)}
                    >
                      <Tag className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium">My Vouchers</span>
                    </Link>
                    <Link
                      href="/user-dashboard/support"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 rounded-b-xl transition-colors"
                      onClick={() => setQuickActionsOpen(false)}
                    >
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium">Support</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <Link 
              href="/user-dashboard/profile"
              className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l hover:bg-teal-50 rounded-lg p-2 transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-teal-200"
                />
              ) : (
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {getUserInitials()}
                </div>
              )}
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-gray-800">{user?.name || "User"}</p>
                <p className="text-xs text-teal-600">Premium Member</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}