/**
 * AnimatedCounter — Vanilla JS counter animation with IntersectionObserver.
 *
 * Usage:
 *   <div data-counter="34000000" data-suffix="+">...</div>
 *
 * The element's textContent is replaced with the animated count when it scrolls into view.
 * Supports prefix (e.g., "$") and suffix (e.g., "+", "%") via data-* attributes.
 */

interface CounterOptions {
  prefix?: string;
  suffix?: string;
  duration?: number; // ms, default 1200
  decimals?: number; // default 0
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function formatNumber(num: number, options: CounterOptions): string {
  const { prefix = '', suffix = '', decimals = 0 } = options;

  if (num >= 1_000_000_000) {
    return `${prefix}${(num / 1_000_000_000).toFixed(decimals)}B${suffix}`;
  } else if (num >= 1_000_000) {
    return `${prefix}${(num / 1_000_000).toFixed(decimals)}M${suffix}`;
  } else if (num >= 1_000) {
    return `${prefix}${Math.round(num).toLocaleString()}${suffix}`;
  } else {
    return `${prefix}${num.toFixed(decimals)}${suffix}`;
  }
}

function animateCounter(
  element: HTMLElement,
  targetValue: number,
  options: CounterOptions = {}
): void {
  const { duration = 1200, decimals = 0 } = options;
  let startTime: number | null = null;

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const currentValue = Math.floor(easedProgress * targetValue);

    element.textContent = formatNumber(currentValue, options);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Ensure final value is exact
      element.textContent = formatNumber(targetValue, options);
    }
  }

  requestAnimationFrame(step);
}

function initCounter(element: HTMLElement): void {
  const rawValue = element.getAttribute('data-counter');
  if (!rawValue) return;

  // Parse the number (remove $, commas, etc.)
  const numericString = rawValue.replace(/[^0-9.]/g, '');
  const targetValue = parseFloat(numericString);

  if (isNaN(targetValue)) return;

  const options: CounterOptions = {
    prefix: element.getAttribute('data-prefix') || '',
    suffix: element.getAttribute('data-suffix') || '',
    duration: parseInt(element.getAttribute('data-duration') || '1200', 10),
    decimals: parseInt(element.getAttribute('data-decimals') || '0', 10),
  };

  // Store original text for non-counter usage
  const originalText = element.textContent || '';
  element.dataset.originalText = originalText;

  animateCounter(element, targetValue, options);
}

export function initAnimatedCounters(): void {
  const counterElements = document.querySelectorAll<HTMLElement>('[data-counter]');

  if (counterElements.length === 0) return;

  const observerOptions: IntersectionObserverInit = {
    root: null, // viewport
    threshold: 0.2, // trigger when 20% visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initCounter(entry.target);
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  counterElements.forEach(el => observer.observe(el));
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimatedCounters);
  } else {
    initAnimatedCounters();
  }
}
