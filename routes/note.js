import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import Note from '../models/Note.js';
import middleware from '../middleware/middleware.js';
import dotenv from 'dotenv';
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notes-app',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Update multer config to use Cloudinary
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Modified add note route
router.post('/add', middleware, upload.single('image'), async (req, res) => {
  try {
    // Log incoming request details
    console.log('Request body:', req.body);
    console.log('File details:', req.file);
    console.log('Cloudinary config:', {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasSecret: !!process.env.CLOUDINARY_API_SECRET
    });

    const {
      title,
      description,
      isAudioNote,
      audioTranscription
    } = req.body;

    const newNote = new Note({
      title,
      description,
      image: req.file ? req.file.path : '',
      userId: req.user.id,
      isAudioNote: isAudioNote || false,
      audioTranscription: audioTranscription || ''
    });

    await newNote.save();
    res.status(201).json({
      message: 'Created Note successfully',
      note: newNote
    });
  } catch (error) {
    // Enhanced error logging
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.code) {
      console.error('Error code:', error.code);
    }

    res.status(500).json({
      message: 'Error in creating a Note',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Modified update route
router.put('/:id', middleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    // Handle image update
    if (req.file) {
      // If there's an existing image, delete it from Cloudinary
      if (note.image) {
        const publicId = note.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      updateData.image = req.file.path;
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note: updatedNote
    });

  } catch (error) {
    // If there's an error and a new image was uploaded, delete it
    if (req.file && req.file.path) {
      const publicId = req.file.filename;
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(500).json({
      success: false,
      message: 'Error in updating note',
      error: error.message
    });
  }
});

// Modified delete route to clean up Cloudinary images
router.delete('/:id', middleware, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized'
      });
    }

    // Delete image from Cloudinary if it exists
    if (note.image) {
      const publicId = note.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Note.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in deleting note',
      error: error.message
    });
  }
});

// Add this test route temporarily
router.get('/test-cloudinary', async (req, res) => {
  try {
    const testResult = await cloudinary.api.ping();
    res.json({ 
      status: 'success', 
      cloudinaryConnected: true,
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasSecret: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasSecret: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  }
});
router.get('/diagnose', async (req, res) => {
  try {
    // Test Cloudinary connection
    const cloudinaryTest = await cloudinary.api.ping();
    
    res.json({
      status: 'success',
      environment: process.env.NODE_ENV,
      cloudinary: {
        connected: true,
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasSecret: !!process.env.CLOUDINARY_API_SECRET
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      environment: process.env.NODE_ENV,
      cloudinary: {
        connected: false,
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasSecret: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  }
});
// Add this route to your note.js
router.get('/', middleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id });
    res.status(200).json({
      success: true,
      Notes: notes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
      error: error.message
    });
  }
});

export default router;