"use client";

import React, { useState } from "react";
import {
  useGetSlidersQuery,
  useCreateSliderMutation,
  useDeleteSliderMutation,
  Slider,
} from "@/features/sliderApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Upload, Image as ImageIcon, Plus } from "lucide-react";

const SliderAdmin: React.FC = () => {
  const { data: sliders, isLoading, error } = useGetSlidersQuery();
  const [createSlider] = useCreateSliderMutation();
  const [deleteSlider] = useDeleteSliderMutation();

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [type, setType] = useState<"HOMEPAGE" | "VENDORPAGE">("HOMEPAGE");
  const [file, setFile] = useState<File | null>(null);

  const handleCreate = async () => {
    if (!file) return alert("Image is required");

    try {
      await createSlider({
        title,
        subtitle,
        description,
        buttonText,
        buttonLink,
        type,
        image: file,
      }).unwrap();

      // Reset form
      setTitle("");
      setSubtitle("");
      setDescription("");
      setButtonText("");
      setButtonLink("");
      setFile(null);
    } catch (err) {
      console.error("CreateSlider error:", err);
      alert("Failed to create slider. Check console for details.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this slider?")) {
      try {
        await deleteSlider(id).unwrap();
      } catch (err) {
        console.error("DeleteSlider error:", err);
        alert("Failed to delete slider.");
      }
    }
  };

  return (
    <div className="min-h-screen">
      

      <div className=" sm:px-4 lg:px-8 py-6 max-w-7xl mx-auto ">
        {/* Create Form */}
        <Card className="mb-8 shadow-xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className=" bg-teal-600  text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <CardTitle className="text-lg sm:text-xl">Create New Slider</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <Input
                    placeholder="Enter slider title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <Input
                    placeholder="Enter slider subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Input
                    placeholder="Enter description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                  <Input
                    placeholder="Enter button text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
                  <Input
                    placeholder="Enter button link"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <Select
                    value={type}
                    onValueChange={(val) =>
                      setType(val as "HOMEPAGE" | "VENDORPAGE")
                    }
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="Select slider type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOMEPAGE">Homepage</SelectItem>
                      <SelectItem value="VENDORPAGE">Vendor Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slider Image</label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="border-gray-300 focus:border-teal-500 focus:ring-teal-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                {file && (
                  <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Selected: {file.name}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="w-full  bg-teal-800 text-white font-medium py-3 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Upload size={18} /> 
              Create Slider
            </Button>
          </CardContent>
        </Card>

        {/* Sliders Display */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-teal-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl">All Sliders</CardTitle>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {sliders?.length || 0} sliders
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <p className="mt-4 text-gray-600">Loading sliders...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">Failed to load sliders</p>
                <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
              </div>
            ) : !sliders?.length ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No sliders yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first slider above</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-gray-900">Image</th>
                        <th className="px-6 py-4 font-semibold text-gray-900">Title</th>
                        <th className="px-6 py-4 font-semibold text-gray-900">Subtitle</th>
                        <th className="px-6 py-4 font-semibold text-gray-900">Description</th>
                        <th className="px-6 py-4 font-semibold text-gray-900">Button</th>
                        <th className="px-6 py-4 font-semibold text-gray-900">Type</th>
                        <th className="px-6 py-4 font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sliders?.map((slider: Slider, index) => (
                        <tr
                          key={slider.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <img
                              src={`http://localhost:5000/${slider.imageUrl}`}
                              alt={slider.title || "Slider"}
                              className="w-20 h-12 object-cover rounded-lg shadow-sm border border-gray-200"
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {slider.title || <span className="text-gray-400">No title</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {slider.subtitle || <span className="text-gray-400">No subtitle</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                            {slider.description || <span className="text-gray-400">No description</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {slider.buttonText || <span className="text-gray-400">No text</span>}
                              </div>
                              {slider.buttonLink && (
                                <a
                                  href={slider.buttonLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline truncate block max-w-32"
                                >
                                  {slider.buttonLink}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              slider.type === 'HOMEPAGE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {slider.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              onClick={() => handleDelete(slider.id)}
                              size="sm"
                              variant="destructive"
                              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 transition-colors"
                            >
                              <Trash2 size={14} />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-gray-200">
                  {sliders?.map((slider: Slider) => (
                    <div key={slider.id} className="p-2 sm:p-6 space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={`http://localhost:5000/${slider.imageUrl}`}
                          alt={slider.title || "Slider"}
                          className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded-lg shadow-sm border border-gray-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {slider.title || "No title"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {slider.subtitle || "No subtitle"}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                            slider.type === 'HOMEPAGE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {slider.type}
                          </span>
                        </div>
                      </div>
                      
                      {slider.description && (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {slider.description}
                        </p>
                      )}
                      
                      {(slider.buttonText || slider.buttonLink) && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Button: </span>
                            {slider.buttonText || "No text"}
                          </div>
                          {slider.buttonLink && (
                            <a
                              href={slider.buttonLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline break-all"
                            >
                              {slider.buttonLink}
                            </a>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => handleDelete(slider.id)}
                          size="sm"
                          variant="destructive"
                          className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SliderAdmin;