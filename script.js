// Function to fetch a random quote from zenQuotes API
async function getRandomQuote() {
    try {
        // Using the random mode to get a single random quote
        const response = await fetch('https://zenquotes.io/api/random');
        const data = await response.json();
        
        if (data && data.length > 0) {
            // Set the quote text and author
            document.getElementById('quote').textContent = `"${data[0].q}"`;
            document.getElementById('author').textContent = `— ${data[0].a}`;
        }
    } catch (error) {
        console.error('Error fetching quote:', error);
        // Fallback quote in case the API call fails
        document.getElementById('quote').textContent = '"The best way to predict the future is to create it."';
        document.getElementById('author').textContent = '— Abraham Lincoln';
    }
}

// Initialize audio commands with annyang
function initializeAudio() {
    if (annyang) {
        // Define the voice commands
        const commands = {
            'hello': function() {
                alert('Hello World');
            },
            'change the color to *color': function(color) {
                document.body.style.backgroundColor = color;
            },
            'navigate to *page': function(page) {
                // Convert to lowercase for comparison
                const pageLower = page.toLowerCase();
                
                if (pageLower === 'home') {
                    window.location.href = 'index.html';
                } else if (pageLower === 'stocks') {
                    window.location.href = 'stocks.html';
                } else if (pageLower === 'dogs') {
                    window.location.href = 'dogs.html';
                } else {
                    alert(`Sorry, the page "${page}" is not available.`);
                }
            }
        };

        // Add commands to annyang
        annyang.addCommands(commands);

        // Start listening
        annyang.start();
        console.log('Audio commands initialized');
    } else {
        console.error('Speech recognition is not supported in this browser.');
    }
}

// Turn on audio recognition
document.getElementById('turnOnAudio').addEventListener('click', function() {
    if (annyang) {
        annyang.start();
        alert('Audio commands are now active.');
    } else {
        alert('Speech recognition is not supported in this browser.');
    }
});

// Turn off audio recognition
document.getElementById('turnOffAudio').addEventListener('click', function() {
    if (annyang) {
        annyang.abort();
        alert('Audio commands are now turned off.');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get a random quote on page load
    getRandomQuote();
    
    // Initialize audio commands - start paused by default
    if (annyang) {
        // Set up the commands
        initializeAudio();
        // Pause by default - user needs to click "Turn On Audio" to activate
        annyang.abort();
    }
});