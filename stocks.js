// API Key for Polygon.io
const API_KEY = 'IspGPLTbpiWTv86pFxVq9BBply_eHE6f';

// DOM Elements
const stockTickerInput = document.getElementById('stock-ticker');
const timeRangeSelect = document.getElementById('time-range');
const lookupButton = document.getElementById('lookup-button');
const stockChart = document.getElementById('stock-chart');
const redditStocksTable = document.getElementById('reddit-stocks-table').getElementsByTagName('tbody')[0];

// Chart instance
let chartInstance = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load top Reddit stocks
    fetchTopRedditStocks();
    
    // Add event listener for the lookup button
    lookupButton.addEventListener('click', function() {
        const ticker = stockTickerInput.value.trim().toUpperCase();
        const days = parseInt(timeRangeSelect.value);
        
        if (ticker) {
            fetchStockData(ticker, days);
        } else {
            alert('Please enter a stock ticker');
        }
    });
    
    // Initialize audio commands with SpeechKITT
    if (annyang) {
        // Define commands
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
            },
            'lookup *stock': function(stock) {
                // Set the input value and trigger the lookup
                stockTickerInput.value = stock.toUpperCase();
                timeRangeSelect.value = '30'; // Default to 30 days
                lookupButton.click();
            }
        };

        // Add commands to annyang
        annyang.addCommands(commands);
        
        // Tell KITT to use annyang
        SpeechKITT.annyang();
        
        // Define a stylesheet for KITT to use
        SpeechKITT.setStylesheet('//cdnjs.cloudflare.com/ajax/libs/SpeechKITT/0.3.0/themes/flat.css');
        
        // Render KITT's interface
        SpeechKITT.vroom();
        
        // Set initial state
        SpeechKITT.hide();
    } else {
        console.error('Speech recognition is not supported in this browser.');
    }
});

// Turn on audio recognition
document.getElementById('turnOnAudio').addEventListener('click', function() {
    if (annyang) {
        annyang.start();
        SpeechKITT.show();
        alert('Audio commands are now active.');
    } else {
        alert('Speech recognition is not supported in this browser.');
    }
});

// Turn off audio recognition
document.getElementById('turnOffAudio').addEventListener('click', function() {
    if (annyang) {
        annyang.abort();
        SpeechKITT.hide();
        alert('Audio commands are now turned off.');
    }
});

// Fetch stock data from Polygon.io
async function fetchStockData(ticker, days) {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    // Format dates as YYYY-MM-DD
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Construct API URL
    const apiUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${formattedStartDate}/${formattedEndDate}?apiKey=${API_KEY}`;
    
    try {
        // Show loading state
        stockChart.style.opacity = 0.5;
        
        // Fetch data
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
            // Process data for chart
            const chartData = processStockData(data.results);
            // Create or update chart
            createStockChart(ticker, chartData);
        } else {
            alert(`No data found for ${ticker} in the selected time range.`);
        }
    } catch (error) {
        console.error('Error fetching stock data:', error);
        alert('Failed to fetch stock data. Please try again.');
    } finally {
        stockChart.style.opacity = 1;
    }
}

// Process stock data for chart
function processStockData(stockData) {
    const labels = [];
    const prices = [];
    
    stockData.forEach(dataPoint => {
        // Convert UNIX timestamp (in milliseconds) to date
        const date = new Date(dataPoint.t);
        const formattedDate = date.toLocaleDateString();
        
        // Use closing price
        const price = dataPoint.c;
        
        labels.push(formattedDate);
        prices.push(price);
    });
    
    return {
        labels: labels,
        prices: prices
    };
}

// Create or update stock chart
function createStockChart(ticker, data) {
    // Destroy existing chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Create new chart
    const ctx = stockChart.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: `${ticker} Stock Price`,
                data: data.prices,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `${ticker} Stock Price Chart`,
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Fetch top Reddit stocks
async function fetchTopRedditStocks() {
    try {
        // Fetch data from the API
        const response = await fetch('https://tradestie.com/api/v1/apps/reddit');
        const data = await response.json();
        
        // Get top 5 stocks
        const top5Stocks = data.slice(0, 5);
        
        // Clear existing table rows
        redditStocksTable.innerHTML = '';
        
        // Add rows for top 5 stocks
        top5Stocks.forEach(stock => {
            const row = document.createElement('tr');
            
            // Create ticker cell with Yahoo Finance link
            const tickerCell = document.createElement('td');
            const tickerLink = document.createElement('a');
            tickerLink.href = `https://finance.yahoo.com/quote/${stock.ticker}`;
            tickerLink.textContent = stock.ticker;
            tickerLink.target = '_blank';
            tickerCell.appendChild(tickerLink);
            
            // Create comment count cell
            const commentCell = document.createElement('td');
            commentCell.textContent = stock.no_of_comments;
            
            // Create sentiment cell with icon
            const sentimentCell = document.createElement('td');
            
            // Add icon based on sentiment
            if (stock.sentiment === 'Bullish') {
                const icon = document.createElement('span');
                icon.classList.add('bullish-icon');
                icon.innerHTML = '&#x1F53A;'; // Up triangle emoji
                sentimentCell.appendChild(icon);
                sentimentCell.appendChild(document.createTextNode('Bullish'));
            } else if (stock.sentiment === 'Bearish') {
                const icon = document.createElement('span');
                icon.classList.add('bearish-icon');
                icon.innerHTML = '&#x1F53B;'; // Down triangle emoji
                sentimentCell.appendChild(icon);
                sentimentCell.appendChild(document.createTextNode('Bearish'));
            } else {
                sentimentCell.textContent = 'Neutral';
            }
            
            // Add cells to row
            row.appendChild(tickerCell);
            row.appendChild(commentCell);
            row.appendChild(sentimentCell);
            
            // Add row to table
            redditStocksTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching Reddit stocks:', error);
        
        // Display error message in the table
        redditStocksTable.innerHTML = `
            <tr>
                <td colspan="3">Failed to load Reddit stocks data. Please refresh the page.</td>
            </tr>
        `;
    }
}