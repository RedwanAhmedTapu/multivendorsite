import React from "react";

// Secure Payment Icon
export const SecurePaymentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    {...props}
  >
    <title>secure-payment</title>
    <path
      opacity="0.12"
      d="M11.667 19.333c0 1.105-0.895 2-2 2s-2-0.895-2-2c0-1.105 0.895-2 2-2s2 0.895 2 2z"
    />
    <path
      opacity="0.12"
      d="M21.333 30.667v0 0c-3.133-0.787-5.333-3.6-5.333-6.833v-3.833l5.333-2 5.333 2v3.833c0 3.233-2.2 6.047-5.333 6.833z"
    />
    <path opacity="0.12" d="M1.333 8h29.333v4h-29.333v-4z" />
    <path d="M6.333 21.887c0.62 0 1.2-0.233 1.667-0.633 0.447 0.387 1.027 0.633 1.667 0.633 1.407 0 2.553-1.147 2.553-2.553s-1.147-2.553-2.553-2.553c-0.64 0-1.22 0.247-1.667 0.633-0.98-0.84-2.553-0.807-3.473 0.113-0.48 0.48-0.747 1.127-0.747 1.807s0.267 1.327 0.747 1.807c0.48 0.48 1.127 0.747 1.807 0.747zM9.667 17.887c0.793 0 1.447 0.647 1.447 1.447s-0.647 1.447-1.447 1.447-1.447-0.647-1.447-1.447 0.653-1.447 1.447-1.447zM5.313 18.313c0.54-0.54 1.473-0.547 2.020-0.013-0.14 0.32-0.227 0.667-0.227 1.040s0.080 0.72 0.227 1.040c-0.547 0.527-1.487 0.527-2.020-0.013-0.273-0.287-0.427-0.647-0.427-1.033s0.153-0.747 0.427-1.020z" />
    <path d="M28 2h-24c-1.84 0-3.333 1.493-3.333 3.333v16c0 1.84 1.493 3.333 3.333 3.333h11.38c0.34 3.187 2.627 5.853 5.787 6.647l0.167 0.040 0.16-0.040c3.167-0.793 5.447-3.46 5.787-6.647h0.72c1.84 0 3.333-1.493 3.333-3.333v-16c0-1.84-1.493-3.333-3.333-3.333zM2 8.667h28v2.667h-28v-2.667zM26 23.833c0 2.873-1.913 5.373-4.667 6.14-2.753-0.767-4.667-3.267-4.667-6.14v-3.373l4.667-1.747 4.667 1.747v3.373zM30 21.333c0 1.1-0.9 2-2 2h-0.667v-3.793l-6-2.253-6 2.253v3.793h-11.333c-1.1 0-2-0.9-2-2v-8.667h28v8.667zM2 7.333v-2c0-1.1 0.9-2 2-2h24c1.1 0 2 0.9 2 2v2h-28z" />
    <path d="M19.040 23.953l-0.74 0.74 2.147 2.153 3.927-3.927-0.74-0.747-3.187 3.187z" />
  </svg>
);

// Return Icon
export const ReturnIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    {...props}
  >
    <title>return</title>
    <path
      opacity="0.12"
      d="M15.5 22.667c0 3.866-3.134 7-7 7s-7-3.134-7-7c0-3.866 3.134-7 7-7s7 3.134 7 7z"
    />
    <path opacity="0.12" d="M25.833 18.333v3.14l2.667-1.567v-3.14z" />
    <path
      opacity="0.12"
      d="M15.473 3.293l11.36 6.68 0.020 4.927-4 2.353-0.020-4.987-11.307-6.653z"
    />
    <path d="M29.527 6.44l-8.667-5.1c-1.040-0.613-2.34-0.613-3.38 0l-8.667 5.1c-1.013 0.593-1.64 1.7-1.64 2.873v5.873c-3.567 0.627-6.28 3.74-6.28 7.48 0 4.193 3.413 7.607 7.607 7.607 2.907 0 5.433-1.64 6.713-4.040l2.26 1.333c0.52 0.307 1.107 0.46 1.693 0.46s1.167-0.153 1.693-0.46l8.667-5.1c1.013-0.593 1.64-1.7 1.64-2.873v-10.28c0-1.18-0.627-2.28-1.64-2.873zM18.153 2.487c0.627-0.367 1.4-0.367 2.027 0l8.667 5.1c0.107 0.060 0.2 0.147 0.293 0.227l-2.333 1.373-10.020-5.893 1.367-0.807zM12.84 5.613l2.627-1.547 10.693 6.293 0.013 3.78c0 0.233-0.127 0.46-0.327 0.58l-2.34 1.373-0.013-4.207-10.653-6.273zM11.527 6.387l10.020 5.893-2.38 1.4-9.973-5.867c0.093-0.080 0.18-0.167 0.293-0.227l2.040-1.2zM8.5 29.060c-3.527 0-6.393-2.867-6.393-6.393s2.867-6.393 6.393-6.393 6.393 2.867 6.393 6.393-2.867 6.393-6.393 6.393zM15.74 25c0.24-0.733 0.367-1.52 0.367-2.333 0-4.193-3.413-7.607-7.607-7.607v-5.747c0-0.113 0.027-0.22 0.047-0.333l9.953 5.853v11.727c-0.12-0.040-0.24-0.080-0.347-0.147l-2.413-1.413zM29.833 19.593c0 0.707-0.38 1.367-0.987 1.72l-8.667 5.1c-0.113 0.067-0.227 0.107-0.347 0.147v-11.727l2.34-1.373 0.007 2.633c0 0.487 0.253 0.913 0.673 1.153 0.207 0.12 0.433 0.18 0.66 0.18 0.233 0 0.467-0.060 0.673-0.187l2.34-1.373c0.613-0.36 0.987-1.020 0.987-1.733l-0.013-3.807 2.287-1.347c0.020 0.113 0.047 0.22 0.047 0.333v10.28z" />
    <path d="M28.707 16.4c-0.213-0.12-0.48-0.12-0.693 0.007l-2.14 1.26c-0.373 0.22-0.6 0.62-0.6 1.053v2.52c0 0.247 0.133 0.473 0.347 0.6 0.107 0.060 0.227 0.093 0.34 0.093 0.12 0 0.24-0.033 0.353-0.093l2.14-1.26c0.373-0.22 0.6-0.62 0.6-1.053v-2.527c0-0.247-0.133-0.473-0.347-0.6zM27.947 19.527c0 0.040-0.020 0.073-0.053 0.093l-1.5 0.88v-1.787c0-0.040 0.020-0.073 0.053-0.093l1.5-0.88v1.787z" />
    <path d="M8.833 21.447h-1.987l1.713-1.713-0.787-0.787-3.060 3.053 3.060 3.060 0.787-0.787-1.72-1.72h1.993c1.167 0 2.113 0.947 2.113 2.113v0.553h1.113v-0.553c-0.007-1.78-1.447-3.22-3.227-3.22z" />
  </svg>
);

// Brands Icon
export const BrandsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    {...props}
  >
    <title>brands</title>
    <path
      opacity="0.12"
      d="M16 6c-4.053 0-7.333 3.28-7.333 7.333s3.28 7.333 7.333 7.333 7.333-3.28 7.333-7.333-3.28-7.333-7.333-7.333zM17.147 14.48l-1.147 2.187-1.147-2.187-2.187-1.147 2.187-1.147 1.147-2.187 1.147 2.187 2.187 1.147-2.187 1.147z"
    />
    <path
      opacity="0.12"
      d="M9.307 22.86c-1 1.593-1.993 3.193-2.993 4.787l3.32-0.28 1.2 3.107 3.4-5.447c-0.347-0.413-1.033-1.107-2.107-1.607-1.193-0.547-2.273-0.58-2.82-0.56z"
    />
    <path
      opacity="0.12"
      d="M22.693 22.86c1 1.593 1.993 3.193 2.993 4.787l-3.32-0.28-1.2 3.107-3.4-5.447c0.347-0.413 1.033-1.107 2.107-1.607 1.193-0.547 2.273-0.58 2.82-0.56z"
    />
    <path d="M10.693 31.96l-1.5-3.887-4.153 0.353 3.7-5.92 1.127 0.707-2.28 3.66 2.487-0.213 0.907 2.333 2.693-4.313 1.127 0.707z" />
    <path d="M21.307 31.96l-4.107-6.573 1.127-0.707 2.693 4.313 0.907-2.333 2.487 0.213-2.28-3.66 1.127-0.707 3.7 5.92-4.153-0.353z" />
    <path d="M16 26.553c-0.893 0-1.727-0.347-2.36-0.973l-1.333-1.333c-0.38-0.38-0.88-0.587-1.413-0.587h-1.887c-1.84 0-3.333-1.493-3.333-3.333v-1.887c0-0.533-0.207-1.040-0.587-1.413l-1.333-1.333c-1.3-1.3-1.3-3.413 0-4.713l1.333-1.333c0.38-0.38 0.587-0.88 0.587-1.413v-1.887c0-1.84 1.493-3.333 3.333-3.333h1.887c0.533 0 1.033-0.207 1.413-0.587l1.333-1.333c0.627-0.627 1.467-0.973 2.36-0.973s1.727 0.347 2.36 0.973l1.333 1.333c0.38 0.38 0.88 0.587 1.413 0.587h1.887c1.84 0 3.333 1.493 3.333 3.333v1.887c0 0.533 0.207 1.040 0.587 1.413l1.333 1.333c1.3 1.3 1.3 3.413 0 4.713l-1.333 1.333c-0.38 0.38-0.587 0.88-0.587 1.413v1.887c0 1.84-1.493 3.333-3.333 3.333h-1.887c-0.533 0-1.040 0.207-1.413 0.587l-1.333 1.333c-0.633 0.627-1.467 0.973-2.36 0.973zM9.013 4.347c-1.1 0-2 0.9-2 2v1.887c0 0.893-0.347 1.727-0.973 2.36l-1.333 1.333c-0.78 0.78-0.78 2.047 0 2.827l1.333 1.333c0.627 0.627 0.973 1.467 0.973 2.36v1.887c0 1.1 0.9 2 2 2h1.887c0.893 0 1.727 0.347 2.36 0.973l1.333 1.333c0.753 0.753 2.073 0.753 2.827 0l1.333-1.333c0.627-0.627 1.467-0.973 2.36-0.973h1.887c1.1 0 2-0.9 2-2v-1.887c0-0.893 0.347-1.727 0.973-2.36l1.333-1.333c0.78-0.78 0.78-2.047 0-2.827l-1.333-1.333c-0.627-0.627-0.973-1.467-0.973-2.36v-1.887c0-1.1-0.9-2-2-2h-1.887c-0.893 0-1.727-0.347-2.36-0.973l-1.333-1.333c-0.753-0.753-2.073-0.753-2.827 0l-1.333 1.333c-0.627 0.627-1.467 0.973-2.36 0.973h-1.887z" />
    <path d="M16 21.333c-4.413 0-8-3.587-8-8s3.587-8 8-8c4.413 0 8 3.587 8 8s-3.587 8-8 8zM16 6.667c-3.673 0-6.667 2.993-6.667 6.667s2.993 6.667 6.667 6.667c3.673 0 6.667-2.993 6.667-6.667s-2.993-6.667-6.667-6.667z" />
    <path d="M16 17.86l-1.56-2.967-2.967-1.56 2.967-1.56 1.56-2.967 1.56 2.967 2.967 1.56-2.967 1.56-1.56 2.967zM13.86 13.333l1.4 0.733 0.733 1.4 0.733-1.4 1.4-0.733-1.4-0.733-0.733-1.4-0.733 1.4-1.4 0.733z" />
  </svg>
);

// Free Shipping Icon
export const FreeShippingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    {...props}
  >
    <title>free-shipping</title>
    <path d="M32 19.8c0-1.37-0.8-2.56-2-3.23v-3.87l-3.13-4.7h-4.87v-3h-19v2h17v11h7.81c1.21 0 2.19 0.81 2.19 1.8v3.2h-3.15c-0.44-1.57-1.87-2.72-3.57-2.72s-3.12 1.15-3.57 2.71h-10.42c-0.44-1.56-1.87-2.71-3.57-2.71-2.050 0-3.72 1.67-3.72 3.72s1.67 3.72 3.72 3.72c1.71 0 3.14-1.16 3.57-2.73h10.41c0.44 1.57 1.87 2.73 3.57 2.73s3.13-1.16 3.57-2.72h5.16v-5.2zM5.72 25.72c-0.95 0-1.72-0.77-1.72-1.72s0.77-1.72 1.72-1.72 1.73 0.77 1.73 1.72-0.78 1.72-1.73 1.72zM23.28 25.72c-0.95 0-1.72-0.77-1.72-1.72s0.77-1.72 1.72-1.72 1.72 0.77 1.72 1.72-0.77 1.72-1.72 1.72zM25.42 16h-3.42v-6h3.8l2.2 3.3v2.7h-2.58z"></path>
    <path d="M0 11h9.53v2h-9.53v-2z"></path>
    <path d="M6 16h10.89v2h-10.89v-2z"></path>
  </svg>
);

// Expert Customer Service Icon
export const ExpertCustomerServiceIcon: React.FC<
  React.SVGProps<SVGSVGElement>
> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    {...props}
  >
    <title>expert-customer-service</title>
    <path d="M28.5 13h-0.5v-0.5c0-6.62-5.38-12-12-12s-12 5.38-12 12v0.5h-0.5c-1.38 0-2.5 1.12-2.5 2.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5v-8c0-5.51 4.49-10 10-10s10 4.49 10 10v10.17c0 2.39-1.85 4.33-4.12 4.33h-2.060c-0.41-1.16-1.51-2-2.82-2h-4c-1.65 0-3 1.35-3 3s1.35 3 3 3h4c1.3 0 2.4-0.84 2.82-2h2.060c3.28 0 5.96-2.69 6.11-6.050 0.16 0.030 0.33 0.050 0.51 0.050 1.38 0 2.5-1.12 2.5-2.5v-5c0-1.38-1.12-2.5-2.5-2.5zM4 20.5c0 0.28-0.22 0.5-0.5 0.5s-0.5-0.22-0.5-0.5v-5c0-0.28 0.22-0.5 0.5-0.5h0.5v5.5zM17 29h-4c-0.55 0-1-0.45-1-1s0.45-1 1-1h4c0.55 0 1 0.45 1 1s-0.45 1-1 1zM29 20.5c0 0.28-0.22 0.5-0.5 0.5s-0.5-0.22-0.5-0.5v-5.5h0.5c0.28 0 0.5 0.22 0.5 0.5v5z"></path>
    <path d="M22.21 13.090c0-1.060-0.87-1.93-1.93-1.93s-1.93 0.87-1.93 1.93 0.87 1.93 1.93 1.93c1.070 0 1.93-0.87 1.93-1.93z"></path>
    <path d="M13.64 13.090c0 1.066-0.864 1.93-1.93 1.93s-1.93-0.864-1.93-1.93c0-1.066 0.864-1.93 1.93-1.93s1.93 0.864 1.93 1.93z"></path>
    <path d="M12.42 19.5l-1.41 1.41c1.38 1.38 3.18 2.060 4.99 2.060s3.62-0.69 4.99-2.060l-1.41-1.41c-1.98 1.97-5.19 1.97-7.16 0z"></path>
  </svg>
);

// Export all icons as a single object
export const Icons = {
  FreeShipping: FreeShippingIcon,
  SecurePayment: SecurePaymentIcon,
  Return: ReturnIcon,
  Brands: BrandsIcon,
  Customer: ExpertCustomerServiceIcon,
};

export interface BenefitItem {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export interface BenefitsSectionProps {
  benefits?: BenefitItem[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  variant?: "default" | "card" | "simple";
  iconSize?: "small" | "medium" | "large";
  className?: string;
  showDivider?: boolean;
  centered?: boolean;
}

const defaultBenefits: BenefitItem[] = [
  {
    icon: <FreeShippingIcon />,
    title: "Fast Shipping",
    description: "Fast and reliable delivery",
  },
  {
    icon: <SecurePaymentIcon />,
    title: "Secure Payments",
    description: "Encrypted and safe transactions",
  },
  {
    icon: <ReturnIcon />,
    title: "Easy Returns",
    description: "Quick and hassle-free returns",
  },
  //   {
  //     icon: <BrandsIcon />,
  //     title: "Top Brands",
  //     description: "Premium and trusted brand",
  //   },
  {
    icon: <ExpertCustomerServiceIcon />,
    title: "Expert Customer Service",
    description: "Choose chat or call us anytime",
  },
];

const BenefitsSection: React.FC<BenefitsSectionProps> = ({
  benefits = defaultBenefits,
  title = "Why Choose Us",
  subtitle = "Experience the advantages of working with our platform",
  columns = 4,
  variant = "default",
  iconSize = "small",
  className = "",
  showDivider = false,
  centered = true,
}) => {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  const iconSizes = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  // Helper function to safely clone icon with props
  const cloneIcon = (icon: React.ReactNode, className?: string) => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(
        icon as React.ReactElement<React.SVGProps<SVGSVGElement>>,
        {
          className: `w-full h-full ${className || ""}`,
        }
      );
    }
    return icon;
  };

  // Helper function to get icon name
  const getIconName = (icon: React.ReactNode): string => {
    if (React.isValidElement(icon) && "type" in icon) {
      const iconType = icon.type;

      // Check if it's one of our icon components
      if (iconType === FreeShippingIcon) return "FreeShipping";
      if (iconType === SecurePaymentIcon) return "SecurePayment";
      if (iconType === ReturnIcon) return "Return";
      if (iconType === BrandsIcon) return "Brands";

      // Check props for title
      if (
        icon.props &&
        typeof icon.props === "object" &&
        "title" in icon.props
      ) {
        return (icon.props as any).title?.replace("-", "") || "FreeShipping";
      }
    }
    return "FreeShipping";
  };

  const iconBgColors: Record<string, string> = {
    FreeShipping: "bg-blue-50 text-blue-600",
    SecurePayment: "bg-green-50 text-green-600",
    Return: "bg-purple-50 text-purple-600",
    Brands: "bg-orange-50 text-orange-600",
    Worldwide: "bg-blue-50 text-blue-600",
    ExpertCustomerService: "bg-indigo-50 text-indigo-600",
  };

  // Default variant
  return (
    <section className={`py-3 px-4 sm:px-6 lg:px-8 ${className} `}>
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl  mx-auto">
        <div className="flex flex-nowrap items-center justify-between gap-6 overflow-x-auto">
          {benefits.map((benefit, index) => {
            const iconName = getIconName(benefit.icon);
            const bgColorClass =
              iconBgColors[iconName]?.replace("text-", "") || "bg-blue-50";

            return (
              <div
                key={index}
                className="hidden lg:flex items-start gap-1.5 text-left flex-shrink-0"
              >
                {benefit.icon && (
                  <div className={`p-1.5 rounded-full ${bgColorClass}`}>
                    <div className={`${iconSizes[iconSize]} scale-110`}>
                      {cloneIcon(benefit.icon)}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-tight">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
