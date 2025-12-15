/**
 * Pull to Refresh Hook
 * Provides pull-to-refresh functionality for mobile pages
 */

import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scrollable area
      if (container.scrollTop !== 0) return;
      
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      if (distance > 0) {
        e.preventDefault(); // Prevent default scroll
        setState({
          isRefreshing: false,
          pullDistance: distance,
          canRefresh: distance >= threshold,
        });
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;

      isPulling.current = false;

      if (state.canRefresh && !state.isRefreshing) {
        setState({
          isRefreshing: true,
          pullDistance: threshold,
          canRefresh: true,
        });

        try {
          await onRefresh();
        } catch (error) {
          console.error('[PullToRefresh] Error:', error);
        } finally {
          setState({
            isRefreshing: false,
            pullDistance: 0,
            canRefresh: false,
          });
        }
      } else {
        setState({
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        });
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, onRefresh, threshold, state.canRefresh, state.isRefreshing]);

  const pullProgress = Math.min(state.pullDistance / threshold, 1);
  const shouldShowIndicator = state.pullDistance > 0 || state.isRefreshing;

  return {
    containerRef,
    isRefreshing: state.isRefreshing,
    pullProgress,
    shouldShowIndicator,
    pullDistance: state.pullDistance,
  };
}
