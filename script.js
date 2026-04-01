const API_KEY = 'AIzaSyChzsm5k4Osk34V_FduwDmDdNQsQ3IF7WY'; 
const bookContainer = document.getElementById('book-container');
const loadingState = document.getElementById('loading-state');

async function fetchBooks(query = 'subject:fiction') {
    loadingState.style.display = 'block';
    bookContainer.innerHTML = ''; 

    // maxResults=20 gives us a good amount of data for the initial load //
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=20&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            displayBooks(data.items);
        } else {
            bookContainer.innerHTML = "<p>No books found for this category.</p>";
        }

    } catch (error) {
        console.error("Fetch error:", error.message);
        bookContainer.innerHTML = `<p>Error: Could not connect to the library. Please try again later.</p>`;
    } finally {
        loadingState.style.display = 'none';
    }
}


function displayBooks(books) {
    books.forEach(book => {
        const info = book.volumeInfo;
        
        const title = info.title || "Untitled";
        const authors = info.authors ? info.authors.join(', ') : "Unknown Author";
        
        let thumbnail = info.imageLinks ? info.imageLinks.thumbnail : 'https://via.placeholder.com/150x200?text=No+Cover';
        if (thumbnail.startsWith('http://')) {
            thumbnail = thumbnail.replace('http://', 'https://');
        }

        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';

        bookCard.innerHTML = `
            <div class="book-image">
                <img src="${thumbnail}" alt="${title}">
            </div>
            <div class="book-info">
                <h3>${title}</h3>
                <p class="author">${authors}</p>
                <button class="view-btn">View Details</button>
            </div>
        `;

        bookContainer.appendChild(bookCard);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
});
