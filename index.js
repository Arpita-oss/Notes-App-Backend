import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRouter from './routes/auth.js'
import noteRouter from './routes/note.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory if it doesn't exist
import fs from 'fs'
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

dotenv.config({ path: path.join(__dirname, '.env') })

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables')
    process.exit(1)
}

const app = express()
import connectDB from './db/db.js'

// Use process.env.PORT for Render compatibility
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/note', noteRouter)

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir))

// Add a route to check if uploads directory exists
app.get('/api/check-uploads', (req, res) => {
    res.json({
        uploadsExists: fs.existsSync(uploadsDir),
        uploadsPath: uploadsDir
    })
})

app.listen(port, () => {
    connectDB()
    console.log(`Server is running on port ${port}`)
})