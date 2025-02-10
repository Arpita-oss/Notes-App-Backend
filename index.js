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

const port = 5000;

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/note', noteRouter)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.listen(port, () => {
    console.log(`Server starting up...`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Cloudinary config present:', {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasSecret: !!process.env.CLOUDINARY_API_SECRET
    });
    
    connectDB()
      .then(() => {
        console.log('Database connected successfully');
        console.log(`Server is running on port ${port}`);
      })
      .catch(err => {
        console.error('Database connection failed:', err);
      });
  });