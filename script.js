const bookContainer = document.getElementById('book-container');
const loadingState = document.getElementById('loading-state');

async function fetchBooks() {
    loadingState.style.display = 'block';
    bookContainer.innerHTML = ''; 

    try {
        const response = await fetch('https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=12');
        const data = await response.json();

        displayBooks(data.items);
    } catch (error) {
        console.error("Error fetching books:", error);
        bookContainer.innerHTML = "<p>Opps! Something went wrong while loading books.</p>";
    } finally {
        loadingState.style.display = 'none';
    }
}

function displayBooks(books) {
    if (!books) return;

    books.forEach(book => {
        const info = book.volumeInfo;
        
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';

        const image = info.imageLinks ? info.imageLinks.thumbnail : 'https://via.placeholder.com/128x192?text=No+Cover';

        bookCard.innerHTML = `
            <img src="${image}" alt="${info.title}">
            <h3>${info.title}</h3>
            <p>${info.authors ? info.authors.join(', ') : 'Unknown Author'}</p>
        `;

        bookContainer.appendChild(bookCard);
    });
}

fetchBooks();
