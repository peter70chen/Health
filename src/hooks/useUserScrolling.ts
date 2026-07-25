import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';

/**
 * 偵測使用者「最近是否正在手動捲動」。
 *
 * 用途：自動捲動之前先問這個守衛。若使用者正在自己滑，
 * 就不要把畫面搶走 —— 被強制拉走是比「要自己找按鈕」更惱人的體驗。
 *
 * 為什麼不能只聽 wheel/touchmove：
 * iOS 有慣性捲動（手指離開後畫面繼續滑），此時 touchmove 已經停了，
 * 只剩 scroll 事件還在發。只聽 touchmove 會在慣性期誤判為「使用者沒在滑」。
 *
 * 為什麼不能只聽 scroll：
 * 我們自己的 smooth scroll 也會觸發 scroll，守衛會自我封鎖。
 * 解法：程式化捲動前呼叫 suppress()，在那段期間忽略 scroll 事件。
 */
export type UserScrollGuard = {
  /** 使用者最近是否在手動捲動 */
  isActive: MutableRefObject<boolean>;
  /** 程式化捲動前呼叫，讓接下來 durationMs 內的 scroll 事件不算「使用者捲動」 */
  suppress: (durationMs?: number) => void;
};

export const useUserScrolling = (idleMs = 800): UserScrollGuard => {
  const isActive = useRef(false);
  const suppressUntil = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  const suppress = useRef((durationMs = 1200) => {
    suppressUntil.current = Date.now() + durationMs;
    isActive.current = false;
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }).current;

  useEffect(() => {
    const markScrolling = () => {
      // 這段是我們自己捲的，不算使用者操作
      if (Date.now() < suppressUntil.current) return;
      isActive.current = true;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => { isActive.current = false; }, idleMs);
    };

    const opts = { passive: true } as const;
    window.addEventListener('wheel', markScrolling, opts);
    window.addEventListener('touchmove', markScrolling, opts);
    window.addEventListener('touchstart', markScrolling, opts);
    // 涵蓋 iOS 慣性捲動期間（此時只剩 scroll 事件）
    window.addEventListener('scroll', markScrolling, opts);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener('wheel', markScrolling);
      window.removeEventListener('touchmove', markScrolling);
      window.removeEventListener('touchstart', markScrolling);
      window.removeEventListener('scroll', markScrolling);
    };
  }, [idleMs]);

  /*
   * 必須回傳穩定的 identity。
   *
   * 曾經直接 `return { isActive, suppress }`，看起來人畜無害 —— 但 isActive/suppress
   * 雖然穩定，外層物件每次 render 都是新的。呼叫端把它放進 useEffect 的依賴陣列後，
   * 每一次 re-render 都會重跑 effect：在分析結果卡的欄位打一個字、或拖一下份量滑桿，
   * 畫面就被捲回卡片頂端 —— 正好變成這個 hook 本來要防止的「跟使用者搶畫面」。
   */
  return useMemo<UserScrollGuard>(() => ({ isActive, suppress }), [isActive, suppress]);
};
