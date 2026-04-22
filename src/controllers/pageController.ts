import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { savePage, getAllPages, deletePage, getPageById, updatePage, dbPing } from '../database/db.js';

export const uploadPage = (req: Request, res: Response) => {
  try {
    let htmlContent = '';

    // Check if HTML is sent via JSON
    if (req.body && req.body.html) {
      htmlContent = req.body.html;
    } 
    // Check if HTML is sent via file upload
    else if (req.file) {
      htmlContent = req.file.buffer.toString('utf-8');
    }

    if (!htmlContent) {
      return res.status(400).json({ success: false, error: 'No HTML content provided' });
    }

    // Basic sanitization (optional, but good practice)
    // We could use DOMPurify here, but since the goal is to render the exact HTML,
    // we might just limit the size or do basic checks.
    if (htmlContent.length > 1024 * 1024 * 5) { // 5MB limit
      return res.status(400).json({ success: false, error: 'HTML content too large (max 5MB)' });
    }

    let id = req.body.id || req.body.slug;
    
    if (id) {
      // Validate ID
      id = id.toString().replace(/[^a-z0-9-]/gi, '').toLowerCase();
      const existing = getPageById(id);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Page ID (slug) is already taken' });
      }
    } else {
      id = uuidv4().replace(/-/g, '').substring(0, 10); // Short ID
    }
    
    // Handle expiration (optional)
    let expiresAt = null;
    if (req.body.expiresInDays) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(req.body.expiresInDays));
      expiresAt = date.toISOString();
    }

    savePage({
      id,
      html_content: htmlContent,
      expires_at: expiresAt
    });

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${appUrl}/view/${id}`;

    res.status(201).json({
      success: true,
      id,
      url
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const editPage = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newId, html } = req.body;

    if (!html) {
      return res.status(400).json({ success: false, error: 'No HTML content provided' });
    }

    if (!newId) {
      return res.status(400).json({ success: false, error: 'No new ID provided' });
    }

    // Check if newId is already taken (if it's different from old id)
    if (newId !== id) {
      const existing = getPageById(newId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'New ID (slug) is already taken' });
      }
    }

    updatePage(id, newId, html);

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${appUrl}/view/${newId}`;

    res.json({
      success: true,
      id: newId,
      url
    });
  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getPageContent = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = getPageById(id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    res.json({ success: true, page });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const listPages = (req: Request, res: Response) => {
  try {
    const pages = getAllPages();
    res.json({ success: true, pages });
  } catch (error) {
    console.error('List pages error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const removePage = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    deletePage(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const checkHealth = (req: Request, res: Response) => {
  try {
    const result = dbPing();
    res.json({ 
      success: true, 
      status: 'Database is active', 
      timestamp: new Date().toISOString(),
      ping: result 
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
