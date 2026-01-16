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

    // --- 1. Search Logic (Text Filter) ---
    searchInput.addEventListener('keyup', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.item-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const tag = card.querySelector('.tag').textContent.toLowerCase();
            if(title.includes(term) || tag.includes(term)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });

    // --- 2. Camera Icon Logic (Triggers file input) ---
    // Note: On mobile, 'capture="environment"' in HTML prefers rear camera
    cameraInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            alert("Camera image captured! Backend logic would process search here.");
            // Here you would send this image to a backend for AI comparison
        }
    });

    // --- 3. Modal Logic (Show/Hide) ---
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

    // --- 5. Submit Found Item (Add to Grid) ---
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get values
        const name = document.getElementById('itemName').value;
        const location = document.getElementById('itemLocation').value;
        const imgSrc = imagePreview.src;

        if(!imgSrc) {
            alert("Please upload an image!");
            return;
        }

        // Create new HTML card
        const newCard = document.createElement('div');
        newCard.className = 'item-card';
        newCard.innerHTML = `
            <img src="${imgSrc}" alt="${name}">
            <div class="card-info">
                <h3>${name}</h3>
                <p>Found at: ${location}</p>
                <span class="tag">New</span>
            </div>
        `;

        // Prepend to grid
        itemsGrid.prepend(newCard);

        // Close and reset
        modal.style.display = 'none';
        resetForm();
    });

    function resetForm() {
        uploadForm.reset();
        imagePreview.hidden = true;
        imagePreview.src = "";
    }
});

// Mock function for Image Search button
function triggerImageSearch() {
    document.getElementById('cameraInput').click();
}