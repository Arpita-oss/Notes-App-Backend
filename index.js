import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js'
import noteRouter from './routes/note.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify JWT_SECRET is loaded
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    process.exit(1); // Exit if JWT_SECRET is not set
}
const app = express()
import connectDB from './db/db.js'

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/note', noteRouter)

app.listen(5000, ()=>{
    connectDB()
    console.log("Server is running")
})