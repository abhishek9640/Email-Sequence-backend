const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  nodes: [
    {
      id: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['emailNode', 'delayNode', 'leadSourceNode']
      },
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
      },
      data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      }
    }
  ],
  edges: [
    {
      id: {
        type: String,
        required: true
      },
      source: {
        type: String,
        required: true
      },
      target: {
        type: String,
        required: true
      },
      sourceHandle: String,
      targetHandle: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt field on save
SequenceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Sequence = mongoose.model('Sequence', SequenceSchema);

module.exports = Sequence; 