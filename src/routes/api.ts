import { Router } from 'express';
import multer from 'multer';
import { uploadPage, listPages, removePage, editPage, getPageContent } from '../controllers/pageController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload HTML endpoint
router.post('/upload', upload.single('file'), uploadPage);

// Edit HTML endpoint
router.put('/pages/:id', editPage);
router.get('/pages/:id', getPageContent);

// Dashboard endpoints
router.get('/pages', listPages);
router.delete('/pages/:id', removePage);

export default router;
