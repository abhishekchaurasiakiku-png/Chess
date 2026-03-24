const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    playerWhite: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    playerBlack: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pgn: { type: String }, // Move history in Standard notation
    result: { type: String, enum: ['1-0', '0-1', '1/2-1/2', 'ongoing'], default: 'ongoing' },
    playedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
