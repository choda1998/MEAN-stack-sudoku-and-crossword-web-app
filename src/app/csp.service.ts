import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CrosswordValue } from './models/crossword_value';
import { CrosswordVar } from './models/crossword_var';
import { CspStep } from './models/csp_step';
import { SudokuCell } from './models/sudoku_cell';

@Injectable({
  providedIn: 'root'
})
export class CspService {


  private sudokus = new Subject<SudokuCell[]>();
  private solution = new Subject<{ cells: SudokuCell[], steps: CspStep[], time: number }>();
  private crosswords = new Subject<{ vars: CrosswordVar[], values: CrosswordValue[] }>()
  private crosswordSolution = new Subject<{ vars: CrosswordVar[], steps: CspStep[]; time: number }>();



  private cells: SudokuCell[] = [];
  private solutionCells: SudokuCell[] = [];
  private solutionVars: CrosswordVar[] = [];
  private steps: CspStep[] = [];
  private crosswordVars: CrosswordVar[] = [];
  private crosswordValues: CrosswordValue[] = [];

  constructor(private http: HttpClient) { }

  getSudokusListener() {
    return this.sudokus.asObservable();
  }

  getCrosswordsListener() {
    return this.crosswords.asObservable();
  }

  getSolutionUpdateListener() {
    return this.solution.asObservable();
  }

  getCrosswordSolutionUpdateListener() {
    return this.crosswordSolution.asObservable();
  }


  getCrosswords() {
    this.http
      .get<{
        message: string;
        crosswordVars: CrosswordVar[],
        crosswordValues: CrosswordValue[]
      }>(
        "http://localhost:3000/api/crossword"
      )
      .subscribe(crosswords => {

        this.crosswordVars = crosswords.crosswordVars;
        this.crosswordValues = crosswords.crosswordValues;
        this.crosswords.next({ vars: [...this.crosswordVars], values: [...this.crosswordValues] })
      });
  }

  getSudokus() {
    this.http
      .get<{ message: string; sudokuCells: SudokuCell[] }>(
        "http://localhost:3000/api/sudoku"
      )
      .subscribe(sudoku => {

        this.cells = sudoku.sudokuCells;
        this.sudokus.next([...this.cells]);
      });
  }

  solveSudoku(id: number, fc: boolean, arc: boolean, valuesOrder: number, varsOrder: number) {
    const queryParams = `?fc=${fc}&arc=${arc}&valuesOrder=${valuesOrder}&varsOrder=${varsOrder}`;
    this.http
      .get<{ message: string; solution: SudokuCell[], steps: CspStep[], time: number }>(
        "http://localhost:3000/api/sudoku/solve/" + id + "/" + queryParams
      )
      .subscribe(sudoku => {
        this.steps = sudoku.steps;
        this.solutionCells = sudoku.solution;
        this.solution.next({ cells: [...this.solutionCells], steps: [...this.steps], time: sudoku.time })
      });
  }


  solveCrossword(id: number, fc: boolean, arc: boolean, valuesOrder: number, varsOrder: number) {
    const queryParams = `?fc=${fc}&arc=${arc}&valuesOrder=${valuesOrder}&varsOrder=${varsOrder}`;
    this.http
      .get<{ message: string; solution: CrosswordVar[], steps: CspStep[], time: number }>(
        "http://localhost:3000/api/crossword/solve/" + id + "/" + queryParams
      )
      .subscribe(crossword => {
        this.steps = crossword.steps;
        this.solutionVars = crossword.solution;
        this.crosswordSolution.next({ vars: [...this.solutionVars], steps: [...this.steps], time: crossword.time })
      });
  }

  addSudoku(sudoku_cells: SudokuCell[]) {
    this.http
      .post<{ message: string }>(
        "http://localhost:3000/api/sudoku/", { cells: sudoku_cells }
      )
      .subscribe(response => {
        location.reload();
        alert("Uspesno dodat sudoku!");
      })
  }

  addCrossword(crossword_vars: CrosswordVar[], crossword_values: CrosswordValue[]) {
    this.http
      .post<{ message: string }>(
        "http://localhost:3000/api/crossword/", { vars: crossword_vars, values: crossword_values }
      )
      .subscribe(response => {
        location.reload();
        alert("Uspesno dodata ukrstenica!")
      })

  }

  deleteSudoku(id: number) {
    this.http
      .delete<{ message: string }>(
        "http://localhost:3000/api/sudoku/" + id
      )
      .subscribe(response => {
        alert("Sudoku uspesno izbrisan");
        location.reload();
      })
  }

  deleteCrossword(id: number) {
    this.http
      .delete<{ message: string }>(
        "http://localhost:3000/api/crossword/" + id
      ).subscribe(response => {
        alert("Ukrstenica uspesno izbrisana");
        location.reload();
      })
  }

}
