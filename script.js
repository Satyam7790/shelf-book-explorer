
const bookContainer = document.getElementById('book-container');
const loadingState = document.getElementById('loading-state');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterButtons = document.querySelectorAll('.filter-btn');
const loadMoreBtn = document.getElementById('load-more-btn');

let allBooks = [];
let currentIndex = 0;
let currentQuery = 'subject:fiction';
let searchTimer;

function getPlaceholderSVG(title = '') {
    const letter = title.charAt(0).toUpperCase() || '?';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
        <rect width="200" height="300" fill="#e8ddd0"/>
        <rect x="20" y="20" width="160" height="260" fill="#f5efe8" rx="2"/>
        <text x="100" y="155" font-family="Georgia,serif" font-size="64" fill="#8b5e3c" text-anchor="middle" dominant-baseline="middle">${letter}</text>
        <text x="100" y="230" font-family="Georgia,serif" font-size="11" fill="#a07850" text-anchor="middle">No Cover</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function getThumbnail(imageLinks) {
    if (!imageLinks) return null;
    const raw = imageLinks.extraLarge
        || imageLinks.large
        || imageLinks.medium
        || imageLinks.small
        || imageLinks.thumbnail
        || imageLinks.smallThumbnail
        || null;
    if (!raw) return null;
    return raw.replace(/^http:\/\//i, 'https://');
}

async function fetchBooks(query, isLoadMore = false) {
    loadingState.style.display = 'block';
    if (!isLoadMore) {
        currentIndex = 0;
        allBooks = [];
        bookContainer.innerHTML = '';
        currentQuery = query;
    }
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&startIndex=${currentIndex}&maxResults=40&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const withImages = data.items.filter(book => getThumbnail(book.volumeInfo?.imageLinks));
            allBooks = [...allBooks, ...withImages];
            currentIndex += 40;
            if (allBooks.length < 8 && currentIndex < 200) {
                return fetchBooks(currentQuery, true);
            }
            renderBooks(allBooks);
            loadMoreBtn.style.display = allBooks.length > 0 ? 'inline-block' : 'none';
        } else {
            if (!isLoadMore) {
                bookContainer.innerHTML = '<p style="text-align:center;padding:4rem;color:var(--wood-light);font-style:italic;">No matches found in the archives.</p>';
            }
            loadMoreBtn.style.display = 'none';
        }
    } catch (e) {
        console.error('Archive Error', e);
        bookContainer.innerHTML = '<p style="text-align:center;padding:4rem;color:var(--wood-light);font-style:italic;">Could not reach the archive. Please try again.</p>';
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderBooks(booksToDisplay) {
    bookContainer.innerHTML = '';
    booksToDisplay.forEach(book => {
        const info = book.volumeInfo;
        const thumbnail = getThumbnail(info.imageLinks);
        const fallbackSrc = getPlaceholderSVG(info.title);

        const card = document.createElement('div');
        card.className = 'book-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `View details for ${info.title}`);

        const img = document.createElement('img');
        img.alt = info.title || 'Book Cover';
        img.src = thumbnail || fallbackSrc;
        img.onerror = function () {
            this.onerror = null;
            this.src = getPlaceholderSVG(info.title);
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'img-wrapper';
        wrapper.appendChild(img);

        const title = document.createElement('h3');
        title.textContent = info.title || 'Unknown Title';

        const author = document.createElement('p');
        author.textContent = info.authors ? info.authors[0] : 'Unknown Author';

        card.appendChild(wrapper);
        card.appendChild(title);
        card.appendChild(author);

        card.addEventListener('click', () => openModal(book));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') openModal(book);
        });

        bookContainer.appendChild(card);
    });
}

function buildStars(rating) {
    if (!rating) return '<span class="no-rating">No rating</span>';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let html = '<span class="stars">';
    for (let i = 0; i < full; i++) html += '<span class="star filled">★</span>';
    if (half) html += '<span class="star half">★</span>';
    for (let i = 0; i < empty; i++) html += '<span class="star empty">★</span>';
    html += `<span class="rating-num">${rating.toFixed(1)} / 5</span></span>`;
    return html;
}

function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function openModal(book) {
    const info = book.volumeInfo;
    const overlay = document.getElementById('modal-overlay');

    const thumbnail = getThumbnail(info.imageLinks);
    const coverSrc = thumbnail || getPlaceholderSVG(info.title);

    const categories = info.categories ? info.categories.join(', ') : null;
    const pageCount = info.pageCount ? `${info.pageCount} pages` : null;
    const publisher = info.publisher || null;
    const language = info.language ? info.language.toUpperCase() : null;
    const isbn = info.industryIdentifiers
        ? (info.industryIdentifiers.find(i => i.type === 'ISBN_13') || info.industryIdentifiers[0])?.identifier
        : null;

    const metaParts = [
        publisher && `<div class="meta-item"><span class="meta-label">Publisher</span><span class="meta-value">${publisher}</span></div>`,
        pageCount && `<div class="meta-item"><span class="meta-label">Length</span><span class="meta-value">${pageCount}</span></div>`,
        categories && `<div class="meta-item"><span class="meta-label">Genre</span><span class="meta-value">${categories}</span></div>`,
        language && `<div class="meta-item"><span class="meta-label">Language</span><span class="meta-value">${language}</span></div>`,
        isbn && `<div class="meta-item"><span class="meta-label">ISBN</span><span class="meta-value">${isbn}</span></div>`,
    ].filter(Boolean).join('');

    const previewLink = info.previewLink
        ? `<a href="${info.previewLink}" target="_blank" rel="noopener" class="modal-btn preview-btn">Preview on Google Books</a>`
        : '';
    const infoLink = info.infoLink
        ? `<a href="${info.infoLink}" target="_blank" rel="noopener" class="modal-btn info-btn">More Info</a>`
        : '';

    overlay.innerHTML = `
        <div class="modal-card" role="dialog" aria-modal="true" aria-label="${info.title}">
            <button class="modal-close" aria-label="Close">&times;</button>

            <div class="modal-top">
                <div class="modal-cover-wrap">
                    <img class="modal-cover" src="${coverSrc}" alt="${info.title} cover"
                        onerror="this.onerror=null;this.src='${getPlaceholderSVG(info.title)}'">
                </div>
                <div class="modal-hero">
                    <div class="modal-category-tag">${categories || 'Book'}</div>
                    <h2 class="modal-title">${info.title}</h2>
                    ${info.subtitle ? `<p class="modal-subtitle">${info.subtitle}</p>` : ''}
                    <p class="modal-author">${info.authors ? info.authors.join(', ') : 'Unknown Author'}</p>
                    <div class="modal-rating">${buildStars(info.averageRating)}
                        ${info.ratingsCount ? `<span class="ratings-count">${info.ratingsCount.toLocaleString()} reviews</span>` : ''}
                    </div>
                    <div class="modal-date">
                        <span class="meta-label">Published</span>
                        <span class="meta-value">${formatDate(info.publishedDate)}</span>
                    </div>
                    <div class="modal-actions">
                        ${previewLink}
            
                    </div>
                </div>
            </div>

            ${info.description ? `
            <div class="modal-section">
                <h3 class="modal-section-title">About this book</h3>
                <div class="modal-description" id="modal-desc">
                    <p>${info.description}</p>
                </div>
                <button class="read-more-btn" id="read-more-btn">Read more</button>
            </div>` : ''}

            ${metaParts ? `
            <div class="modal-section">
                <h3 class="modal-section-title">Details</h3>
                <div class="modal-meta">${metaParts}</div>
            </div>` : ''}
        </div>
    `;

    overlay.classList.add('active');
    document.body.classList.add('modal-open');

    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', handleEsc);

    const descEl = overlay.querySelector('#modal-desc');
    const readMoreBtn = overlay.querySelector('#read-more-btn');
    if (descEl && readMoreBtn) {
        if (descEl.scrollHeight <= 120) {
            readMoreBtn.style.display = 'none';
        } else {
            readMoreBtn.addEventListener('click', () => {
                descEl.classList.toggle('expanded');
                readMoreBtn.textContent = descEl.classList.contains('expanded') ? 'Show less' : 'Read more';
            });
        }
    }
    requestAnimationFrame(() => {
        overlay.querySelector('.modal-card').classList.add('modal-card--in');
    });
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const card = overlay.querySelector('.modal-card');
    if (card) card.classList.remove('modal-card--in');
    setTimeout(() => {
        overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
    }, 300);
    document.removeEventListener('keydown', handleEsc);
}

function handleEsc(e) {
    if (e.key === 'Escape') closeModal();
}


searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        if (value.length > 2) fetchBooks(value);
        else if (value.length === 0) fetchBooks('subject:fiction');
    }, 500);
});

sortSelect.addEventListener('change', () => {
    const val = sortSelect.value;
    if (val === 'title-asc') allBooks.sort((a, b) => (a.volumeInfo.title || '').localeCompare(b.volumeInfo.title || ''));
    else if (val === 'newest') allBooks.sort((a, b) => (b.volumeInfo.publishedDate || '').localeCompare(a.volumeInfo.publishedDate || ''));
    renderBooks(allBooks);
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fetchBooks(`subject:${btn.dataset.category}`);
    });
});

loadMoreBtn.addEventListener('click', () => fetchBooks(currentQuery, true));

fetchBooks('subject:fiction');
