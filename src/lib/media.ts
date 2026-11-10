// lib/media.ts
const CDN_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || '';

export const getFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path; 
  return `${CDN_DOMAIN}/${path.replace(/^\//, '')}`;
};