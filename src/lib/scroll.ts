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
  block: ScrollLogicalPosition = 'start',
  /**
   * 額外延遲。用在等待 iOS 鍵盤彈出動畫（約 250-300ms）完成後再捲動，
   * 否則會捲到鍵盤還沒改變 viewport 之前的錯誤位置。
   */
  delayMs = 0
): void => {
  if (!el) return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  const run = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior, block });
      });
    });
  };
  if (delayMs > 0) setTimeout(run, delayMs);
  else run();
};

/**
 * 輸入框取得焦點時把自己捲進可視範圍。
 * iOS 原生也會捲，但不知道我們有 sticky footer，常把輸入框推到 footer 底下。
 */
export const scrollFieldIntoView = (
  event: { currentTarget: HTMLElement }
): void => {
  const el = event.currentTarget; // 必須同步取，事件結束後 currentTarget 會被清空
  scrollIntoViewSmart(el, 'center', 300);
};
