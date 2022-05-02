const mongoose = require("mongoose");

const CrosswordVarSchema = mongoose.Schema({
  crossword_id: {
    type: Number
  },
  index: {
    type: Number
  },
  label: {
    type: Number
  },
  value: {
    type: Number
  },
  isBlack: {
    type: Boolean
  },
  isHorizontal: {
    type: Boolean
  },
  length: {
    type: Number
  },
  height: {
    type: Number
  },
  width: {
    type: Number
  }
});

module.exports = mongoose.model("CrosswordVar", CrosswordVarSchema);
