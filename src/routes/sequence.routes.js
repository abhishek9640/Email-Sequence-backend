const express = require('express');
const router = express.Router();
const Sequence = require('../models/sequence.model');
const Lead = require('../models/lead.model');
const { processSequence } = require('../services/agenda');

// POST - Create a new sequence
router.post('/', async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    
    // Validate required fields
    if (!name || !nodes || !edges) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, nodes, edges' 
      });
    }
    
    // Create new sequence
    const sequence = new Sequence({
      name,
      description,
      nodes,
      edges
    });
    
    // Save to database
    await sequence.save();
    
    return res.status(201).json({
      message: 'Sequence created successfully',
      sequence
    });
  } catch (error) {
    console.error('Error creating sequence:', error);
    return res.status(500).json({ 
      message: 'Failed to create sequence',
      error: error.message 
    });
  }
});

// GET - Retrieve all sequences
router.get('/', async (req, res) => {
  try {
    const sequences = await Sequence.find().sort({ createdAt: -1 });
    return res.status(200).json(sequences);
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch sequences',
      error: error.message 
    });
  }
});

// GET - Retrieve a specific sequence by ID
router.get('/:id', async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }
    
    return res.status(200).json(sequence);
  } catch (error) {
    console.error('Error fetching sequence:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch sequence',
      error: error.message 
    });
  }
});

// PUT - Update a sequence
router.put('/:id', async (req, res) => {
  try {
    const { name, description, nodes, edges, isActive } = req.body;
    
    // Find and update sequence
    const updatedSequence = await Sequence.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        nodes,
        edges,
        isActive,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }
    
    return res.status(200).json({
      message: 'Sequence updated successfully',
      sequence: updatedSequence
    });
  } catch (error) {
    console.error('Error updating sequence:', error);
    return res.status(500).json({ 
      message: 'Failed to update sequence',
      error: error.message 
    });
  }
});

// POST - Run a sequence for a lead
router.post('/:id/run', async (req, res) => {
  try {
    const { leadEmail, leadName, source } = req.body;
    
    // Validate required fields
    if (!leadEmail) {
      return res.status(400).json({ 
        message: 'Missing required field: leadEmail' 
      });
    }
    
    // Find the sequence
    const sequence = await Sequence.findById(req.params.id);
    
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }
    
    if (!sequence.isActive) {
      return res.status(400).json({ message: 'Sequence is not active' });
    }
    
    // Create or update the lead
    let lead = await Lead.findOne({ email: leadEmail });
    
    if (!lead) {
      lead = new Lead({
        email: leadEmail,
        name: leadName,
        source: source,
        sequenceId: sequence._id
      });
    } else {
      lead.name = leadName || lead.name;
      lead.source = source || lead.source;
      lead.sequenceId = sequence._id;
      lead.updatedAt = Date.now();
    }
    
    await lead.save();
    
    // Process the sequence for this lead
    await processSequence(sequence, leadEmail);
    
    return res.status(200).json({
      message: 'Sequence started successfully for lead',
      lead
    });
  } catch (error) {
    console.error('Error running sequence:', error);
    return res.status(500).json({ 
      message: 'Failed to run sequence',
      error: error.message 
    });
  }
});

// DELETE - Delete a sequence
router.delete('/:id', async (req, res) => {
  try {
    const sequence = await Sequence.findByIdAndDelete(req.params.id);
    
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }
    
    return res.status(200).json({
      message: 'Sequence deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return res.status(500).json({ 
      message: 'Failed to delete sequence',
      error: error.message 
    });
  }
});

module.exports = router; 