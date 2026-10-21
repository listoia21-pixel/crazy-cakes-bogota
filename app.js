(() => {
  'use strict';

  const ready = () => {
    const menuToggle = document.querySelector('#menu-toggle');
    const navigation = document.querySelector('#main-nav');
    const setMenuOpen = (open) => {
      if (!menuToggle || !navigation) return;
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      navigation.classList.toggle('is-open', open);
      navigation.dataset.open = String(open);
    };

    menuToggle?.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    navigation?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    const filters = [...document.querySelectorAll('[data-filter]')];
    const galleryGrid = document.querySelector('#gallery-grid') || document.querySelector('.gallery-grid');
    const galleryStatus = document.querySelector('#gallery-status');
    const galleryCounter = document.querySelector('#gallery-counter');
    const loadMore = document.querySelector('#gallery-load-more');
    const galleryDialog = document.querySelector('#gallery-dialog');
    const dialogImage = document.querySelector('#dialog-image');
    const dialogTitle = document.querySelector('#dialog-title');
    const dialogInstagram = document.querySelector('#dialog-instagram');
    const closeGallery = document.querySelector('#close-gallery');
    const galleryPrevious = document.querySelector('#gallery-prev');
    const galleryNext = document.querySelector('#gallery-next');
    const galleryPosition = document.querySelector('#gallery-position');
    const categoryLabels = new Map(filters.map((button) => [button.dataset.filter, button.textContent.trim()]));
    const instagramHome = 'https://www.instagram.com/crazycakesbogota/';
    const pageSize = 12;
    const dynamicGallery = Boolean(galleryGrid) && Array.isArray(window.CRAZY_CAKES_PORTFOLIO);
    let galleryTrigger = null;
    let galleryIndex = -1;
    let shownCount = 0;
    let activeCategory = 'all';
    let matchingItems = [];

    const itemCategories = (item) => {
      const values = Array.isArray(item.categories) ? item.categories : [item.category];
      return [...new Set(values.filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim()))];
    };
    const safeImage = (value) => {
      if (typeof value !== 'string' || !value.trim()) return '';
      try {
        const url = new URL(value, document.baseURI);
        if (url.protocol === 'https:' || url.protocol === 'http:'
          || (url.protocol === 'file:' && document.location.protocol === 'file:')) return value;
      } catch {
        // Incomplete data is skipped instead of creating a broken gallery control.
      }
      return '';
    };
    const safeInstagram = (value) => {
      try {
        const url = new URL(value);
        if (url.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(url.hostname)) {
          return url.href;
        }
      } catch {
        // A portfolio entry without its own post uses the business profile.
      }
      return instagramHome;
    };
    const categoryLabel = (category) => categoryLabels.get(category)
      || category.replace(/-/g, ' ');

    const portfolioItems = dynamicGallery
      ? window.CRAZY_CAKES_PORTFOLIO.filter((item) => item && typeof item === 'object')
        .map((item, index) => ({
          key: `portfolio-${index}`,
          image: safeImage(item.image),
          title: typeof item.title === 'string' && item.title.trim()
            ? item.title.trim() : 'Creación de Crazy Cakes Bogotá',
          alt: typeof item.alt === 'string' ? item.alt.trim() : '',
          categories: itemCategories(item),
          post: safeInstagram(item.post),
        })).filter((item) => item.image)
      : [...(galleryGrid?.querySelectorAll('[data-category]') || [])].map((card, index) => {
        const button = card.querySelector('[data-gallery]');
        return {
          key: `fallback-${index}`,
          image: safeImage(button?.dataset.image || card.querySelector('img')?.getAttribute('src')),
          title: button?.dataset.title || card.querySelector('h3')?.textContent.trim()
            || 'Creación de Crazy Cakes Bogotá',
          alt: card.querySelector('img')?.alt || '',
          categories: [card.dataset.category],
          post: safeInstagram(button?.dataset.post),
          element: card,
        };
      });

    const createGalleryCard = (item, index) => {
      const card = document.createElement('article');
      card.className = 'creation-card';
      card.dataset.category = item.categories[0] || '';
      card.dataset.categories = item.categories.join(' ');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.gallery = '';
      button.dataset.galleryId = item.key;
      button.dataset.image = item.image;
      button.dataset.title = item.title;
      button.dataset.post = item.post;
      button.setAttribute('aria-label', `Ampliar: ${item.title}`);
      const photo = document.createElement('div');
      photo.className = 'card-photo';
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.alt || item.title;
      image.width = 600;
      image.height = 700;
      image.loading = 'lazy';
      image.decoding = 'async';
      const arrow = document.createElement('span');
      arrow.className = 'photo-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      const tag = document.createElement('span');
      tag.className = 'card-tag';
      const tagCategory = activeCategory === 'all' ? item.categories[0] : activeCategory;
      tag.textContent = tagCategory ? categoryLabel(tagCategory).toLocaleUpperCase('es-CO') : 'CREACIÓN CRAZY';
      photo.append(image, arrow, tag);
      const heading = document.createElement('div');
      heading.className = 'card-title';
      const title = document.createElement('h3');
      title.textContent = item.title;
      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      heading.append(title, number);
      button.append(photo, heading);
      card.append(button);
      return card;
    };

    const updateGalleryCount = () => {
      const total = matchingItems.length;
      const text = `Mostrando ${shownCount} de ${total} fotos`;
      if (galleryCounter) galleryCounter.textContent = text;
      if (galleryStatus) {
        const label = activeCategory === 'all' ? 'el portafolio' : categoryLabel(activeCategory);
        galleryStatus.textContent = `${total} ${total === 1 ? 'foto' : 'fotos'} en ${label}. ${text}.`;
      }
      if (loadMore) loadMore.hidden = !dynamicGallery || shownCount >= total;
    };
    const appendGalleryPage = () => {
      if (!galleryGrid) return null;
      const fragment = document.createDocumentFragment();
      const end = Math.min(shownCount + pageSize, matchingItems.length);
      let firstNewCard = null;
      for (let index = shownCount; index < end; index += 1) {
        const card = createGalleryCard(matchingItems[index], index);
        if (!firstNewCard) firstNewCard = card;
        fragment.append(card);
      }
      galleryGrid.append(fragment);
      shownCount = end;
      updateGalleryCount();
      return firstNewCard;
    };
    const filterGallery = (category) => {
      activeCategory = category || 'all';
      matchingItems = portfolioItems.filter((item) => activeCategory === 'all'
        || item.categories.includes(activeCategory));
      filters.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.filter === activeCategory));
      });
      if (dynamicGallery) {
        galleryGrid.replaceChildren();
        shownCount = 0;
        appendGalleryPage();
      } else {
        portfolioItems.forEach((item) => {
          item.element.hidden = !matchingItems.includes(item);
          const button = item.element.querySelector('[data-gallery]');
          if (button) button.dataset.galleryId = item.key;
        });
        shownCount = matchingItems.length;
        updateGalleryCount();
      }
    };
    filters.forEach((button) => {
      button.addEventListener('click', () => filterGallery(button.dataset.filter));
    });
    filterGallery(filters.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.filter || 'all');
    loadMore?.addEventListener('click', () => {
      const firstNewCard = appendGalleryPage();
      firstNewCard?.querySelector('button')?.focus();
    });

    const showGalleryImage = (index, openDialog = false) => {
      if (!galleryDialog || !dialogImage || !dialogTitle || !matchingItems.length) return;
      galleryIndex = (index + matchingItems.length) % matchingItems.length;
      const item = matchingItems[galleryIndex];
      dialogTitle.textContent = item.title;
      dialogImage.src = item.image;
      dialogImage.alt = item.alt || item.title;
      if (dialogInstagram) dialogInstagram.href = item.post;
      if (galleryPosition) galleryPosition.textContent = `${galleryIndex + 1} de ${matchingItems.length}`;
      if (galleryPrevious) galleryPrevious.disabled = matchingItems.length < 2;
      if (galleryNext) galleryNext.disabled = matchingItems.length < 2;
      if (openDialog && !galleryDialog.open) {
        galleryDialog.showModal();
        closeGallery?.focus();
      }
    };
    galleryGrid?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-gallery]');
      if (!button || !galleryGrid.contains(button)) return;
      const index = matchingItems.findIndex((item) => item.key === button.dataset.galleryId);
      if (index < 0) return;
      galleryTrigger = button;
      showGalleryImage(index, true);
    });
    galleryPrevious?.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
    galleryNext?.addEventListener('click', () => showGalleryImage(galleryIndex + 1));
    closeGallery?.addEventListener('click', () => galleryDialog?.close());
    galleryDialog?.addEventListener('keydown', (event) => {
      if (!galleryDialog.open || event.altKey || event.ctrlKey || event.metaKey
        || event.target.closest('input, textarea, select, [contenteditable], [role="textbox"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        showGalleryImage(galleryIndex + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    galleryDialog?.addEventListener('click', (event) => {
      if (event.target !== galleryDialog) return;
      const bounds = galleryDialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) galleryDialog.close();
    });
    galleryDialog?.addEventListener('close', () => {
      if (galleryTrigger?.isConnected) galleryTrigger.focus({ preventScroll: true });
    });

    const orderForm = document.querySelector('#order-form');
    const occasion = document.querySelector('#occasion');
    const eventDate = document.querySelector('#event-date');
    const servings = document.querySelector('#servings');
    const idea = document.querySelector('#idea');
    const customerName = document.querySelector('#customer-name');
    const summary = document.querySelector('#order-summary');
    const preview = document.querySelector('#order-preview');
    const messagePreview = document.querySelector('#message-preview');
    const sendOrder = document.querySelector('#send-order');
    const copyOrder = document.querySelector('#copy-order');
    const copyStatus = document.querySelector('#copy-status');
    let preparedMessage = '';

    if (eventDate) {
      const today = new Date();
      eventDate.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')].join('-');
    }

    const invalidatePreview = () => {
      if (!preparedMessage) return;
      preparedMessage = '';
      if (preview) preview.hidden = true;
      if (sendOrder) sendOrder.removeAttribute('href');
      if (copyStatus) copyStatus.textContent = '';
      if (summary) summary.textContent = 'Actualizaste tu idea. Prepara el mensaje de nuevo para incluir los cambios.';
    };
    orderForm?.addEventListener('input', () => {
      servings?.setCustomValidity('');
      invalidatePreview();
    });
    orderForm?.addEventListener('change', invalidatePreview);

    const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    document.querySelectorAll('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        if (occasion) {
          const choice = normalize(button.dataset.choice || '');
          const aliases = { tematicas: 'cumpleanos', figuras: 'cumpleanos', celebraciones: 'celebracion especial' };
          const options = [...occasion.options];
          const selected = options.find((option) => normalize(option.value) === choice || normalize(option.text) === choice)
            || options.find((option) => aliases[choice] && (normalize(option.value) === aliases[choice]
              || normalize(option.text) === aliases[choice]));
          if (selected) {
            occasion.value = selected.value;
            occasion.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        document.querySelector('#pedido')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'start',
        });
        occasion?.focus({ preventScroll: true });
      });
    });

    orderForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!occasion || !eventDate || !servings || !idea) return;
      const portions = Number(servings.value);
      servings.setCustomValidity(Number.isInteger(portions) && portions > 0
        ? '' : 'Indica un número entero de porciones mayor que cero.');
      if (!orderForm.reportValidity()) return;

      const dateParts = eventDate.value.split('-').map(Number);
      const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const formattedDate = new Intl.DateTimeFormat('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(date);
      const occasionText = occasion.selectedOptions[0]?.textContent.trim() || occasion.value;
      const name = customerName?.value.trim();
      preparedMessage = [
        '¡Hola, Crazy Cakes Bogotá! Quisiera consultar disponibilidad y cotizar una torta personalizada.',
        name ? `Mi nombre es ${name}.` : '',
        '',
        `Ocasión: ${occasionText}`,
        `Fecha del evento: ${formattedDate}`,
        `Porciones aproximadas: ${portions}`,
        `Mi idea: ${idea.value.trim()}`,
        '',
        '¿Me pueden orientar con el diseño y la cotización? ¡Gracias!',
      ].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n');

      if (messagePreview) messagePreview.textContent = preparedMessage;
      if (sendOrder) sendOrder.href = `https://wa.me/573171812316?text=${encodeURIComponent(preparedMessage)}`;
      if (preview) preview.hidden = false;
      if (copyStatus) copyStatus.textContent = '';
      if (summary) {
        summary.textContent = 'Tu mensaje está listo. Ábrelo en WhatsApp para consultar disponibilidad y cotización.';
      }
    });

    copyOrder?.addEventListener('click', async () => {
      if (!preparedMessage) return;
      const messageToCopy = preparedMessage;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(messageToCopy);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = messageToCopy;
          textArea.setAttribute('readonly', '');
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          const copied = document.execCommand('copy');
          textArea.remove();
          copyOrder.focus({ preventScroll: true });
          if (!copied) throw new Error('Clipboard unavailable');
        }
        if (copyStatus && preparedMessage === messageToCopy) copyStatus.textContent = 'Mensaje copiado.';
      } catch {
        if (copyStatus) copyStatus.textContent = 'No pudimos copiarlo automáticamente. Puedes seleccionar el mensaje y copiarlo.';
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
