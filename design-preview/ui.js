export function applyGenreCounts(genreLinks, genreCounts) {
  genreLinks.forEach((genreLink) => {
    const genreCount = genreCounts[genreLink.getAttribute('href')];
    const countElement = genreLink.querySelector('span');

    if (genreCount !== undefined && countElement) {
      countElement.textContent = String(genreCount).padStart(2, '0');
    }
  });
}

export function applyMixtapeCatalog(cards, mixtapeCatalog) {
  cards.forEach((card, index) => {
    const mixtape = mixtapeCatalog[index];
    const labelElement = card.querySelector('small');
    const titleElement = card.querySelector('h3');

    if (mixtape && labelElement && titleElement) {
      labelElement.textContent = mixtape.label;
      titleElement.textContent = mixtape.title;
    }
  });
}

export function applyEventCatalog(eventElements, eventCatalog) {
  eventElements.forEach((eventElement, index) => {
    const event = eventCatalog[index];
    const dateElement = eventElement.querySelector('.date');
    const dayElement = dateElement?.querySelector('span');
    const titleElement = eventElement.querySelector('h3');
    const detailsElement = eventElement.querySelector('p');

    if (event && dateElement && dayElement && titleElement && detailsElement) {
      dateElement.firstChild.textContent = event.month;
      dayElement.textContent = event.day;
      titleElement.textContent = event.title;
      detailsElement.textContent = event.details;
    }
  });
}

export function applySocialPlatforms(socialLinks, socialPlatforms) {
  socialLinks.forEach((socialLink, index) => {
    const platform = socialPlatforms[index];

    if (platform) {
      socialLink.textContent = platform;
      socialLink.setAttribute('aria-label', `Visit ${platform}`);
    }
  });
}

export function applyMusicPlatforms(platformLinks, musicPlatforms) {
  platformLinks.forEach((platformLink, index) => {
    const platform = musicPlatforms[index];

    if (platform) {
      platformLink.textContent = platform;
      platformLink.setAttribute('aria-label', `Listen on ${platform}`);
    }
  });
}

export function applyGalleryDescriptions(images, galleryCatalog) {
  images.forEach((image, index) => {
    const description = galleryCatalog[index];

    if (description) {
      image.alt = description;
    }
  });
}
