const API_KEY = 'AIzaSyChzsm5k4Osk34V_FduwDmDdNQsQ3IF7WY';
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
    // Force HTTPS only — do NOT add zoom=2 (causes silent blank image on most books)
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
        bookContainer.appendChild(card);
    });
}
 
searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        if (value.length > 2) {
            fetchBooks(value);
        } else if (value.length === 0) {
            fetchBooks('subject:fiction');
        }
    }, 500);
});
 
sortSelect.addEventListener('change', () => {
    const val = sortSelect.value;
    if (val === 'title-asc') {
        allBooks.sort((a, b) => (a.volumeInfo.title || '').localeCompare(b.volumeInfo.title || ''));
    } else if (val === 'newest') {
        allBooks.sort((a, b) => (b.volumeInfo.publishedDate || '').localeCompare(a.volumeInfo.publishedDate || ''));
    }
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
