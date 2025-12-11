document.addEventListener('DOMContentLoaded', function () {
    console.log('App initialized');
    fetchData();
    
    // Set active tab based on current page
    setActiveTab();

    // Tab Switching Logic with transition effect
    window.switchView = function (viewName) {
        // Get clicked button
        const clickedBtn = document.getElementById('btn-' + viewName) || 
                          document.querySelector(`[onclick*="'${viewName}'"]`);
        
        if (clickedBtn) {
            // Add click animation
            clickedBtn.classList.add('clicked');
            
            // Create ripple effect
            createRipple(clickedBtn, event);
        }
        
        // Show loading overlay
        showTransitionOverlay();
        
        // Detect if running on GitHub Pages or local
        const isGitHubPages = window.location.hostname.includes('github.io');
        const basePath = isGitHubPages ? '/awqaf' : '';
        const htmlExt = isGitHubPages ? '.html' : '';
        
        // Delay navigation slightly for effect
        setTimeout(() => {
            // Handle navigation between different reports
            if (viewName === 'awareness') {
                window.location.href = isGitHubPages ? basePath + '/index.html' : '/';
            } else if (viewName === 'digital') {
                window.location.href = basePath + '/digital-performance-report' + htmlExt;
            } else if (viewName === 'media') {
                window.location.href = basePath + '/media-performance-report' + htmlExt;
            } else if (viewName === 'media-image') {
                window.location.href = basePath + '/media-image-report' + htmlExt;
            }
        }, 400);
        
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

// Create ripple effect on button click
function createRipple(button, event) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event?.clientX - rect.left - size / 2) + 'px' || '50%';
    ripple.style.top = (event?.clientY - rect.top - size / 2) + 'px' || '50%';
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Show transition overlay
function showTransitionOverlay() {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('page-transition-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'page-transition-overlay';
        overlay.innerHTML = `
            <div class="transition-content">
                <div class="transition-spinner"></div>
                <span class="transition-text">جاري الانتقال...</span>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    // Show overlay with animation
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
}

// Set active tab based on current URL
function setActiveTab() {
    const path = window.location.pathname;
    const buttons = document.querySelectorAll('.cover-btn');
    
    buttons.forEach(btn => btn.classList.remove('primary'));
    
    if (path === '/' || path === '/index.html' || path.includes('index')) {
        document.getElementById('btn-awareness')?.classList.add('primary');
    } else if (path.includes('digital')) {
        document.getElementById('btn-digital')?.classList.add('primary');
    } else if (path.includes('media-performance')) {
        document.getElementById('btn-media')?.classList.add('primary');
    } else if (path.includes('media-image')) {
        document.getElementById('btn-media-image')?.classList.add('primary');
    }
}

// Hide overlay on page load (for back navigation)
window.addEventListener('pageshow', function() {
    const overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
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
