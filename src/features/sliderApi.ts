import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";
import { buildSliderFormData } from "@/lib/slider/slider-form";

// Types
export interface Slider {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  type: "HOMEPAGE" | "VENDORPAGE";
  vendorId?: string;
  vendor?: { id: string; storeName: string; avatar?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSliderRequest {
  image: File; // compulsory
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  type: "HOMEPAGE" | "VENDORPAGE";
  vendorId?: string;
}

export interface UpdateSliderRequest extends Partial<CreateSliderRequest> {
  id: string;
}

// Slider API
export const sliderApi = createApi({
  reducerPath: "sliderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Slider"],
  endpoints: (builder) => ({
    // Get all sliders — optionally filtered by type (HOMEPAGE/VENDORPAGE) and/or vendorId
    getSliders: builder.query<Slider[], { type?: "HOMEPAGE" | "VENDORPAGE"; vendorId?: string } | void>({
      query: (params) => ({ url: "/sliders", params: params ?? undefined }),
      providesTags: ["Slider"],
    }),

    // Get single slider
    getSliderById: builder.query<Slider, string>({
      query: (id) => `/sliders/${id}`,
      providesTags: ["Slider"],
    }),

    // Create slider with image
    createSlider: builder.mutation<Slider, CreateSliderRequest>({
      query: (body) => ({
        url: "/sliders",
        method: "POST",
        body: buildSliderFormData(body, "create"), // image compulsory
      }),
      invalidatesTags: ["Slider"],
    }),

    // Update slider
    updateSlider: builder.mutation<Slider, UpdateSliderRequest>({
      // Sends cleared ("") text fields so they are saved; the image only when a
      // new file was chosen — the server keeps the current image otherwise.
      query: ({ id, ...body }) => ({
        url: `/sliders/${id}`,
        method: "PUT",
        body: buildSliderFormData(body, "update"),
      }),
      invalidatesTags: ["Slider"],
    }),

    // Delete slider
    deleteSlider: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/sliders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Slider"],
    }),
  }),
});

// Export hooks
export const {
  useGetSlidersQuery,
  useGetSliderByIdQuery,
  useCreateSliderMutation,
  useUpdateSliderMutation,
  useDeleteSliderMutation,
} = sliderApi;