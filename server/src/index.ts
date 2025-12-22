import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import resourceRoutes from './routes/resourceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import billingRoutes from './routes/billingRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.0.102:5173', // Local Network
        'http://100.125.171.118:5173', // Tailscale Access
        process.env.CLIENT_URL
    ].filter(Boolean) as string[],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/billing', billingRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Monthly Billing App API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
});

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});

// KEEP-ALIVE HACK
setInterval(() => {
    // console.log('Heartbeat...');
}, 10000);