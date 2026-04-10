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


async function fetchBooks(query, isLoadMore = false) {
    loadingState.style.display = 'block';
    
    if (!isLoadMore) {
        currentIndex = 0;
        allBooks = [];
        bookContainer.innerHTML = '';
        currentQuery = query;
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=${currentIndex}&maxResults=40&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items) {
            allBooks = [...allBooks, ...data.items];
            
            currentIndex += 40;

            const filtered = allBooks.filter(book => 
                book.volumeInfo.imageLinks && book.volumeInfo.imageLinks.thumbnail
            );
            
            if (filtered.length < 8 && currentIndex < 160) {
                return fetchBooks(currentQuery, true);
            }

            renderBooks(allBooks);
            loadMoreBtn.style.display = 'inline-block';
        } else {
            if (!isLoadMore) bookContainer.innerHTML = "<p>No matches found in the archives.</p>";
            loadMoreBtn.style.display = 'none';
        }
    } catch (e) {
        console.error("Archive Error", e);
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderBooks(booksToDisplay) {
    bookContainer.innerHTML = '';

    const validOnes = booksToDisplay.filter(b => b.volumeInfo.imageLinks?.thumbnail);

    validOnes.forEach(book => {
        const info = book.volumeInfo;
        const img = info.imageLinks.thumbnail.replace('zoom=1', 'zoom=2').replace('http://', 'https://');

        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="img-wrapper">
                <img src="${img}" alt="Book Cover" onerror="this.src='https://via.placeholder.com/200x300?text=Archive+Copy'">
            </div>
            <h3>${info.title}</h3>
            <p>${info.authors ? info.authors[0] : 'Unknown Author'}</p>
        `;
        bookContainer.appendChild(card);
    });
}

searchInput.addEventListener('input', (e) => {
    const value = e.target.value;
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
        allBooks.sort((a, b) => a.volumeInfo.title.localeCompare(b.volumeInfo.title));
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
