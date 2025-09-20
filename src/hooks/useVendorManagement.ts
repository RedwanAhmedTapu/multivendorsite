// hooks/useVendorManagement.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorManageApi } from '@/features/vendorManageApi';
import { VendorFilterQuery, VendorExportOptions } from '@/types/vendor';

export const useVendors = (filters: VendorFilterQuery) => {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: () => vendorManageApi.endpoints.getVendors.initiate(filters).unwrap(),
  });
};

export const useUpdateVendorStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      vendorManageApi.endpoints.updateVendorStatus.initiate({ id, status }).unwrap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};

export const useExportVendors = () => {
  return useMutation({
    mutationFn: (options: VendorExportOptions) => 
      vendorManageApi.endpoints.exportVendors.initiate(options).unwrap(),
  });
};