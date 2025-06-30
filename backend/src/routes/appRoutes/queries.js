const express = require('express');
const router = express.Router();
const Query = require('../../models/appModels/Query');
const Invoice = require('../../models/appModels/Invoice');
const Client = require('../../models/appModels/Client');


// GET /api/queries - Get all queries (with pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const queries = await Query.find()
      .populate('client', 'name')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ created: -1 });
    const total = await Query.countDocuments();
    res.json({ data: queries, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/queries - Create a query
router.post('/', async (req, res) => {
  try {
    // Find client name by ID
    const client = await Client.findById(req.body.client);
    if (!client) return res.status(400).json({ error: 'Client not found' });
    const query = new Query({
      ...req.body,
      clientName: client.name,
    });
    await query.save();
    await query.populate('client', 'name');
    res.status(201).json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/queries/:id - Get single query
router.get('/:id', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id).populate('client', 'name');
    if (!query) return res.status(404).json({ error: 'Not found' });
    res.json(query);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/queries/:id - Update query (status/resolution)
router.put('/:id', async (req, res) => {
  try {
    const query = await Query.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!query) return res.status(404).json({ error: 'Not found' });
    res.json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/queries/:id/notes - Add a note to query
router.post('/:id/notes', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Not found' });
    query.notes.push({ text: req.body.text });
    await query.save();
    res.status(201).json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/queries/ai - Get Gemini AI response for a query
router.post('/ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
    const aiResponse = await getGeminiAIResponse(prompt);
    res.json({ aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/queries/:id/notes/:noteId - Edit a note in a query
router.put('/:id/notes/:noteId', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });

    const note = query.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    note.text = req.body.text;
    await query.save();
    res.json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/queries/:id/notes/:noteId - Delete a note from a query
router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });

    // Find note index and remove by index
    const noteIndex = query.notes.findIndex(n => n._id && n._id.toString() === req.params.noteId);
    if (noteIndex === -1) return res.status(404).json({ error: 'Note not found' });

    query.notes.splice(noteIndex, 1);
    await query.save();
    res.json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/queries/:id - Delete a query by ID
router.delete('/:id', async (req, res) => {
  try {
    const query = await Query.findByIdAndDelete(req.params.id);
    if (!query) return res.status(404).json({ error: 'Query not found' });
    res.json({ message: 'Query deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/invoices-with-client - Get all invoices with client info
router.get('/invoices-with-client', async (req, res) => {
  try {
    const invoices = await Invoice.find({ removed: false })
      .populate('client', 'name')
      .select('number year client');
    res.json({ data: invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;