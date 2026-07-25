import { useEffect, useRef, type MutableRefObject } from 'react';

/**
 * 偵測使用者「最近是否正在手動捲動」。
 *
 * 用途：自動捲動之前先問這個守衛。若使用者正在自己滑，
 * 就不要把畫面搶走 —— 被強制拉走是比「要自己找按鈕」更惱人的體驗。
 *
 * @param idleMs 手動捲動後多久視為結束（預設 800ms）
 */
export const useUserScrolling = (idleMs = 800): MutableRefObject<boolean> => {
  const isScrolling = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const markScrolling = () => {
      isScrolling.current = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { isScrolling.current = false; }, idleMs);
    };

    // 只聽「使用者主動」的事件。不聽 scroll，否則我們自己的
    // smooth scroll 會觸發它，導致守衛自我封鎖。
    window.addEventListener('wheel', markScrolling, { passive: true });
    window.addEventListener('touchmove', markScrolling, { passive: true });

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('wheel', markScrolling);
      window.removeEventListener('touchmove', markScrolling);
    };
  }, [idleMs]);

  return isScrolling;
};
