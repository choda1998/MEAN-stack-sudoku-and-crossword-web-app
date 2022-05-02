import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CrosswordComponent } from './crossword/crossword.component';
import { SudokuComponent } from './sudoku/sudoku.component';

const routes: Routes = [
  { path: '', component: SudokuComponent },
  { path: 'crossword', component: CrosswordComponent },
  { path: 'sudoku', component: SudokuComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
