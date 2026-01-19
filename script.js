document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const searchInput = document.getElementById('searchInput');
    const itemsGrid = document.getElementById('itemsGrid');
    const modal = document.getElementById('uploadModal');
    const btnFound = document.getElementById('btnFound');
    const closeBtn = document.querySelector('.close-btn');
    const uploadForm = document.getElementById('uploadForm');
    const fileUpload = document.getElementById('fileUpload');
    const imagePreview = document.getElementById('imagePreview');
    const cameraInput = document.getElementById('cameraInput');

    const API_URL = "http://127.0.0.1:5000/api";

    // --- Load items on page load ---
    loadFoundItems();

    // --- 1. Search Logic (Filter displayed items) ---
    searchInput.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.item-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || "";
            const desc = card.querySelector('p')?.textContent.toLowerCase() || "";
            if(title.includes(term) || desc.includes(term)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });

    // --- 2. Camera Icon Logic ---
    cameraInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            // Optionally set it to file upload
            fileUpload.files = e.target.files;
            imagePreview.src = URL.createObjectURL(e.target.files[0]);
            imagePreview.hidden = false;
            modal.style.display = 'flex'; // Auto-open modal after camera capture
        }
    });

    // --- 3. Modal Logic ---
    btnFound.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        resetForm();
    });

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            resetForm();
        }
    }

    // --- 4. Image Preview Logic ---
    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.hidden = false;
            }
            reader.readAsDataURL(file);
        }
    });

    // --- 5. Submit Found Item to Backend ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const description = document.getElementById('itemName').value.trim();
        const location = document.getElementById('itemLocation').value.trim();
        const itemDescription = document.getElementById('itemDescription').value.trim();
        const imageFile = fileUpload.files[0];

        if(!description || !location) {
            alert("Please fill in description and location!");
            return;
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('description', description);
        formData.append('location', location);
        formData.append('itemDescription', itemDescription);
        if(imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`${API_URL}/items`, {
                method: 'POST',
                body: formData
            });

            if(response.ok) {
                const result = await response.json();
                alert("Item submitted successfully!");
                modal.style.display = 'none';
                resetForm();
                loadFoundItems(); // Refresh the grid
            } else {
                const error = await response.json();
                alert("Error: " + (error.error || "Failed to submit item"));
            }
        } catch(err) {
            alert("Network error: " + err.message);
        }
    });

    // --- Load and Display Found Items from Backend ---
    async function loadFoundItems() {
        try {
            const response = await fetch(`${API_URL}/items`);
            if(!response.ok) throw new Error("Failed to load items");

            const items = await response.json();
            itemsGrid.innerHTML = ""; // Clear existing

            if(items.length === 0) {
                itemsGrid.innerHTML = '<p style="text-align:center; color:#999; grid-column:1/-1;">No items found yet. Be the first to report something!</p>';
                return;
            }

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';
                card.setAttribute('data-id', item.id); // Store item ID for deletion
                
                const imgSrc = item.image ? `http://127.0.0.1:5000/static/images/${item.image}` : 'https://via.placeholder.com/300?text=No+Image';
                const timeAgo = getTimeAgo(item.timestamp);
                const category = extractCategory(item.description);

                card.innerHTML = `
                    <img src="${imgSrc}" alt="${item.description}" onerror="this.src='https://via.placeholder.com/300?text=Image+Not+Found'">
                    <div class="card-info">
                        <h3>${truncate(item.description, 30)}</h3>
                        <p>Found at: ${item.location}</p>
                        ${item.itemDescription ? `<p class="item-details"><small>📝 ${truncate(item.itemDescription, 60)}</small></p>` : ''}
                        <p class="ai-suggestion"><small>💡 ${truncate(item.ai_suggestion, 50)}</small></p>
                        <span class="tag">${category}</span>
                        <span class="time-badge">${timeAgo}</span>
                        <button class="btn-delete" onclick="deleteItem(${item.id}, this)">🗑️ Delete</button>
                    </div>
                `;
                itemsGrid.appendChild(card);
            });
        } catch(err) {
            console.error("Error loading items:", err);
            itemsGrid.innerHTML = '<p style="color:red; grid-column:1/-1;">Failed to load items. Make sure backend is running!</p>';
        }
    }

    function resetForm() {
        uploadForm.reset();
        imagePreview.hidden = true;
        imagePreview.src = "";
    }

    function truncate(str, len) {
        return str.length > len ? str.substring(0, len) + "..." : str;
    }

    function getTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if(seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if(minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if(hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    function extractCategory(description) {
        const desc = description.toLowerCase();
        if(desc.includes('key')) return 'Keys';
        if(desc.includes('phone') || desc.includes('mobile')) return 'Electronics';
        if(desc.includes('bag') || desc.includes('backpack')) return 'Bags';
        if(desc.includes('bottle') || desc.includes('cup')) return 'Bottles';
        if(desc.includes('wallet') || desc.includes('card')) return 'Valuables';
        return 'Item';
    }
});

// Image search button
function triggerImageSearch() {
    document.getElementById('cameraInput').click();
}

// Delete item function
async function deleteItem(itemId, buttonElement) {
    if(!confirm("Are you sure you want to delete this item?")) {
        return;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/items/${itemId}`, {
            method: 'DELETE'
        });
        
        if(response.ok) {
            // Remove card from DOM
            const card = buttonElement.closest('.item-card');
            card.style.opacity = '0';
            card.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                card.remove();
                // Check if grid is empty
                const itemsGrid = document.getElementById('itemsGrid');
                if(itemsGrid.children.length === 0) {
                    itemsGrid.innerHTML = '<p style="text-align:center; color:#999; grid-column:1/-1;">No items found yet. Be the first to report something!</p>';
                }
            }, 300);
        } else {
            alert("Failed to delete item");
        }
    } catch(err) {
        alert("Error deleting item: " + err.message);
    }
}