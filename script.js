const API_KEY = 'AIzaSyChzsm5k4Osk34V_FduwDmDdNQsQ3IF7WY';
const bookContainer = document.getElementById('book-container');
const loadingState = document.getElementById('loading-state');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterButtons = document.querySelectorAll('.filter-btn');

let allBooks = [];

async function fetchBooks(query = 'subject:fiction') {
    loadingState.style.display = 'block';
    bookContainer.innerHTML = '';

    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API limit reached or invalid key');
        
        const data = await response.json();
        allBooks = data.items || [];
        renderBooks(allBooks);
    } catch (error) {
        console.error("Error:", error);
        bookContainer.innerHTML = `<p class="error">Something went wrong. Please try again later.</p>`;
    } finally {
        loadingState.style.display = 'none';
    }
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    const filteredResults = allBooks.filter(book => {
        const title = book.volumeInfo.title.toLowerCase();
        const authors = book.volumeInfo.authors?.join(' ').toLowerCase() || "";
        return title.includes(term) || authors.includes(term);
    });

    renderBooks(filteredResults);
});

sortSelect.addEventListener('change', (e) => {
    const mode = e.target.value;
    let sortedData = [...allBooks]; 

    if (mode === 'title-asc') {
        sortedData.sort((a, b) => a.volumeInfo.title.localeCompare(b.volumeInfo.title));
    } else if (mode === 'newest') {
        sortedData.sort((a, b) => {
            const yearA = a.volumeInfo.publishedDate?.slice(0, 4) || "0";
            const yearB = b.volumeInfo.publishedDate?.slice(0, 4) || "0";
            return yearB - yearA; 
        });
    }
    
    renderBooks(sortedData);
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-category');
        fetchBooks(`subject:${category}`);
    });
});

function renderBooks(booksToDisplay) {
    bookContainer.innerHTML = '';
    const validBooks = booksToDisplay.filter(book => {
        const info = book.volumeInfo;
        const hasLinks = info.imageLinks && info.imageLinks.thumbnail;
        
        if (!hasLinks) return false;

        const isPlaceholder = info.imageLinks.thumbnail.includes('id=0') || 
            info.imageLinks.thumbnail.includes('printsec=frontcover&img=1&zoom=1&source=gbs_api');
        
        return !isPlaceholder;
    });

    if (validBooks.length === 0) {
        bookContainer.innerHTML = '<p class="no-results">No books with available covers found.</p>';
        return;
    }

    validBooks.forEach(book => {
        const info = book.volumeInfo;
        let lowRes = info.imageLinks.thumbnail.replace('http://', 'https://');
        const highRes = lowRes.replace('zoom=1', 'zoom=2');

        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <div class="img-wrapper">
                <img 
                    src="${highRes}" 
                    onerror="this.onerror=null; this.src='${lowRes}';" 
                    alt="Book Cover"
                    loading="lazy"
                >
            </div>
            <div class="card-content">
                <h3>${info.title}</h3>
                <p class="author">${info.authors ? info.authors[0] : 'Unknown Author'}</p>
                <p class="year">${info.publishedDate?.slice(0, 4) || 'N/A'}</p>
            </div>
        `;
        bookContainer.appendChild(card);
    });
}

window.onload = () => fetchBooks();
