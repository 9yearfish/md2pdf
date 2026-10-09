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
    duration: 0.22,
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

  const fullscreen = button.id === 'fullscreen-toggle';
  gsap.set(line, { x: -32, opacity: 0, scaleX: 0.35, transformOrigin: '50% 50%' });
  gsap.timeline()
    .to(line, {
      x: button.clientWidth + 32,
      opacity: fullscreen ? 0.34 : 0.24,
      scaleX: 1.1,
      duration: fullscreen ? 0.48 : 0.32,
      ease: 'power2.inOut',
    })
    .to(line, { opacity: 0, duration: 0.09, ease: 'power2.out', onComplete: () => line.remove() }, '-=0.045');
}

/**
 * Full-screen is a spatial change, not merely a pressed button. After the
 * layout switches, open the two work surfaces like a precise machine aperture.
 */
export function animateFullscreenTransition(on: boolean, root: Document = document): void {
  const gsap = window.gsap;
  const html = root.documentElement;
  if (reducedMotion.matches || !gsap) {
    html.classList.remove('fullscreen-transitioning');
    return;
  }

  const tool = root.querySelector<HTMLElement>('.tool');
  const actionbar = root.querySelector<HTMLElement>('.actionbar');
  const editor = root.querySelector<HTMLElement>('.editor-pane');
  const preview = root.querySelector<HTMLElement>('.preview-pane');
  const icon = root.querySelector<SVGElement>(`#fullscreen-toggle .icon-${on ? 'collapse' : 'expand'}`);
  if (!tool || !actionbar || !editor || !preview) return;

  for (const target of [tool, actionbar, editor, preview, icon].filter(Boolean) as Element[]) {
    gsap.killTweensOf(target);
  }
  html.classList.add('fullscreen-transitioning');

  gsap.timeline({
    onComplete: () => html.classList.remove('fullscreen-transitioning'),
  })
    .fromTo(tool,
      { opacity: 0.72, scaleY: 0.985, transformOrigin: '50% 0%' },
      { opacity: 1, scaleY: 1, duration: 0.48, ease: 'expo.out', clearProps: 'transform,opacity' })
    .fromTo(actionbar,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.035)
    .fromTo(editor,
      { opacity: 0.48, x: on ? -18 : -10 },
      { opacity: 1, x: 0, duration: 0.46, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.06)
    .fromTo(preview,
      { opacity: 0.48, x: on ? 18 : 10 },
      { opacity: 1, x: 0, duration: 0.46, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.06);

  if (icon) {
    gsap.timeline()
      .fromTo(icon,
        { opacity: 0, scale: 0.72, rotate: on ? -18 : 18, transformOrigin: '50% 50%' },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.42, ease: 'expo.out', clearProps: 'transform,opacity' });
  }
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
    gsap.to(button, { scaleX: 0.97, scaleY: 0.9, y: 2, duration: 0.08, ease: 'power2.out' });
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
        .to(button, { scaleX: 0.97, scaleY: 0.9, y: 2, duration: 0.08, ease: 'power2.out' })
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
