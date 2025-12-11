// components/Container.tsx
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export const Container = ({ children, className = "" }: ContainerProps) => (
  <div className={`max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[90%]  mx-auto md:my-4 ${className}`}>
    {children}
  </div>
);