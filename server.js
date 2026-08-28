require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const groupRoutes = require('./routes/groupRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const compareRoutes = require('./routes/compareRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/allocate', allocationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/compare', compareRoutes);

app.get('/', (req, res) => {
    res.send('Hostel Allocation Backend is running!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});