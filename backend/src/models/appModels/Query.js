const mongoose = require('mongoose');
require('mongoose-autopopulate');

const querySchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed'],
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  notes: [
    {
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  resolution: {
    type: String,
    default: '',
  },
});

querySchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Query', querySchema);
