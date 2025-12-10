document.addEventListener('DOMContentLoaded', function () {
    console.log('App initialized');
    fetchData();

    // Tab Switching Logic
    window.switchView = function (viewName) {
        // Handle navigation between different reports
        if (viewName === 'awareness') {
            window.location.href = '/';
        } else if (viewName === 'digital') {
            window.location.href = '/digital-performance-report';
        } else if (viewName === 'media') {
            window.location.href = '/media-performance-report';
        } else if (viewName === 'media-image') {
            window.location.href = '/media-image-report';
        }
        
        // Legacy code for single page switching (kept for backward compatibility)
        const awarenessView = document.getElementById('view-awareness');
        const digitalView = document.getElementById('view-digital-performance');
        const btnAwareness = document.getElementById('btn-awareness');
        const btnDigital = document.getElementById('btn-digital');
        const btnMedia = document.getElementById('btn-media');

        if (awarenessView && digitalView) {
            if (viewName === 'awareness') {
                awarenessView.style.display = 'block';
                digitalView.style.display = 'none';

                btnAwareness.classList.add('primary');
                btnDigital.classList.remove('primary');
                if (btnMedia) btnMedia.classList.remove('primary');

                // Scroll to start of content if needed, or stay at top
            } else if (viewName === 'digital') {
                awarenessView.style.display = 'none';
                digitalView.style.display = 'block';

                btnDigital.classList.add('primary');
                btnAwareness.classList.remove('primary');
                if (btnMedia) btnMedia.classList.remove('primary');
            }
        }
    };

    // Initialize toggle button for PDF view
    const toggleBtn = document.getElementById('view-toggle');
    const body = document.body;

    toggleBtn.addEventListener('click', function () {
        body.classList.toggle('pdf-mode');

        if (body.classList.contains('pdf-mode')) {
            toggleBtn.textContent = 'عرض الويب';
        } else {
            toggleBtn.textContent = 'عرض PDF';
        }
    });
});

async function fetchData() {
    const displayElement = document.getElementById('api-data-display');

    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Format and display the data
        displayElement.innerHTML = `
            <strong>Status:</strong> Success<br>
            <strong>Message:</strong> ${data.message}<br>
            <strong>Awareness Level:</strong> ${data.awareness_level}%<br>
            <strong>Region:</strong> ${data.region}
        `;
        displayElement.style.borderColor = '#2ecc71'; // Green for success

    } catch (error) {
        console.error('Error fetching data:', error);
        displayElement.innerHTML = 'Error loading data from Python backend.';
        displayElement.style.borderColor = '#e74c3c'; // Red for error
    }
}
