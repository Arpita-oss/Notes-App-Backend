import express from 'express'
import Note from '../models/Note.js';
import middleware from '../middleware/middleware.js';
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // The folder where images will be stored
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    cb(null, Date.now() + '-' + file.originalname)
  }
})

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG and PNG allowed.'), false)
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
})



router.post('/add', middleware, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      isAudioNote,
      audioTranscription
    } = req.body

    const newNote = new Note({
      title,
      description,
      image: req.file ? `/uploads/${req.file.filename}`: '',
      userId: req.user.id,
      isAudioNote: isAudioNote || false,
      audioTranscription: audioTranscription || ''
    })

    await newNote.save()
    res.status(201).json({
      message: 'Created Note successfully',
      note: newNote
    })
  } catch (error) {
    console.error("Error in creating note:", error)
    res.status(500).json({
      message: 'Error in creating a Note',
      error: error.message
    })
  }
})

router.get('/', middleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }); // Filter by logged-in user
    res.status(200).json({
      success: true,
      Notes: notes  // Match the capitalization used in your frontend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in retrieving notes',
    });
  }
});

router.delete('/:id', middleware, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id  // Ensure user can only delete their own notes
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized'
      });
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

// Update note
router.put('/:id', middleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or unauthorized'
      })
    }

    const updateData = {
      title,
      description
    }

    // Only update image if new file is uploaded
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note: updatedNote
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in updating note',
      error: error.message
    })
  }
})


const toggleFavorite = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isFavorite = !note.isFavorite;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling favorite' });
  }
};

// const getFavorites = async (req, res) => {
//   try {
//     const favorites = await Note.find({ 
//       userId: req.user._id, 
//       isFavorite: true 
//     });
//     res.json(favorites);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching favorites' });
//   }
// };

router.put('/toggle-favorite/:id', middleware, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isFavorite = !note.isFavorite;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling favorite' });
  }
});
router.get('/favourites', middleware, async (req, res) => {
  try {
    const favouriteNotes = await Note.find({
      userId: req.user.id,
      isFavorite: true
    });
    res.json(favouriteNotes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favourite notes' });
  }
});

router.get("/alive", (req, res) => {
  res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString()
  })
})


export default router