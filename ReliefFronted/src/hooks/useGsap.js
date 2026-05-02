import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function usePageEntrance() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.auth-left',
        { opacity: 0, x: -48 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo('.auth-right',
        { opacity: 0, x: 48 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
      );
      gsap.fromTo('.auth-left-feature',
        { opacity: 0, x: -24 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.4 }
      );
    }, ref);
    return () => ctx.revert();
  }, []);
  return ref;
}

export function useFormEntrance(dep = []) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current.querySelectorAll('.form-row'),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out', clearProps: 'transform' }
      );
    }, ref);
    return () => ctx.revert();
  }, dep);
  return ref;
}

export function useStepTransition() {
  return (direction = 'forward') => {
    const x = direction === 'forward' ? [32, 0] : [-32, 0];
    gsap.fromTo('.step-content',
      { opacity: 0, x: x[0], scale: 0.98 },
      { opacity: 1, x: x[1], scale: 1, duration: 0.4, ease: 'power3.out', clearProps: 'transform' }
    );
  };
}

export function useCountUp(target, deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || target == null) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out', delay: 0.5,
      onUpdate() { if (ref.current) ref.current.textContent = Math.round(obj.v); }
    });
  }, [target, ...deps]);
  return ref;
}

export function useShake() {
  return (selector) => {
    gsap.fromTo(selector,
      { x: 0 },
      { x: [-8, 8, -6, 6, -3, 3, 0], duration: 0.5, ease: 'power2.out' }
    );
  };
}

export function useModalEntrance() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.92, y: 24 },
      { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.7)', clearProps: 'transform' }
    );
  }, []);
  return ref;
}

export { gsap };
