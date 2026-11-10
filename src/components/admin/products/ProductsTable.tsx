// components/admin/products/ProductsTable.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  useGetAllProductsQuery,
  useUpdateProductStatusMutation,
  useForceDeleteProductMutation,
  useBulkApproveProductsMutation,
  useBulkRejectProductsMutation,
} from '@/features/productapi/adminProductApi';
import type { Product } from '@/types/product';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  Clock,
  X,
  CheckCircle2,
  XCircle,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type ProductStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'rating_asc'
  | 'popularity'
  | 'trending'
  | 'best_selling'
  | 'most_viewed'
  | 'top_rated'
  | 'highest_discount'
  | 'recently_updated';

interface FilterParams {
  search?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: SortOption;
}

/* ─────────────────────────────────────────────────────────────────────────
   Design tokens — mirrors AddProductForm's palette so admin surfaces read
   as one consistent system (soft blue/purple, Plus Jakarta Sans, pill
   badges, gradient primary actions).
   ───────────────────────────────────────────────────────────────────────── */

const T = {
  font: "'Plus Jakarta Sans', system-ui, sans-serif",
  page: '#F0F4FA',
  card: '#fff',
  border: '#E5EAF2',
  headerBg: '#FAFBFD',
  title: '#0D1B2E',
  subtitle: '#7A90AB',
  hint: '#9BAABB',
  label: '#3D5068',
  rowBorder: '#F0F4FA',
  rowHover: '#F7F9FC',

  gradient: 'linear-gradient(135deg,#1D4ED8,#7C3AED)',
  gradientHover: 'linear-gradient(135deg,#2563EB,#8B5CF6)',

  blue: '#1D4ED8',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',

  green: '#059669',
  greenText: '#15803D',
  greenBg: '#F0FDF4',
  greenBorder: '#BBF7D0',
  greenSoftBg: '#D1FAE5',
  greenSoftBorder: '#6EE7B7',

  amber: '#B45309',
  amberBg: '#FEF3C7',
  amberBorder: '#FCD34D',

  red: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FCA5A5',

  purple: '#7C3AED',
  purpleBg: '#F5F3FF',
  purpleBorder: '#C4B5FD',

  slate: '#64748B',
  slateBg: '#F1F5F9',
  slateBorder: '#E2E8F0',
};

const STATUS_STYLE: Record<
  ProductStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  ACTIVE: { label: 'Active', color: T.green, bg: T.greenSoftBg, border: T.greenSoftBorder, icon: <Check size={12} /> },
  PENDING: { label: 'Pending', color: T.amber, bg: T.amberBg, border: T.amberBorder, icon: <Clock size={12} /> },
  REJECTED: { label: 'Rejected', color: T.red, bg: T.redBg, border: T.redBorder, icon: <X size={12} /> },
};

function StockBadge({ stock }: { stock: number }) {
  const positive = stock > 0;
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: positive ? T.green : T.red,
        background: positive ? T.greenSoftBg : T.redBg,
        border: `0.5px solid ${positive ? T.greenSoftBorder : T.redBorder}`,
        padding: '3px 9px',
        borderRadius: 20,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {stock}
    </span>
  );
}

export function ProductsTable() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const itemsPerPage = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkApproveConfirmOpen, setBulkApproveConfirmOpen] = useState(false);

  const filterParams: FilterParams = {
    page: currentPage,
    limit: itemsPerPage,
    sortBy,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(minPrice && { minPrice: parseFloat(minPrice) }),
    ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
  };

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetAllProductsQuery(filterParams);

  const [updateStatus, { isLoading: isUpdating }] = useUpdateProductStatusMutation();
  const [forceDeleteProduct, { isLoading: isDeleting }] = useForceDeleteProductMutation();
  const [bulkApproveProducts, { isLoading: isBulkApproving }] = useBulkApproveProductsMutation();
  const [bulkRejectProducts, { isLoading: isBulkRejecting }] = useBulkRejectProductsMutation();

  const products = productsData?.items || [];
  const pagination = productsData?.pagination;
  const totalPages = pagination?.totalPages || Math.ceil((pagination?.total || 0) / itemsPerPage);
  const totalItems = pagination?.total || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, searchTerm, statusFilter, minPrice, maxPrice, sortBy]);

  const handleStatusUpdate = async (productId: string, status: ProductStatus) => {
    try {
      await updateStatus({ id: productId, status }).unwrap();
      toast.success(`Product status updated to ${status}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update product status');
    }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;
    try {
      await forceDeleteProduct(deleteProductId).unwrap();
      toast.success('Product permanently deleted');
      setDeleteProductId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete product');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const allOnPageSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));
  const someOnPageSelected = products.some((p) => selectedIds.has(p.id));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) products.forEach((p) => next.delete(p.id));
      else products.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkApprove = async () => {
    const productIds = Array.from(selectedIds);
    if (productIds.length === 0) return;
    try {
      const result = await bulkApproveProducts({ productIds }).unwrap();
      toast.success(`${result.count} product${result.count !== 1 ? 's' : ''} approved`);
      clearSelection();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to bulk approve products');
    } finally {
      setBulkApproveConfirmOpen(false);
    }
  };

  const handleBulkReject = async () => {
    const productIds = Array.from(selectedIds);
    if (productIds.length === 0) return;
    try {
      const result = await bulkRejectProducts({
        productIds,
        ...(bulkRejectReason.trim() && { reason: bulkRejectReason.trim() }),
      }).unwrap();
      toast.success(`${result.count} product${result.count !== 1 ? 's' : ''} rejected`);
      clearSelection();
      setBulkRejectReason('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to bulk reject products');
    } finally {
      setBulkRejectOpen(false);
    }
  };

  const activeFiltersCount = [searchTerm, statusFilter !== 'ALL', minPrice, maxPrice].filter(Boolean).length;
  const bulkBusy = isBulkApproving || isBulkRejecting;

  /* ── Reusable styled bits ─────────────────────────────────────────── */

  const inputStyle = {
    fontSize: 13,
    borderColor: T.border,
    background: '#fff',
  } as React.CSSProperties;

  const ghostBtn = (accent: string, bg: string, border: string): React.CSSProperties => ({
    fontSize: 12.5,
    fontWeight: 700,
    color: accent,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 9,
  });

  if (error) {
    return (
      <div
        style={{
          fontFamily: T.font,
          background: T.card,
          border: `1.5px solid ${T.redBorder}`,
          borderRadius: 14,
          boxShadow: '0 0 0 3px rgba(239,68,68,0.06)',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <p style={{ color: T.red, fontWeight: 600, marginBottom: 14, fontSize: 13.5 }}>
          Failed to load products
        </p>
        <button
          onClick={() => refetch()}
          style={{
            padding: '9px 22px',
            borderRadius: 10,
            border: 'none',
            background: T.gradient,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: T.font,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.font }}>
      <div
        style={{
          background: T.card,
          border: `1.5px solid ${T.border}`,
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header (matches SectionCard header) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: `1px solid ${T.rowBorder}`,
            background: T.headerBg,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: T.blueBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Package size={15} color={T.blue} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.title, letterSpacing: '-0.2px' }}>
                All Products
              </div>
              <div style={{ fontSize: 11, color: T.subtitle, marginTop: 1 }}>
                {isFetching && !isLoading ? 'Updating…' : `${totalItems} products found`}
              </div>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 9,
              border: `1px solid ${T.blueBorder}`,
              background: '#fff',
              color: T.blue,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: isFetching ? 'not-allowed' : 'pointer',
              opacity: isFetching ? 0.6 : 1,
              fontFamily: T.font,
            }}
          >
            <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ── Filters ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                color={T.hint}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
              />
              <Input
                placeholder="Search products, vendors…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>

            <Select value={statusFilter} onValueChange={(v: ProductStatus | 'ALL') => setStatusFilter(v)}>
              <SelectTrigger style={inputStyle}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min price (৳)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
              style={inputStyle}
            />

            <Input
              type="number"
              placeholder="Max price (৳)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
              style={inputStyle}
            />

            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger style={inputStyle}>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating_desc">Highest Rated</SelectItem>
                <SelectItem value="rating_asc">Lowest Rated</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="best_selling">Best Selling</SelectItem>
                <SelectItem value="most_viewed">Most Viewed</SelectItem>
                <SelectItem value="top_rated">Top Rated</SelectItem>
                <SelectItem value="highest_discount">Highest Discount</SelectItem>
                <SelectItem value="recently_updated">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFiltersCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.purple,
                  background: T.purpleBg,
                  border: `0.5px solid ${T.purpleBorder}`,
                  padding: '3px 10px',
                  borderRadius: 20,
                }}
              >
                <SlidersHorizontal size={11} />
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </span>
              <button
                onClick={clearFilters}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: T.slate,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: T.font,
                  textDecoration: 'underline',
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* ── Bulk action bar ── */}
          {selectedIds.size > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                borderRadius: 12,
                border: `1px solid ${T.blueBorder}`,
                background: T.blueBg,
                padding: '10px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#fff',
                    background: T.gradient,
                    padding: '3px 11px',
                    borderRadius: 20,
                  }}
                >
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={clearSelection}
                  disabled={bulkBusy}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: T.blue,
                    background: 'none',
                    border: 'none',
                    cursor: bulkBusy ? 'not-allowed' : 'pointer',
                    fontFamily: T.font,
                  }}
                >
                  Clear selection
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setBulkApproveConfirmOpen(true)}
                  disabled={bulkBusy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    cursor: bulkBusy ? 'not-allowed' : 'pointer',
                    opacity: bulkBusy ? 0.6 : 1,
                    fontFamily: T.font,
                    ...ghostBtn(T.green, T.greenBg, T.greenBorder),
                  }}
                >
                  <CheckCircle2 size={14} />
                  Approve Selected
                </button>
                <button
                  onClick={() => setBulkRejectOpen(true)}
                  disabled={bulkBusy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    cursor: bulkBusy ? 'not-allowed' : 'pointer',
                    opacity: bulkBusy ? 0.6 : 1,
                    fontFamily: T.font,
                    ...ghostBtn(T.red, T.redBg, T.redBorder),
                  }}
                >
                  <XCircle size={14} />
                  Reject Selected
                </button>
              </div>
            </div>
          )}

          {/* ── Table ── */}
          <div style={{ borderRadius: 12, border: `1px solid ${T.rowBorder}`, overflow: 'hidden' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: T.headerBg, borderBottom: `1px solid ${T.rowBorder}` }}>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAllOnPage}
                      disabled={isLoading || products.length === 0}
                      aria-label="Select all products on this page"
                    />
                  </TableHead>
                  {['Image', 'Product', 'Vendor', 'Category', 'Price', 'Stock', 'Status'].map((h) => (
                    <TableHead
                      key={h}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: T.subtitle,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {h}
                    </TableHead>
                  ))}
                  <TableHead
                    className="text-right"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: T.subtitle,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, i) => (
                    <TableRow key={i} style={{ borderBottom: `1px solid ${T.rowBorder}` }}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}>
                          <div
                            style={{
                              height: j === 1 ? 40 : 16,
                              width: j === 1 ? 40 : j === 0 ? 16 : 70,
                              borderRadius: j === 1 ? 8 : 6,
                              background: T.slateBg,
                              animation: 'shimmer 1.5s infinite',
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} style={{ textAlign: 'center', padding: '48px 0' }}>
                      <Package size={28} color="#E2E8F0" style={{ margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ color: T.subtitle, fontSize: 13, margin: 0 }}>No products found</p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearFilters}
                          style={{
                            marginTop: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.blue,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontFamily: T.font,
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, idx) => {
                    const status = product.approvalStatus as ProductStatus;
                    const price = Number(product.variants[0]?.price) || 0;
                    const stock = Number(product.variants.reduce((sum, v) => sum + v.stock, 0));
                    const isSelected = selectedIds.has(product.id);
                    const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;

                    return (
                      <TableRow
                        key={product.id}
                        style={{
                          background: isSelected ? T.blueBg : idx % 2 === 0 ? '#fff' : T.headerBg,
                          borderBottom: `1px solid ${T.rowBorder}`,
                          transition: 'background 0.12s',
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOne(product.id)}
                            aria-label={`Select ${product.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <img
                            src={product.images[0]?.url || '/placeholder.png'}
                            alt={product.name}
                            style={{
                              height: 40,
                              width: 40,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: `1px solid ${T.rowBorder}`,
                            }}
                          />
                        </TableCell>
                        <TableCell style={{ fontWeight: 700, fontSize: 13, color: T.title }}>
                          {product.name}
                        </TableCell>
                        <TableCell style={{ fontSize: 12.5, color: T.slate }}>
                          {product.vendor?.storeName || 'N/A'}
                        </TableCell>
                        <TableCell style={{ fontSize: 12.5, color: T.slate }}>
                          {product.category?.name || 'N/A'}
                        </TableCell>
                        <TableCell style={{ fontWeight: 700, fontSize: 13, color: T.green }}>
                          ৳{price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StockBadge stock={stock} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                disabled={isUpdating}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: s.color,
                                  background: s.bg,
                                  border: `1px solid ${s.border}`,
                                  padding: '5px 11px',
                                  borderRadius: 20,
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                  opacity: isUpdating ? 0.6 : 1,
                                  fontFamily: T.font,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em',
                                }}
                              >
                                {s.icon}
                                {s.label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(product.id, 'ACTIVE')}
                                disabled={status === 'ACTIVE'}
                              >
                                <Check className="h-4 w-4 mr-2" style={{ color: T.green }} />
                                <span>Active</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(product.id, 'PENDING')}
                                disabled={status === 'PENDING'}
                              >
                                <Clock className="h-4 w-4 mr-2" style={{ color: T.amber }} />
                                <span>Pending</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(product.id, 'REJECTED')}
                                disabled={status === 'REJECTED'}
                              >
                                <X className="h-4 w-4 mr-2" style={{ color: T.red }} />
                                <span>Rejected</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right">
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => router.push(`/admin-dashboard/products/${product.id}`)}
                              title="View Details"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: `1px solid ${T.blueBorder}`,
                                background: T.blueBg,
                                color: T.blue,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteProductId(product.id)}
                              disabled={isDeleting}
                              title="Permanently Delete Product"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: `1px solid ${T.redBorder}`,
                                background: T.redBg,
                                color: T.red,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                opacity: isDeleting ? 0.6 : 1,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontSize: 12, color: T.subtitle, margin: 0 }}>
                Page {currentPage} of {totalPages} ({totalItems} total)
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isFetching}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: '#fff',
                    color: T.slate,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentPage === 1 || isFetching ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 || isFetching ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 5 }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    const active = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isFetching}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          border: active ? 'none' : `1px solid ${T.border}`,
                          background: active ? T.gradient : '#fff',
                          color: active ? '#fff' : T.slate,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: isFetching ? 'not-allowed' : 'pointer',
                          fontFamily: T.font,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isFetching}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: '#fff',
                    color: T.slate,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentPage === totalPages || isFetching ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages || isFetching ? 0.5 : 1,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Single Delete Confirmation ── */}
      <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent style={{ fontFamily: T.font, borderRadius: 14 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.title }}>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.slate }}>
              This will <strong style={{ color: T.red }}>permanently delete</strong> this product and all its
              variants, images, and associated data. This action bypasses the vendor's soft-delete grace period
              and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ background: T.red, border: 'none' }}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Permanently Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Approve Confirmation ── */}
      <AlertDialog open={bulkApproveConfirmOpen} onOpenChange={setBulkApproveConfirmOpen}>
        <AlertDialogContent style={{ fontFamily: T.font, borderRadius: 14 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.title }}>
              Approve {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.slate }}>
              Each product will be set to <strong style={{ color: T.green }}>Active</strong> and its SEO metadata
              will be auto-generated on the backend. This will affect all {selectedIds.size} selected
              product{selectedIds.size !== 1 ? 's' : ''}, regardless of their current status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkApproving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkApprove}
              disabled={isBulkApproving}
              style={{ background: T.gradient, border: 'none' }}
            >
              {isBulkApproving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Approving…
                </>
              ) : (
                `Approve ${selectedIds.size} Product${selectedIds.size !== 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Reject Dialog ── */}
      <AlertDialog
        open={bulkRejectOpen}
        onOpenChange={(open) => {
          setBulkRejectOpen(open);
          if (!open) setBulkRejectReason('');
        }}
      >
        <AlertDialogContent style={{ fontFamily: T.font, borderRadius: 14 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: T.title }}>
              Reject {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: T.slate }}>
              These {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} will be marked as{' '}
              <strong style={{ color: T.red }}>Rejected</strong>. Optionally add a reason the vendor
              {selectedIds.size !== 1 ? 's' : ''} will see.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional, applies to all selected)"
            value={bulkRejectReason}
            onChange={(e) => setBulkRejectReason(e.target.value)}
            style={{ minHeight: 80, fontSize: 13, borderColor: T.border }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReject}
              disabled={isBulkRejecting}
              style={{ background: T.red, border: 'none' }}
            >
              {isBulkRejecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting…
                </>
              ) : (
                `Reject ${selectedIds.size} Product${selectedIds.size !== 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}