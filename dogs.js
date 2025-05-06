document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const dogCarousel = document.getElementById('dog-carousel');
    const breedButtonsContainer = document.getElementById('breed-buttons');
    const breedInfoContainer = document.getElementById('breed-info');
    const turnOnAudioBtn = document.getElementById('turn-on-audio');
    const turnOffAudioBtn = document.getElementById('turn-off-audio');

    // Initialize the Annyang voice recognition library
    initializeVoiceCommands();

    // Fetch 10 random dog images and set up carousel
    fetchRandomDogImages();

    // Fetch list of dog breeds and create buttons
    fetchDogBreeds();

    // Event listeners for audio buttons
    turnOnAudioBtn.addEventListener('click', turnOnAudio);
    turnOffAudioBtn.addEventListener('click', turnOffAudio);

    // Function to fetch 10 random dog images
    async function fetchRandomDogImages() {
        try {
            // Clear existing images
            dogCarousel.innerHTML = '';

            // Create array to store promises
            const imagePromises = [];

            // Fetch 10 random dog images
            for (let i = 0; i < 10; i++) {
                imagePromises.push(
                    fetch('https://dog.ceo/api/breeds/image/random')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Create image element
                            const img = document.createElement('img');
                            img.src = data.message;
                            img.alt = 'Random Dog';
                            img.loading = 'lazy';
                            return img;
                        })
                );
            }

            // Wait for all image fetches to complete
            const dogImages = await Promise.all(imagePromises);

            // Add images to carousel
            dogImages.forEach(img => {
                dogCarousel.appendChild(img);
            });

            // Initialize the carousel
            new SimpleSlider({
                container: dogCarousel,
                transitionTime: 0.3,
                delay: 3.5
            });
        } catch (error) {
            console.error('Error fetching dog images:', error);
            dogCarousel.innerHTML = '<p>Error loading dog images. Please try again later.</p>';
        }
    }

    // Function to fetch dog breeds and create buttons
    async function fetchDogBreeds() {
        try {
            const response = await fetch('https://dog.ceo/api/breeds/list/all');
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            const breeds = Object.keys(data.message);

            // Clear existing buttons
            breedButtonsContainer.innerHTML = '';

            // Create a button for each breed
            breeds.forEach(breed => {
                const button = document.createElement('button');
                button.textContent = capitalize(breed);
                button.setAttribute('class', 'breed-button');
                button.setAttribute('data-breed', breed);
                
                // Add click event listener
                button.addEventListener('click', () => {
                    loadBreedInfo(breed);
                });
                
                breedButtonsContainer.appendChild(button);
            });
        } catch (error) {
            console.error('Error fetching dog breeds:', error);
            breedButtonsContainer.innerHTML = '<p>Error loading dog breeds. Please try again later.</p>';
        }
    }

    // Function to load breed information when button is clicked
    async function loadBreedInfo(breed) {
        try {
            // Using the Dog API to get breed info
            const response = await fetch(`https://api.thedogapi.com/v1/breeds/search?q=${breed}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const breedData = await response.json();
            
            if (breedData.length === 0) {
                breedInfoContainer.innerHTML = `<h2>No information found for ${capitalize(breed)}</h2>`;
                breedInfoContainer.style.display = 'block';
                return;
            }
            
            const breedInfo = breedData[0];
            
            // Extract life span information (typically in format "10 - 12 years")
            let minLife = 'N/A';
            let maxLife = 'N/A';
            
            if (breedInfo.life_span) {
                const lifeSpanMatch = breedInfo.life_span.match(/(\d+)\s*-\s*(\d+)/);
                if (lifeSpanMatch) {
                    minLife = lifeSpanMatch[1];
                    maxLife = lifeSpanMatch[2];
                }
            }
            
            // Create HTML for breed info
            breedInfoContainer.innerHTML = `
                <h2>${capitalize(breed)}</h2>
                <p>${breedInfo.temperament || 'No temperament information available.'}</p>
                <p>${breedInfo.bred_for ? `Bred for: ${breedInfo.bred_for}` : ''}</p>
                <div class="life-span">
                    <div>
                        <h3>Min Life</h3>
                        <p>${minLife} years</p>
                    </div>
                    <div>
                        <h3>Max Life</h3>
                        <p>${maxLife} years</p>
                    </div>
                </div>
            `;
            
            // Show the info container
            breedInfoContainer.style.display = 'block';
        } catch (error) {
            console.error('Error loading breed info:', error);
            breedInfoContainer.innerHTML = `<h2>Error loading information for ${capitalize(breed)}</h2>`;
            breedInfoContainer.style.display = 'block';
        }
    }

    // Helper function to capitalize first letter
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Voice commands setup with Annyang
    function initializeVoiceCommands() {
        if (annyang) {
            // Define voice commands
            const commands = {
                'hello': function() {
                    alert('Hello World');
                },
                'change the color to *color': function(color) {
                    document.body.style.backgroundColor = color;
                },
                'navigate to *page': function(page) {
                    const pageLower = page.toLowerCase();
                    if (pageLower === 'home') {
                        window.location.href = 'index.html';
                    } else if (pageLower === 'stocks') {
                        window.location.href = 'stocks.html';
                    } else if (pageLower === 'dogs') {
                        window.location.href = 'dogs.html';
                    }
                },
                'load dog breed *breed': function(breed) {
                    // Find the breed button that matches or is closest to the spoken breed
                    const buttons = document.querySelectorAll('.breed-button');
                    const breedLower = breed.toLowerCase();
                    
                    let foundButton = null;
                    
                    // First try exact match
                    for (const button of buttons) {
                        if (button.getAttribute('data-breed').toLowerCase() === breedLower) {
                            foundButton = button;
                            break;
                        }
                    }
                    
                    // If no exact match, try finding a button that starts with the spoken breed
                    if (!foundButton) {
                        for (const button of buttons) {
                            if (button.getAttribute('data-breed').toLowerCase().startsWith(breedLower)) {
                                foundButton = button;
                                break;
                            }
                        }
                    }
                    
                    // If found, trigger the click
                    if (foundButton) {
                        foundButton.click();
                    } else {
                        alert(`Sorry, could not find breed "${breed}"`);
                    }
                }
            };

            // Add commands to annyang
            annyang.addCommands(commands);
            
            // Start listening (but don't auto-start, wait for button click)
            // annyang.start({ autoRestart: true, continuous: false });
        }
    }

    // Function to turn on voice commands
    function turnOnAudio() {
        if (annyang) {
            annyang.start({ autoRestart: true, continuous: false });
            alert('Voice commands are now active!');
        } else {
            alert('Voice recognition is not supported in this browser.');
        }
    }

    // Function to turn off voice commands
    function turnOffAudio() {
        if (annyang) {
            annyang.abort();
            alert('Voice commands have been turned off.');
        }
    }
});