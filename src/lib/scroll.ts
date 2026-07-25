/**
 * 捲動輔助工具
 *
 * 為什麼不用 setTimeout：
 * 舊寫法 setTimeout(..., 100) 是在猜 React commit + layout 完成的時間點，
 * 機器慢或畫面複雜時會在元素還沒定位好就捲動，捲到錯的位置。
 * double requestAnimationFrame 保證跑在「commit 後的下一次 paint」之後，
 * 此時 layout 已穩定，元素的最終位置才是正確的。
 */

/** 尊重使用者的「減少動態效果」系統設定 */
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * 把元素捲進視線內。搭配 CSS 的 `.scroll-anchor`（scroll-margin-top）
 * 就不會被 sticky header + tab bar 遮住。
 */
export const scrollIntoViewSmart = (
  el: HTMLElement | null,
  block: ScrollLogicalPosition = 'start'
): void => {
  if (!el) return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior, block });
    });
  });
};
