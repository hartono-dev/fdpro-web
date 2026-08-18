import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

const useObserveScroll = (targetRef: RefObject<HTMLElement | null>, options?: IntersectionObserverInit) => {
  const [isTargetOutOfView, setIsTargetOutOfView] = useState(false);

  useEffect(() => {
    const currentTarget = targetRef.current;
    
    const observer = new IntersectionObserver(([entry]) => {
      // Jika elemen target tidak lagi terlihat sepenuhnya (keluar dari viewport ke atas)
      // entry.boundingClientRect.top < 0 berarti bagian atas elemen sudah melewati bagian atas viewport
      // dan entry.isIntersecting false berarti elemen sudah tidak terlihat.
      // Kita ingin sticky bar muncul ketika target benar-benar tidak terlihat lagi di bagian atas.
      setIsTargetOutOfView(entry.boundingClientRect.top < 0 && !entry.isIntersecting);
    }, options);

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [targetRef, options]);

  return isTargetOutOfView;
};

export default useObserveScroll;