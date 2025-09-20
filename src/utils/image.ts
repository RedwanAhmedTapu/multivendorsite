export const getImageUrl = (url?: string) => {
  if (!url) return "/placeholder.png";
  return url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${url}`;
};
