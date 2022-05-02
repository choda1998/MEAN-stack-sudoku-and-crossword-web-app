const mongoose = require("mongoose");

const sudokuCellSchema = mongoose.Schema({
  sudoku_id: {
    type: Number
  },
  index: {
    type: Number
  },
  num: {
    type: Number  //ne treba ?
  }
  ,
  value: {
    type: Number
  },
  difficulty: {
    type: Number
  }
});

module.exports = mongoose.model("SudokuCell", sudokuCellSchema);
