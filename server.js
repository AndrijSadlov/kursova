require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/userModel');

const authRoutes = require('./routes/authRoutes');
const personnelRoutes = require('./routes/personnelRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, req, res, next) => {
    console.error('Глобальна помилка:', error);
    res.status(500).json({ success: false, message: 'Внутрішня помилка сервера' });
});

const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            await User.create({
                email: 'admin@military.com',
                password: 'adminZN', 
                role: 'admin'
            });
            console.log('✅ Створено дефолтного адміна: admin@military.com / adminZN');
        }
    } catch (error) {
        console.error('Помилка створення адміна:', error);
    }
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/military_personnel')
    .then(() => {
        console.log('MongoDB підключено успішно');
        createDefaultAdmin();
    })
    .catch(err => console.error('Помилка підключення до MongoDB:', err));

const server = app.listen(PORT, () => {
    console.log(`Сервер запущено на порті ${PORT}`);
});

// --- ВИПРАВЛЕНА ЧАСТИНА (Graceful Shutdown) ---
const gracefulShutdown = (signal) => {
    process.on(signal, async () => {
        console.log(`${signal} отримано, закриваємо сервер...`);
        server.close(async () => {
            console.log('HTTP сервер закрито.');
            try {
                // У нових версіях Mongoose close() повертає Promise, тому використовуємо await
                await mongoose.connection.close(false);
                console.log('MongoDB з\'єднання закрито.');
                process.exit(0);
            } catch (err) {
                console.error('Помилка при закритті MongoDB:', err);
                process.exit(1);
            }
        });
    });
};

gracefulShutdown('SIGTERM');
gracefulShutdown('SIGINT');