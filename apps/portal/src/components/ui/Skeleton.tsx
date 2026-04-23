import React from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  animation?: "pulse" | "wave" | "none";
}

/**
 * Skeleton loading placeholder for better perceived performance
 * WCAG 2.1 AA compliant with reduced motion support
 */
export function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius = "var(--radius-md)",
  className = "",
  animation = "pulse",
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={`skeleton skeleton--${animation} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
      aria-hidden="true"
      role="status"
      aria-label="Loading content..."
    />
  );
}

interface CardSkeletonProps {
  lines?: number;
  showIcon?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * Pre-built card skeleton for dashboard/workspace cards
 */
export function CardSkeleton({
  lines = 3,
  showIcon = true,
  showActions = false,
  className = "",
}: CardSkeletonProps): React.JSX.Element {
  return (
    <div className={`workspace-card skeleton-card ${className}`} role="status" aria-label="Loading card content...">
      {showIcon && (
        <div className="skeleton-card__icon">
          <Skeleton width="48px" height="48px" borderRadius="var(--radius-md)" animation="wave" />
        </div>
      )}
      
      <Skeleton width="60%" height="1.25rem" className="skeleton-card__title" />
      
      <div className="skeleton-card__lines">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? "40%" : "100%"}
            height="0.875rem"
            className="skeleton-card__line"
            animation="wave"
          />
        ))}
      </div>
      
      {showActions && (
        <div className="skeleton-card__actions">
          <Skeleton width="100px" height="2.75rem" borderRadius="var(--radius-md)" />
        </div>
      )}
    </div>
  );
}
