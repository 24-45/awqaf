document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');
    fetchData();
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
