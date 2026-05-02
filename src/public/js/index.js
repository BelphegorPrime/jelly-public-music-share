const authorizationHeader = 'Basic ' + btoa('admin:password');

// Define a global function for handling request access
window.requestAccess = function(songId, buttonElement) {
    // Show loading state to the button
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Requesting...';
    buttonElement.disabled = true;

    // Send POST request to the /api/request endpoint
    fetch('/api/request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': authorizationHeader
        },
        body: JSON.stringify({
            songId: songId
        })
    })
    .then(response => response.json()) // We're getting a JSON response
    .then(data => {
        // Handle the JSON response
        if (data.token && data.playUrl) {
            function copyPlayUrl() {
                const playUrl = data.playUrl;
                navigator.clipboard.writeText(playUrl).then(() => {
                    alert('Play URL copied to clipboard!');
                }).catch(err => {
                    alert('Failed to copy Play URL: ' + err);
                });
            }
            copyPlayUrl();
            buttonElement.textContent = 'Requested!';
        } else {
            // Handle error case
            alert('Error: Failed to request access to the song.');
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }
    })
    .catch(error => {
        console.error('Request error:', error);
        alert('An error occurred while requesting access. Please try again.');
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
    });
};

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const errorMessage = document.getElementById('errorMessage');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsList = document.getElementById('resultsList');

    function performSearch(event) {
        // Prevent form submission to avoid page reload
        if (event) {
            event.preventDefault();
        }
        
        const query = searchInput.value.trim();

        if (!query) {
            showError('Please enter a search query');
            return;
        }

        // Reset previous results
        hideError();
        showLoading();

        // Make AJAX request to search API
        fetch(`/api/search?query=${encodeURIComponent(query)}`, {
            headers: {
                "authorization": authorizationHeader
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showError(data.error);
                } else {
                    displayResults(data.results);
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                showError('An error occurred while searching. Please try again.');
            });
    }

    function showLoading() {
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = '<div class="loading">Searching...</div>';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function displayResults(results) {
        if (!results || results.length === 0) {
            resultsContainer.style.display = 'block';
            resultsList.innerHTML = '<div class="no-results">No songs found matching your search.</div>';
            return;
        }

        let html = '';
        results.forEach(song => {
            html += `
                <div class="song-item">
                    <div class="song-image">
                        ${song.image ? `<img src="${song.image}" alt="${song.name}" style="width:100%;height:100%;">` : '<span>No Image</span>'}
                    </div>
                    <div class="song-info">
                        <div class="song-title">${song.name}</div>
                        <div class="song-details">
                            ${song.artist} • ${song.album || 'Unknown Album'} •
                            ${song.duration && (song.duration[0] > 0 || song.duration[1] > 0) ? `${song.duration[0] || 0}:${(song.duration[1] || 0).toString().padStart(2, '0')}` : ''}
                        </div>
                    </div>
                    <button class="request-button" data-song-id="${song.id}">Request Access</button>
                </div>
            `;
        });

        resultsContainer.style.display = 'block';
        resultsList.innerHTML = html;
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Attach event listeners to the newly created buttons
        document.querySelectorAll('.request-button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                button.addEventListener('click', function() {
                    const songId = this.getAttribute('data-song-id');
                    // Call the global function with the button element
                    window.requestAccess(songId, this);
                });
                button.setAttribute('data-listener-added', 'true');
            }
        });
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        resultsContainer.style.display = 'none';
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Search when clicking button
    searchButton.addEventListener('click', performSearch);

    // Search when pressing Enter in input field
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(e); // Pass event to preventDefault
        }
    });
    
    // Initialize with search functionality
    // Add a check to ensure search functionality works with the form
    const form = document.querySelector('.search-container');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
});