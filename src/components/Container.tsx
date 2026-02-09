// components/Container.tsx
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container = ({ children, className = "" }: ContainerProps) => (
  <div className={`max-w-4xl   lg:max-w-[85%]  mx-auto sm:p-0 md:my-4 ${className}`}>
    {children}
  </div>
);