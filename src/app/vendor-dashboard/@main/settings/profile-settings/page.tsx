"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  Building2,
  ChevronRight,
  Store,
  Mail,
  Phone,
  Camera,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetCompleteVendorProfileQuery, // Changed to Complete Profile hook
  useUpdateVendorProfileMutation,
} from "@/features/vendorManageApi";
import Link from "next/link";

export default function VendorProfileSettingsPage() {
  const vendorId = useSelector(
    (state: RootState) => state.auth.user?.vendorId ?? ""
  );

  // This hook automatically unwraps the "data" object if transformResponse is set in your API
  const { data: profile, isLoading } = useGetCompleteVendorProfileQuery(vendorId, {
    skip: !vendorId,
  });

  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateVendorProfileMutation();

  // Local form states
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Sync fetched data to local state
  useEffect(() => {
    if (profile) {
      setStoreName(profile.storeName || "");
      // Check both root email and inside user object
      setEmail(profile.user?.email || profile.email || "");
      setPhone(profile.user?.phone || "");
      setAvatarPreview(profile.avatar || "");
    }
  }, [profile]);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!storeName) {
      toast.error("Store name is required");
      return;
    }

    const formData = new FormData();
    formData.append("storeName", storeName);
    
    // Note: If your backend doesn't actually save these via this endpoint, 
    // they won't persist. You might need a separate endpoint to update user email/phone.
    formData.append("email", email);
    formData.append("phone", phone);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const promise = updateProfile({
      id: vendorId,
      formData,
    }).unwrap();

    toast.promise(promise, {
      loading: "Updating profile...",
      success: (res: any) => res?.message || "Profile updated successfully",
      error: (err: any) =>
        err?.data?.message || "Failed to update profile. Please try again.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 font-sans">
      {/* ── Top Bar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30 shadow-sm shadow-blue-50">
        <div className="max-w-screen-md mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 overflow-hidden">
            <Link href="/vendor-dashboard/settings" className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-600 shrink-0">
              <Building2 size={14} />
              <span>Settings</span>
            </div>
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold text-slate-700 truncate">
              Profile Settings
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 shadow-sm shadow-blue-200 transition-all shrink-0 disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            <span className="hidden sm:inline">Save Changes</span>
          </button>
        </div>
      </header>

      <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-6">
        {/* ── Page title ── */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            Profile Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Update your store name, logo, and contact details
          </p>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm shadow-blue-50 overflow-hidden">
          {/* Logo / Avatar Section */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/30">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Store Logo
            </label>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white border border-cyan-100 shadow-sm flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Store Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store size={32} className="text-slate-300" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md cursor-pointer hover:from-blue-700 hover:to-cyan-600 transition-all"
                >
                  <Camera size={14} />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Upload your store logo
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  PNG, JPG up to 2MB. Square image recommended.
                </p>
                {avatarFile && (
                  <button
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(profile?.avatar || "");
                    }}
                    className="mt-2 flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600"
                  >
                    <X size={12} /> Remove selected
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="p-6 space-y-5">
            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Store Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Store size={16} className="text-slate-400" />
                </div>
                <input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Finixmart Trading Co."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone size={16} className="text-slate-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-sm shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}