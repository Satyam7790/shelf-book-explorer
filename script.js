const API_KEY = 'AIzaSyChzsm5k4Osk34V_FduwDmDdNQsQ3IF7WY';
const bookContainer = document.getElementById('book-container');
const loadingState = document.getElementById('loading-state');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterButtons = document.querySelectorAll('.filter-btn');

let allBooks = [];

async function fetchBooks(query = 'subject:fiction') {
    loadingState.style.display = 'flex';
    bookContainer.innerHTML = ''; 

    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        allBooks = data.items || [];
        renderBooks(allBooks);
    } catch (error) {
        console.error("Error fetching data:", error);
        bookContainer.innerHTML = "<p>Error loading books. Please check your connection.</p>";
    } finally {
        loadingState.style.display = 'none';
    }
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // here the filter creates a new array with books that will match the search
    const filteredResults = allBooks.filter(book => {
        const title = book.volumeInfo.title.toLowerCase();
        const authors = book.volumeInfo.authors?.join(' ').toLowerCase() || "";
        return title.includes(searchTerm) || authors.includes(searchTerm);
    });

    renderBooks(filteredResults);
});

sortSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    let sortedList = [...allBooks];

    if (value === 'title-asc') {
        sortedList.sort((a, b) => a.volumeInfo.title.localeCompare(b.volumeInfo.title));
    } else if (value === 'title-desc') {
        sortedList.sort((a, b) => b.volumeInfo.title.localeCompare(a.volumeInfo.title));
    }

    renderBooks(sortedList);
});


filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const category = button.getAttribute('data-category');
        fetchBooks(`subject:${category}`);
    });
});

function renderBooks(booksToDisplay) {
    bookContainer.innerHTML = '';

    if (booksToDisplay.length === 0) {
        bookContainer.innerHTML = '<p class="no-results">No books found matching your criteria.</p>';
        return;
    }

    booksToDisplay.forEach(book => {
        const info = book.volumeInfo;
        const card = document.createElement('div');
        card.className = 'book-card';

        let thumb = info.imageLinks?.thumbnail || 'https://via.placeholder.com/150x220?text=No+Cover';
        thumb = thumb.replace('http://', 'https://');

        card.innerHTML = `
            <img src="${thumb}" alt="Book Cover">
            <div class="card-content">
                <h3>${info.title}</h3>
                <p>${info.authors ? info.authors[0] : 'Unknown Author'}</p>
                <span class="category-tag">${info.categories ? info.categories[0] : 'Book'}</span>
            </div>
        `;
        bookContainer.appendChild(card);
    });
}

fetchBooks();
