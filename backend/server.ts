const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Smuggler Backend API is running!' });
});

// Example API route
app.get('/api/items', (req, res) => {
    res.json({
        items: [
            { id: 1, name: 'Item 1', description: 'First smuggled item' },
            { id: 2, name: 'Item 2', description: 'Second smuggled item' }
        ]
    });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📱 Connect your React Native app to: http://localhost:${PORT}`);
}); 