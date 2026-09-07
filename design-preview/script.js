import {
  eventCatalog,
  galleryCatalog,
  genreCounts,
  mixtapeCatalog,
  musicPlatforms,
  socialPlatforms
} from './data.js';
import {
  applyEventCatalog,
  applyGalleryDescriptions,
  applyGenreCounts,
  applyMixtapeCatalog,
  applyMusicPlatforms,
  applySocialPlatforms
} from './ui.js';

const menuButton = document.querySelector('.mobile');
const siteNavigation = document.querySelector('#site-navigation');

function setMenuState(isOpen) {
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  siteNavigation.classList.toggle('is-open', isOpen);
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  setMenuState(!isOpen);
});

siteNavigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    setMenuState(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenuState(false);
    menuButton.focus();
  }
});

document.addEventListener('click', (event) => {
  const clickedInsideHeader = event.target.closest('header');

  if (!clickedInsideHeader && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenuState(false);
  }
});

applyGenreCounts(document.querySelectorAll('.genre'), genreCounts);
applyMixtapeCatalog(document.querySelectorAll('.card'), mixtapeCatalog);
applyEventCatalog(document.querySelectorAll('.event'), eventCatalog);
applySocialPlatforms(document.querySelectorAll('#about .ghost'), socialPlatforms);

const platformLinks = document.querySelectorAll('.genres');
const externalPlatformLinks = platformLinks[platformLinks.length - 1]?.querySelectorAll('.genre');

applyMusicPlatforms(externalPlatformLinks ?? [], musicPlatforms);
applyGalleryDescriptions(document.querySelectorAll('.social img'), galleryCatalog);

const searchForm = document.querySelector('.site-search');
const searchInput = document.querySelector('#site-search-input');
const searchStatus = document.querySelector('#search-status');
const searchableSections = document.querySelectorAll('main section');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const searchTerm = searchInput.value.trim().toLowerCase();
  const matchingSections = Array.from(searchableSections).filter((section) => {
    return searchTerm && section.textContent.toLowerCase().includes(searchTerm);
  });

  if (!searchTerm) {
    searchStatus.textContent = 'Enter a search term.';
    return;
  }

  searchStatus.textContent = `${matchingSections.length} matching section${matchingSections.length === 1 ? '' : 's'} found.`;

  if (matchingSections.length > 0) {
    matchingSections[0].scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  }
});

const audioPlayers = document.querySelectorAll('audio');

audioPlayers.forEach((audioPlayer) => {
  audioPlayer.addEventListener('play', () => {
    audioPlayers.forEach((otherAudioPlayer) => {
      if (otherAudioPlayer !== audioPlayer) {
        otherAudioPlayer.pause();
      }
    });
  });
});
