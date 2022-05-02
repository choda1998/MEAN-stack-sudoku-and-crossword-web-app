const mongoose = require("mongoose");

const crosswordValueSchema = mongoose.Schema({
  crossword_id: {
    type: Number
  },
  value: {
    type: String
  }
});

module.exports = mongoose.model("CrosswordValue", crosswordValueSchema);
