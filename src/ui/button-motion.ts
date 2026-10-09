/**
 * A single motion language for every button, including controls inserted
 * later (notices and Mermaid exports). GSAP is vendored and loaded before the
 * entry module in index.html; event delegation keeps this independent of how
 * a button was created.
 */

interface TweenVars {
  [key: string]: unknown;
  duration?: number;
  ease?: string;
  onComplete?: () => void;
}

interface Timeline {
  fromTo(target: Element, from: TweenVars, to: TweenVars, position?: number | string): Timeline;
  to(target: Element, vars: TweenVars, position?: number | string): Timeline;
}

interface Gsap {
  killTweensOf(target: Element): void;
  set(target: Element, vars: TweenVars): void;
  timeline(vars?: TweenVars): Timeline;
  to(target: Element, vars: TweenVars): unknown;
}

declare global {
  interface Window {
    gsap?: Gsap;
  }
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function buttonFrom(target: EventTarget | null): HTMLButtonElement | null {
  const button = target instanceof Element ? target.closest<HTMLButtonElement>('button') : null;
  return button && !button.disabled ? button : null;
}

function release(button: HTMLButtonElement, gsap: Gsap): void {
  gsap.killTweensOf(button);
  gsap.to(button, {
    scaleX: 1,
    scaleY: 1,
    y: 0,
    duration: 0.18,
    ease: 'expo.out',
    clearProps: 'transform',
    onComplete: () => button.classList.remove('button-motion-active'),
  });
}

/** A narrow carriage sweep: the playful accent on top of the mechanical press. */
function sweep(button: HTMLButtonElement, gsap: Gsap): void {
  for (const old of button.querySelectorAll(':scope > .button-motion-sweep')) {
    gsap.killTweensOf(old);
    old.remove();
  }
  const line = document.createElement('span');
  line.className = 'button-motion-sweep';
  line.ariaHidden = 'true';
  button.classList.add('button-motion');
  button.append(line);

  gsap.set(line, { x: -28, opacity: 0, scaleX: 0.45, transformOrigin: '50% 50%' });
  gsap.timeline()
    .to(line, { x: button.clientWidth + 28, opacity: 0.16, scaleX: 1, duration: 0.24, ease: 'power2.inOut' })
    .to(line, { opacity: 0, duration: 0.07, ease: 'power2.out', onComplete: () => line.remove() }, '-=0.035');
}

/** Bind once at document level so future buttons inherit the same feedback. */
export function bindButtonMotion(root: Document = document): void {
  const pressed = new Map<number, HTMLButtonElement>();

  root.addEventListener('pointerdown', event => {
    if (reducedMotion.matches || event.button !== 0) return;
    const button = buttonFrom(event.target);
    const gsap = window.gsap;
    if (!button || !gsap) return;
    pressed.set(event.pointerId, button);
    button.classList.add('button-motion-active');
    gsap.killTweensOf(button);
    gsap.to(button, { scaleX: 0.985, scaleY: 0.94, y: 1, duration: 0.06, ease: 'power2.out' });
  }, true);

  const releasePointer = (event: PointerEvent) => {
    const button = pressed.get(event.pointerId);
    pressed.delete(event.pointerId);
    const gsap = window.gsap;
    if (button && gsap) release(button, gsap);
  };
  window.addEventListener('pointerup', releasePointer, true);
  window.addEventListener('pointercancel', releasePointer, true);

  root.addEventListener('click', event => {
    if (reducedMotion.matches) return;
    const button = buttonFrom(event.target);
    const gsap = window.gsap;
    if (!button || !gsap) return;
    // Keyboard activation has no pointerdown, so give it the same press/release.
    if (event.detail === 0) {
      button.classList.add('button-motion-active');
      gsap.killTweensOf(button);
      gsap.timeline()
        .to(button, { scaleX: 0.985, scaleY: 0.94, y: 1, duration: 0.06, ease: 'power2.out' })
        .to(button, {
          scaleX: 1,
          scaleY: 1,
          y: 0,
          duration: 0.18,
          ease: 'expo.out',
          clearProps: 'transform',
          onComplete: () => button.classList.remove('button-motion-active'),
        });
    }
    sweep(button, gsap);
  }, true);
}
