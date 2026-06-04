import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initJourney() {
  if (reduce) return; // fallback : stations empilées, toutes visibles, aucune animation

  const sections = gsap.utils.toArray<HTMLElement>('[data-station]');

  sections.forEach((section, i) => {
    const bg = section.querySelector('[data-anim="bg"]');
    const content = section.querySelector('[data-anim="content"]');

    // Cosmic zoom : le fond se rapproche pendant qu'on traverse la station (scrub)
    if (bg) {
      gsap.fromTo(
        bg,
        { scale: 1.18 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }

    // Révélation du contenu à l'entrée (one-shot, pour qu'il reste lisible)
    if (content && i > 0) {
      gsap.from(content, {
        autoAlpha: 0,
        y: 48,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 65%' },
      });
    }
  });

  // Barre de progression globale
  gsap.to('[data-progress]', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });
}

if (document.readyState !== 'loading') initJourney();
else document.addEventListener('DOMContentLoaded', initJourney);
