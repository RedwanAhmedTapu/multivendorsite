import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseQueryWithReauth";

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
  vendorId?: number;
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
  vendorId?: number;
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
    // Get all sliders
    getSliders: builder.query<Slider[], void>({
      query: () => "/sliders",
      providesTags: ["Slider"],
    }),

    // Get single slider
    getSliderById: builder.query<Slider, string>({
      query: (id) => `/silders/${id}`,
      providesTags: ["Slider"],
    }),

    // Create slider with image
    createSlider: builder.mutation<Slider, CreateSliderRequest>({
      query: (body) => {
        const formData = new FormData();
        formData.append("image", body.image); // compulsory
        if (body.title) formData.append("title", body.title);
        if (body.subtitle) formData.append("subtitle", body.subtitle);
        if (body.description) formData.append("description", body.description);
        if (body.buttonText) formData.append("buttonText", body.buttonText);
        if (body.buttonLink) formData.append("buttonLink", body.buttonLink);
        formData.append("type", body.type);
        if (body.vendorId) formData.append("vendorId", body.vendorId.toString());

        return {
          url: "/sliders",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Slider"],
    }),

    // Update slider
    updateSlider: builder.mutation<Slider, UpdateSliderRequest>({
      query: ({ id, ...body }) => {
        const formData = new FormData();
        if (body.image) formData.append("image", body.image); // optional in update
        if (body.title) formData.append("title", body.title);
        if (body.subtitle) formData.append("subtitle", body.subtitle);
        if (body.description) formData.append("description", body.description);
        if (body.buttonText) formData.append("buttonText", body.buttonText);
        if (body.buttonLink) formData.append("buttonLink", body.buttonLink);
        if (body.type) formData.append("type", body.type);
        if (body.vendorId) formData.append("vendorId", body.vendorId.toString());

        return {
          url: `/sliders/${id}`,
          method: "PUT",
          body: formData,
        };
      },
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
