import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CspService } from '../csp.service';
import { CrosswordCell } from '../models/crossword_cell';
import { CrosswordValue } from '../models/crossword_value';
import { CrosswordVar } from '../models/crossword_var';
import { CspStep } from '../models/csp_step';

const NUMBER_OF_CROSSWORDS = 3

@Component({
  selector: 'app-crossword',
  templateUrl: './crossword.component.html',
  styleUrls: ['./crossword.component.css']
})



export class CrosswordComponent implements OnInit, OnDestroy {
  allCrosswords: CrosswordVar[] = [];
  allValues: CrosswordValue[] = [];
  maxCrosswordId: number = 0;
  setOfCrosswordIds: number[] = [];

  currentIndex: number = 0
  currentValues: CrosswordValue[] = [];
  currentCrossword: CrosswordVar[] = []
  currentDisplay: CrosswordCell[] = [];
  currentSolution: CrosswordVar[] = [];
  currentSteps: CspStep[] = [];
  currentStepCounter: number = -1;
  currentStepDisplay: CspStep = { num: 0, index: 0, value: 0, domain: [] };
  currentMarkedCells: CrosswordCell[] = [];

  currentheight: number = 0;
  currentWidth: number = 0;

  private crosswordSub: Subscription = Subscription.EMPTY;
  private solutionSub: Subscription = Subscription.EMPTY;

  time: number = 0;
  isLoading: boolean = false;
  isSolving: boolean = false;
  isCompleted: boolean = false;

  // CSP PARAMETERS
  fc: boolean = false;
  arc: boolean = false;
  valuesOrder: number = 0;
  varsOrder: number = 0;
  constructor(public cspService: CspService) {

  }

  ngOnInit(): void {
    this.cspService.getCrosswords();
    this.isLoading = true;

    this.crosswordSub = this.cspService.getCrosswordsListener()
      .subscribe((crosswords: { vars: CrosswordVar[], values: CrosswordValue[] }) => {
        this.isLoading = false;
        this.allCrosswords = crosswords.vars;
        this.allValues = crosswords.values;
        let tempCrosswordIds: number[] = []
        for (let i = 0; i < this.allCrosswords.length; i++) {
          if (this.allCrosswords[i].crossword_id > this.maxCrosswordId) {
            this.maxCrosswordId = this.allCrosswords[i].crossword_id
          }
          tempCrosswordIds.push(this.allCrosswords[i].crossword_id);
        }
        this.setOfCrosswordIds = [... new Set(tempCrosswordIds)];
        this.displayCrossword();
      })

    this.solutionSub = this.cspService.getCrosswordSolutionUpdateListener()
      .subscribe((solution: { vars: CrosswordVar[], steps: CspStep[], time: number }) => {
        this.isLoading = false;
        this.currentSolution.splice(0);
        this.currentSteps.splice(0);
        this.currentSolution = solution.vars;
        this.currentSteps = solution.steps;
        this.time = solution.time;
      })




  }
  onRefresh() {
    window.location.reload();

  }

  onGetSolution() {
    this.isSolving = true;
    this.isLoading = true;
    this.cspService.solveCrossword(this.setOfCrosswordIds[this.currentIndex], this.fc, this.arc, this.valuesOrder, this.varsOrder);
  }

  onSolveCrossword() {
    this.isCompleted = true;
    for (let i = 0; i < this.currentSolution.length; i++) {
      this.fillCrossword(this.currentSolution[i], this.currentSolution[i].value)
    }
  }

  displayCrossword() {
    this.currentDisplay.splice(0);
    this.currentValues.splice(0);
    if (this.isCreating) {  // DODATA FUNKCIONALNOST
      this.currentCrossword = this.createdCrossword;
      this.currentheight = this.inputHeight;
      this.currentWidth = this.inputWidth;
    } else {
      this.currentCrossword = this.allCrosswords.filter(v => v.crossword_id == this.setOfCrosswordIds[this.currentIndex]);
      this.currentValues = this.allValues.filter(v => v.crossword_id == this.setOfCrosswordIds[this.currentIndex])
      this.currentheight = this.currentCrossword[0].height
      this.currentWidth = this.currentCrossword[0].width
    }
    for (let i = 0; i < this.currentheight; i++) {
      for (let j = 0; j < this.currentWidth; j++)
        this.currentDisplay.push({
          value: "",
          horizontalLabel: 0,
          verticalLabel: 0,
          isBlack: false
        })
    }
    for (let i = 0; i < this.currentCrossword.length; i++) {
      if (this.currentCrossword[i].isBlack == true) {
        this.currentDisplay[this.currentCrossword[i].index].isBlack = true;
      } else if (this.currentCrossword[i].isHorizontal == true) {
        this.currentDisplay[this.currentCrossword[i].index].horizontalLabel = this.currentCrossword[i].label
      } else if (this.currentCrossword[i].isHorizontal == false) {
        this.currentDisplay[this.currentCrossword[i].index].verticalLabel = this.currentCrossword[i].label
      }
    }
  }

  fillCrossword(v: CrosswordVar, val: number) {
    let startIndex = v.index
    let word;
    if (val != 0)
      word = this.currentValues[val - 1];
    else {
      let dummy;

      word = {
        crossword_id: this.setOfCrosswordIds[this.currentIndex],
        value: "",
      }
    }
    let cellIndexes = [];
    if (v.isHorizontal) {
      for (let i = 0; i < v.length; i++) {

        if (val == 0) {
          this.currentDisplay[startIndex + i].value = "";
        }
        else {
          this.currentDisplay[startIndex + i].value = word.value.charAt(i);
          cellIndexes.push(this.currentDisplay[startIndex + i]);
        }
      }
    } else {
      for (let i = 0; i < v.length; i++) {

        if (val == 0) {
          this.currentDisplay[startIndex + i * this.currentWidth].value = word.value.charAt(i);
        } else {
          this.currentDisplay[startIndex + i * this.currentWidth].value = word.value.charAt(i);
          cellIndexes.push(this.currentDisplay[startIndex + i * this.currentWidth]);
        }
      }

    }
    return cellIndexes;
  }

  onNext() {
    if (!this.isSolving) {
      if (this.currentIndex == (this.setOfCrosswordIds.length - 1)) {
        this.currentIndex = 0;

      }
      else
        this.currentIndex += 1;
      this.displayCrossword()
    } else {
      if (this.currentStepCounter == this.currentSteps.length - 1) {
        return;
      }
      this.currentStepCounter += 1;
      this.currentStepDisplay = this.currentSteps[this.currentStepCounter];
      this.currentMarkedCells = this.fillCrossword(this.currentSolution[this.currentSteps[this.currentStepCounter].index], this.currentSteps[this.currentStepCounter].value)

    }

  }

  onPrevious() {
    if (this.currentStepCounter == 0) {
      return;
    }
    else {
      let currentStep: CspStep = this.currentSteps[this.currentStepCounter];
      this.fillCrossword(this.currentSolution[currentStep.index], 0)
      this.currentStepCounter -= 1;
      this.currentStepDisplay = this.currentSteps[this.currentStepCounter];
      currentStep = this.currentSteps[this.currentStepCounter];
      this.currentMarkedCells = this.fillCrossword(this.currentSolution[currentStep.index], currentStep.value)
    }
  }

  ngOnDestroy() {
    this.crosswordSub.unsubscribe();
    this.solutionSub.unsubscribe();
  }
  // DODAVANJE NOVIH FUNKCIONALNOSTI

  isCreating: boolean = false;
  verticalLabel: string = "";
  horizontalLabel: string = "";
  isBlack: boolean = false;
  isVertical: boolean = false;
  isHorizontal: boolean = false;
  horizontalLength: string = "";
  verticalLength: string = "";
  isClicked: boolean = false;
  inputWord: string = "";
  createdCrossword: CrosswordVar[] = [];
  createdWords: CrosswordValue[] = [];
  inputHeight: number = 0;
  inputWidth: number = 0;
  cellIndex: number = 0;

  onEnterCreateMode() {
    this.isCreating = true;
    this.displayCrossword();
  }

  onPickCell(index: number) {
    if (this.isCreating == false)
      return;
    let temp: CrosswordVar[] = this.createdCrossword.filter(v => v.index == index)
    this.cellIndex = index;
    if (temp.length != 0) {
      for (let i = 0; i < temp.length; i++) {
        if (temp[i].isBlack == true) {
          this.isBlack = true;
        } else {
          if (temp[i].isHorizontal == true) {
            this.isBlack = false;
            this.isHorizontal = true;
            this.horizontalLabel = temp[i].label.toString();
            this.horizontalLength = temp[i].length.toString();
          }
          else {
            this.isBlack = false;
            this.isVertical = true;
            this.verticalLabel = temp[i].label.toString();
            this.verticalLength = temp[i].length.toString();
          }
        }
      }
    } else {
      this.isBlack = false;
      this.isHorizontal = false;
      this.isVertical = false;
      this.horizontalLabel = ""
      this.verticalLabel = ""
      this.horizontalLength = ""
      this.verticalLength = ""
    }

    this.isClicked = true;
  }

  onSaveCell(index: number) {
    if ((this.isHorizontal && (isNaN(parseInt(this.horizontalLabel)) || isNaN(parseInt(this.horizontalLength)))) ||
      (this.isVertical && (isNaN(parseInt(this.verticalLabel)) || isNaN(parseInt(this.verticalLength))))) {
      alert("Neispravan unos");
      return;
    }
    let indexH: number = -1;
    let indexV: number = -1;
    let indexB: number = -1;
    let temp: CrosswordVar[] = this.createdCrossword.filter(v => v.index == index)
    for (let i = 0; i < temp.length; i++) {
      if (temp[i].isBlack == true) {
        if (this.isBlack == false) {
          indexB = this.createdCrossword.findIndex(v => v.index == index && v.isBlack == true);
          this.createdCrossword.splice(indexB, 1);
        }
      }
      if (temp[i].isHorizontal == true && temp[i].isBlack == false) {
        indexH = this.createdCrossword.findIndex(v => v.index == index && v.isBlack == false && v.isHorizontal == true);
        if (this.isHorizontal == false || this.isBlack) {
          this.createdCrossword.splice(indexH, 1);
        } else {
          this.createdCrossword[indexH].label = parseInt(this.horizontalLabel);
          this.createdCrossword[indexH].length = parseInt(this.horizontalLength);
        }
      } else if (temp[i].isHorizontal == false && temp[i].isBlack == false) {
        indexV = this.createdCrossword.findIndex(v => v.index == index && v.isBlack == false && v.isHorizontal == false);
        if (this.isHorizontal == false || this.isBlack) {

          this.createdCrossword.splice(indexV, 1);
        } else {
          this.createdCrossword[indexV].label = parseInt(this.verticalLabel);
          this.createdCrossword[indexV].length = parseInt(this.verticalLength);
        }
      }
    }
    indexV = this.createdCrossword.findIndex(v => v.index == index && v.isBlack == false && v.isHorizontal == false);
    indexH = this.createdCrossword.findIndex(v => v.index == index && v.isBlack == false && v.isHorizontal == true);
    indexB = this.createdCrossword.findIndex(v => v.index == index && v.isBlack == true);
    if (this.isBlack == true) {
      let addedVar: CrosswordVar = {
        crossword_id: this.maxCrosswordId + 1,
        height: this.inputHeight,
        width: this.inputWidth,
        isBlack: this.isBlack,
        index: index,
        isHorizontal: false,
        label: 0,
        length: 0,
        value: 0
      }
      if (indexB == -1)
        this.createdCrossword.push(addedVar)
    } else {
      if (this.isHorizontal == true && indexH == -1) {
        let addedVar: CrosswordVar = {
          crossword_id: this.maxCrosswordId + 1,
          height: this.inputHeight,
          width: this.inputWidth,
          isBlack: this.isBlack,
          index: index,
          isHorizontal: true,
          label: parseInt(this.horizontalLabel),
          length: parseInt(this.horizontalLength),
          value: 0
        }

        this.createdCrossword.push(addedVar);
      }

      if (this.isVertical == true && indexV == -1) {
        let addedVar: CrosswordVar = {
          crossword_id: this.maxCrosswordId + 1,
          height: this.inputHeight,
          width: this.inputWidth,
          isBlack: this.isBlack,
          index: index,
          isHorizontal: false,
          label: parseInt(this.verticalLabel),
          length: parseInt(this.verticalLength),
          value: 0
        }
        this.createdCrossword.push(addedVar);
      }



    }




    this.displayCrossword();
  }

  onAddWord() {
    if (this.inputWord.length == 0)
      return;
    this.inputWord = this.inputWord.toUpperCase();
    let newValue: CrosswordValue = {
      crossword_id: this.maxCrosswordId + 1,
      value: this.inputWord
    }
    this.createdWords.push(newValue);
    let words: string[] = [];
    for (let i = 0; i < this.createdWords.length; i++)
      words.push(this.createdWords[i].value)
    this.inputWord = "";
    alert("Uspesno dodata rec. Dosadasnje reci su: \n" + words);
  }

  onCreateCrossword() {
    this.isLoading = true;
    this.cspService.addCrossword(this.createdCrossword, this.createdWords);
  }

  onDeleteCrossword() {
    this.isLoading = true;
    this.cspService.deleteCrossword(this.setOfCrosswordIds[this.currentIndex])
  }
}

