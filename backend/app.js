
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const csp = require("./csp-algorithm")

const SudokuCell = require("./models/sudoku_cell");
const CrosswordVar = require("./models/crossword_var");
const CrosswordValue = require("./models/crossword_value");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose
  .connect(
    "secret"
  )
  .then(() => {
    console.log("Povezan sa bazom");
  })
  .catch(() => {
    console.log("Veza nije uspela");
  });

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, PUT, OPTIONS"
  );
  next();
});

app.delete("/api/sudoku/:id", (req, res, next) => {
  const id = req.params.id;
  SudokuCell.deleteMany({ sudoku_id: id }).then(deleted => {
    res.status(200).json({
      message: "Sudoku deleted successfully!"
    })
  })
})

app.delete("/api/crossword/:id", (req, res, next) => {
  const id = req.params.id;
  CrosswordVar.deleteMany({ crossword_id: id }).then(deleted => {
    CrosswordValue.deleteMany({ crossword_id: id }).then(deleted => {
      res.status(200).json({
        message: "Crossword deleted successfully!"
      })
    })
  })
})

app.post("/api/sudoku", (req, res, next) => {
  const sudoku_cells = req.body.cells;
  SudokuCell.insertMany(sudoku_cells).then(response => {
    res.status(201).json({
      message: "Sudoku added successfully!",
    });
  })
});

app.post("/api/crossword", (req, res, next) => {
  const crossword_vars = req.body.vars;
  const crossword_values = req.body.values;
  CrosswordVar.insertMany(crossword_vars).then(response1 => {
    CrosswordValue.insertMany(crossword_values).then(response2 => {
      res.status(201).json({
        message: "Crossword added successfully!"
      })
    })
  })

})

app.post("/api/crossword/values", (req, res, next) => {
  const crosswordValue = new CrosswordValue({
    crossword_id: req.body.crossword_id,
    value: req.body.value
  })
  crosswordValue.save().then(createdValue => {
    res.status(201).json({
      message: "CrosswordValue added successfully"
    })
  })
})

app.get("/api/sudoku", (req, res, next) => {
  SudokuCell.find().then(cells => {
    res.status(200).json({
      message: "Cells fetched successfully!",
      sudokuCells: cells
    });
  });
});


app.get("/api/crossword", (req, res, next) => {
  CrosswordVar.find().then(vars => {
    CrosswordValue.find().then(values => {

      res.status(200).json({
        message: "Cossword fetched successfully!",
        crosswordVars: vars,
        crosswordValues: values,
      });
    })
  });
});


app.get("/api/sudoku/solve/:id", (req, res, next) => {
  SudokuCell.find({ sudoku_id: req.params.id }).then(cells => {
    let diff = cells[0].difficulty;
    let sudoku_id = cells[0].sudoku_id;
    var fc;
    var arc;
    var valuesOrder = +req.query.valuesOrder
    var varsOrder = +req.query.varsOrder
    if (req.query.fc == "true") {
      fc = true;
    } else {
      fc = false;
    }
    if (req.query.arc == "true") {
      arc = true;
    } else {
      arc = false;
    }
    csp.initialize(cells, true, [], []);
    let startTime = Date.now();
    csp.cspAlgorithm(cells, csp.getDomains(), 0, true, fc, arc, valuesOrder, varsOrder)
    let timeElapsed = Date.now() - startTime;
    res.status(200).json({
      message: "Sudoku solved successfully!",
      solution: csp.getSolution(diff, sudoku_id, true),
      steps: csp.getSteps(),
      time: timeElapsed
    })
    csp.reset()
  })
})

app.get("/api/crossword/solve/:id", (req, res, next) => {
  CrosswordVar.find({ crossword_id: req.params.id }).then(vars => {
    CrosswordValue.find({ crossword_id: req.params.id }).then(values => {
      var fc;
      var arc;
      var valuesOrder = +req.query.valuesOrder
      var varsOrder = +req.query.varsOrder
      if (req.query.fc == "true") {
        fc = true;
      } else {
        fc = false;
      }
      if (req.query.arc == "true") {
        arc = true;
      } else {
        arc = false;
      }

      csp.initialize([], false, values, vars);
      let startTime = Date.now();
      csp.cspAlgorithm([], csp.getDomains(), 0, false, fc, arc, valuesOrder, varsOrder)
      let timeElapsed = Date.now() - startTime;
      res.status(200).json({
        message: "Crossword solved successfully!",
        solution: csp.getSolution(undefined, undefined, false),
        steps: csp.getSteps(),
        time: timeElapsed
      })
      csp.reset()


    })

  })
})

module.exports = app;


