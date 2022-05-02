import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CspService } from '../csp.service';
import { CspStep } from '../models/csp_step';
import { SudokuCell } from '../models/sudoku_cell';


@Component({
  selector: 'app-sudoku',
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.css']
})

export class SudokuComponent implements OnInit, OnDestroy {
  allSudokus: SudokuCell[] = [];
  maxSudokuId: number = 0;
  setOfSudokuIds: number[] = [];

  currentIndex: number = 0;
  currentSudoku: SudokuCell[] = [];
  currentSolutionIndexes: number[] = [];
  currentSoluton: SudokuCell[] = [];
  currentSteps: CspStep[] = [];
  currentStepCounter: number = -1;
  currentStepDisplay: CspStep = { num: 0, index: 0, value: 0, domain: [] };

  time: number = 0;
  isLoading: boolean = false;
  isSolving: boolean = false;
  isCompleted: boolean = false;
  currentDifficulty: string = "";
  private sudokuSub: Subscription = Subscription.EMPTY;
  private solutionSub: Subscription = Subscription.EMPTY;

  // CSP PARAMETERS
  fc: boolean = false;
  arc: boolean = false;
  valuesOrder: number = 0;
  varsOrder: number = 0;
  constructor(public cspService: CspService) {

  }

  ngOnInit() {
    this.cspService.getSudokus();
    this.isLoading = true;

    this.sudokuSub = this.cspService.getSudokusListener().
      subscribe((sudokus: SudokuCell[]) => {
        this.isLoading = false;
        this.allSudokus = sudokus;
        let tempSudokuIds: number[] = [];
        for (let i = 0; i < this.allSudokus.length; i++) {
          if (this.allSudokus[i].sudoku_id > this.maxSudokuId) {
            this.maxSudokuId = this.allSudokus[i].sudoku_id;
          }
          tempSudokuIds.push(this.allSudokus[i].sudoku_id)

        }

        this.setOfSudokuIds = [... new Set(tempSudokuIds)];
        this.fillSudoku();
      });


    this.solutionSub = this.cspService.getSolutionUpdateListener().
      subscribe((solution: { cells: SudokuCell[], steps: CspStep[], time: number }) => {
        this.isLoading = false;
        this.currentSoluton.splice(0);
        this.currentSteps.splice(0);
        this.currentSteps = solution.steps
        this.currentSolutionIndexes.splice(0);
        this.time = solution.time
        for (let i = 0; i < solution.cells.length; i++) {
          this.currentSoluton.push(solution.cells[i])
          this.currentSolutionIndexes.push(solution.cells[i].index);
        }

      })



  }

  fillSudoku() {
    this.currentSudoku.splice(0);
    let cells: SudokuCell[] = this.allSudokus.filter(cell => cell.sudoku_id == this.setOfSudokuIds[this.currentIndex]);
    let currentDifficulty = cells[0].difficulty;
    if (currentDifficulty == 1) {
      this.currentDifficulty = "LAKO";
    } else if (currentDifficulty == 3) {
      this.currentDifficulty = "TEŽE"
    } else if (currentDifficulty == 5) {
      this.currentDifficulty = "NAJTEŽE"
    } else if (currentDifficulty == 0) {
      this.currentDifficulty = "";
    }
    for (let i = 0; i < 81; i++) {
      if (cells.filter(cell => cell.index == i).length == 1) {
        let tempCell: SudokuCell = cells.filter(cell => cell.index == i)[0]
        this.currentSudoku.push(tempCell);
      } else {
        let dummy: SudokuCell = {
          sudoku_id: this.currentIndex,
          index: i,
          value: 0,
          difficulty: currentDifficulty
        }
        this.currentSudoku.push(dummy);
      }

    }
  }
  onGetSolution() {
    this.isSolving = true;
    this.isLoading = true;
    this.cspService.solveSudoku(this.setOfSudokuIds[this.currentIndex], this.fc, this.arc, this.valuesOrder, this.varsOrder);

  }

  onSolveSudoku() {

    this.isCompleted = true;
    for (let i = 0; i < this.currentSoluton.length; i++) {
      this.currentSudoku[this.currentSudoku.findIndex(cell => this.currentSoluton[i].index == cell.index)]
        .value = this.currentSoluton[i].value
    }

  }
  onRefresh() {
    location.reload()
  }
  onNext() {
    if (!this.isSolving) {
      if (this.currentIndex == (this.setOfSudokuIds.length - 1))
        this.currentIndex = 0;
      else
        this.currentIndex += 1;

      this.fillSudoku();
    } else {
      if (this.currentStepCounter == this.currentSteps.length - 1) {
        return;
      }
      this.currentStepCounter += 1;
      this.currentStepDisplay = this.currentSteps[this.currentStepCounter];
      this.currentSudoku[this.currentSudoku.findIndex(cell => this.currentSoluton[this.currentStepDisplay.index].index == cell.index)]
        .value = this.currentStepDisplay.value
    }

  }

  onPrevious() {
    if (this.currentStepCounter == 0) {
      return;
    }
    else {
      this.currentStepCounter -= 1;
      let index = this.currentSudoku.findIndex(cell => this.currentSoluton[this.currentStepDisplay.index].index == cell.index)
      this.currentSudoku[index].value = 0;
      this.currentStepDisplay = this.currentSteps[this.currentStepCounter];
      index = this.currentSudoku.findIndex(cell => this.currentSoluton[this.currentStepDisplay.index].index == cell.index)
      this.currentSudoku[index].value = this.currentStepDisplay.value;
    }
  }


  ngOnDestroy() {
    this.sudokuSub.unsubscribe();
    this.solutionSub.unsubscribe();

  }


  // DODAVANJE NOVIH FUNKCIONALNOSTI ------>

  isCreating: boolean = false;


  onEnterCreateMode() {
    this.currentSudoku.splice(0);
    for (let i = 0; i < 81; i++) {
      let dummy: SudokuCell = {
        sudoku_id: this.maxSudokuId + 1,
        index: i,
        value: undefined,
        difficulty: 0
      }
      this.currentSudoku.push(dummy);
    }
    this.isCreating = true;

  }

  onCreateSudoku() {
    let createdSudoku: SudokuCell[] = [];
    for (let i = 0; i < this.currentSudoku.length; i++) {
      if (this.currentSudoku[i].value == undefined || this.currentSudoku[i].value?.toString() === "")
        continue;
      else {
        if (!((this.currentSudoku[i].value as number) > 0 && (this.currentSudoku[i].value as number) <= 9)) {
          alert("Neispravan unos! Svaka celija u sudoku mora biti broj od 1 do 9!")
          return;
        }
        createdSudoku.push(this.currentSudoku[i])
      }
    }
    this.isLoading = true;
    this.cspService.addSudoku(createdSudoku);

  }

  onDeleteSudoku() {
    this.isLoading = true;
    this.cspService.deleteSudoku(this.setOfSudokuIds[this.currentIndex]);
  }
}




