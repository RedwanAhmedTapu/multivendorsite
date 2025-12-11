import TermsShow from '@/components/terms/TermsShow';
import React from 'react';

type ValidTypes =
  | "GENERAL"
  | "PRIVACY_POLICY"
  | "VENDOR_AGREEMENT"
  | "CUSTOMER_TERMS"
  | "DELIVERY_TERMS"
  | "RETURN_POLICY";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const typeParam = params?.type;
  const validTypes: ValidTypes[] = [
    "GENERAL",
    "PRIVACY_POLICY",
    "VENDOR_AGREEMENT",
    "CUSTOMER_TERMS",
    "DELIVERY_TERMS",
    "RETURN_POLICY"
  ];
  const type =
    typeof typeParam === "string" && validTypes.includes(typeParam as ValidTypes)
      ? (typeParam as ValidTypes)
      : "GENERAL";

  return <TermsShow type={type} />;
}
