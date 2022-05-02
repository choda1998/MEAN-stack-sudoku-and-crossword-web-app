
const BLOCKS = [
  [0, 1, 2, 9, 10, 11, 18, 19, 20],
  [3, 4, 5, 12, 13, 14, 21, 22, 23],
  [6, 7, 8, 15, 16, 17, 24, 25, 26],
  [27, 28, 29, 36, 37, 38, 45, 46, 47],
  [30, 31, 32, 39, 40, 41, 48, 49, 50],
  [33, 34, 35, 42, 43, 44, 51, 52, 53],
  [54, 55, 56, 63, 64, 65, 72, 73, 74],
  [57, 58, 59, 66, 67, 68, 75, 76, 77],
  [60, 61, 62, 69, 70, 71, 78, 79, 80]

]

var domains;
var variables = [];
var unassignedVars = []
var steps = [];
var crosswordValues = [];
var crosswordHeight;
var crosswordWidth;

function cspAlgorithm(preAssignedVariables, domains, level, sudoku, fc, arc, valuesOrder, varsOrder) {
  if (level == unassignedVars.length) {
    return true;
  }
  let varIndex = level;       // izbor promenljive na osnovu prosledjenih parametara
  if (varsOrder == 1) {
    varIndex = getVarMCV(sudoku);
  } else if (varsOrder == 2) {

    varIndex = getVarMRV(domains);

  }
  let currentVar = unassignedVars[varIndex];
  let currentDomain = domains[varIndex];
  if (valuesOrder == 1)           // izbor vrednosti na osnovu prosledjenih parametara
    sortValuesLCV(varIndex, domains, sudoku)
  for (let i = 0; i < currentDomain.length; i++) {
    if (isConsistentAssignment(varIndex, currentDomain[i], sudoku)) { // provera konzistentosti dodele
      currentVar.value = currentDomain[i];
      newDomains = copy(domains)
      newDomains[varIndex].splice(i, 1);  // ako je u redu dodeljuje se vrednost i azuriraju se domeni



      steps.push({            // dodaje se novi korak algoritma
        num: steps.length + 1,
        index: varIndex,
        value: currentVar.value,
        domain: [...domains[varIndex]]
      })

      // forward checking
      if (fc == true) {
        var constrainedVars = getConstrainedVars(varIndex, sudoku);  // dohvataju se promenljive koje su u ogranicenju sa trenutnom


        for (let i = 0; i < constrainedVars.length; i++) {
          if (constrainedVars[i].value == 0) {
            let indexOfDomain;

            indexOfDomain = unassignedVars.findIndex(cell => cell == constrainedVars[i])

            if (indexOfDomain != -1) {
              for (let i = 0; i < newDomains[indexOfDomain].length; i++) { // prolazi se kroz njihove domene i uklanjaju vrednosti koje nisu konzistentne sa dodeljenom vrednoscu
                if (!areLegalValues(varIndex, currentVar.value, indexOfDomain, newDomains[indexOfDomain][i], sudoku)) {
                  newDomains[indexOfDomain].splice(i, 1);
                  i = i - 1
                }
              }
            }

          }
        }


      }


      // arc consitency
      if (arc == true) {
        if (!arcConsistency(newDomains, sudoku)) {
          currentVar.value = 0;
          steps.push({
            num: steps.length + 1,
            index: varIndex,
            value: 0,
            domain: domains[varIndex]
          })
          continue;
        }
      }


      if (cspAlgorithm(preAssignedVariables, newDomains, level + 1, sudoku, fc, arc, valuesOrder, varsOrder))
        return true;
      currentVar.value = 0; // dodaje se backtracking u korake algoritma
      steps.push({
        num: steps.length + 1,
        index: varIndex,
        value: 0,
        domain: domains[varIndex]
      })
    }
  }

  return false;
}

function getVarMRV(domains) {   // dohvata se indeks nedodeljene promenljive koja ima najmanje vrednosti u domenu
  let min = -1;
  let minLength = 100000;
  for (let i = 0; i < unassignedVars.length; i++) {
    if (unassignedVars[i].value != 0)
      continue;
    if (domains[i].length < minLength) {
      min = i;
      minLength = domains[min].length
    }
  }
  return min;
}

function getVarMCV(sudoku) { // dohvata se indeks nedodeljene promenljive koja je sa najvise promenljivih u ogranicenju
  let max = -1;
  let maxLength = -1;
  for (let i = 0; i < unassignedVars.length; i++) {
    if (unassignedVars[i].value != 0)
      continue;
    let cvars = getConstrainedVars(i, sudoku);
    let tempLength = cvars.length
    if (tempLength > maxLength) {
      max = i;
      maxLength = tempLength
    }
  }
  return max;
}

function sortValuesLCV(index, domains, sudoku) {  // sortiranje vrednosti tako da se najmanje vrednosti izbacuje iz drugih domena
  let constrainedVars = getConstrainedVars(index, sudoku)
  constrainedVars = constrainedVars.filter(v => v.value == 0)
  domains[index].sort((a, b) => {
    let cntA = 0;
    let cntB = 0;
    for (let i = 0; i < constrainedVars.length; i++) {
      let domainIndex = unassignedVars.findIndex(v => v == constrainedVars[i])

      for (let j = 0; j < domains[domainIndex].length; j++) {
        if (!areLegalValues(index, a, domainIndex, domains[domainIndex][j], sudoku)) {
          cntA++;
        }
        if (!areLegalValues(index, b, domainIndex, domains[domainIndex][j], sudoku)) {
          cntB++;
        }
      }
    }
    if (cntA >= cntB)
      return 1;
    else
      return -1;

  })
}

function arcConsistency(domains, sudoku) {
  let arcs = getAllArcs(sudoku);  // dohvataju se svi lukovi
  while (arcs.length > 0) {
    let currentArc = arcs.pop();  // dohvata se luk
    let vals_to_delete = [];
    let domain1 = domains[currentArc.index1];
    let domain2 = domains[currentArc.index2];
    for (let i = 0; i < domain1.length; i++) {  // provera vrednosi promenljivih koje sacinjavaju trenutni luk
      let domain2Empty = true;
      for (let j = 0; j < domain2.length; j++) {
        if (sudoku) {

          unassignedVars[currentArc.index1].value = domain1[i];
          if (isConsistentAssignment(currentArc.index2, domain2[j], sudoku)) { // ne gleda se samo binarno ogranicenje jer ne ubrzava algoritam
            domain2Empty = false;                                              // gleda se n-arno ogranicenje
            unassignedVars[currentArc.index1].value = 0;
            break;
          }
          unassignedVars[currentArc.index1].value = 0;

        } else {
          // CROSSWORD
          let ok = areLegalValues(currentArc.index1, domain1[i], currentArc.index2, domain2[j])
          if (ok) {
            domain2Empty = false;
            break;
          }


        }
      }
      if (domain2Empty) {
        vals_to_delete.push(domain1[i]);
      }
    }                                   // brisanje odredjenih vrednosti u slucaju da druga promenljiva ostaje sa praznim domenom
    if (vals_to_delete.length > 0) {
      for (let i = 0; i < vals_to_delete.length; i++) {
        let position = domain1.findIndex(val => val == vals_to_delete[i]);
        domain1.splice(position, 1);
      }
      if (domain1.length == 0)
        return false;
      let cvars = getConstrainedVars(currentArc.index1, sudoku);
      cvars = cvars.filter(vars => vars.value == 0)
      for (let j = 0; j < cvars.length; j++) {    // posto se obrisala neka vrednost, ponovo se proveravaju lukovi koji "ulaze" u trenutnu promenljivu
        let tempIndex = unassignedVars.findIndex(cell => cell == cvars[j])
        arcs.push({
          index1: tempIndex,
          index2: currentArc.index1,
        })
      }
    }
  }
  return true;
}


function getAllArcs(sudoku) {  // dohvatanje svih lukova
  let arcs = [];
  for (let i = 0; i < unassignedVars.length; i++) {

    if (unassignedVars[i].value == 0) {
      let cvars = getConstrainedVars(i, sudoku);
      for (let j = 0; j < cvars.length; j++) {
        if (cvars[j].value == 0) {
          let k = unassignedVars.findIndex(cell => cell == cvars[j])
          arcs.push({
            index1: i,
            index2: k
          })
        }
      }
    }

  }

  return arcs;
}


function initialize(preAssignedVariables, sudoku, cvalues, cvars) { // inicijalizacija algoritma
  if (sudoku == true) {   // inicijalizacija za slucaj da se resava sudoku
    for (let i = 0; i < 81; i++) {
      if (preAssignedVariables.find(cell => cell.index == i) != undefined) {
        var sudoku_cell = (preAssignedVariables.filter(cell => cell.index == i)[0]) // dodavanje promenljivih koje su vec dodeljene
        variables.push({
          index: i,
          value: sudoku_cell.value
        })
      } else {
        let temp = {    // dodavanje promenljivih koje algoritam treba da resi
          index: i,
          value: 0
        }
        variables.push(temp);
        unassignedVars.push(temp);
      }
    }

    let varNumber = 81 - preAssignedVariables.length; // broj promenljivih koje algoritam treba da resi
    domains = new Array(varNumber).fill(0).map(() => new Array(9).fill(0)) // punjenje domena vrednostima od 0 do 9
    for (let i = 0; i < varNumber; i++) {
      for (let j = 0; j < 9; j++) {
        domains[i][j] = j + 1;
      }
    }
  } else {  // inicijalizacija algoritma u slucaju da se resava ukrstenica
    cvars = cvars.filter(v => v.isBlack == false) // promenljive ukrstenice
    // filtriraju se promenljive koje predstavljaju crna polja (nisu potrebne algoritmu)
    crosswordValues = cvalues; // reci ukrstenice
    domains = new Array(cvars.length);
    crosswordWidth = cvars[0].width; // dimenzije ukrstenice
    crosswordHeight = cvars[0].height;
    for (let i = 0; i < cvars.length; i++) {
      let temp = {
        index: cvars[i].index,
        value: 0,
        isHorizontal: cvars[i].isHorizontal,
        length: cvars[i].length,
        label: cvars[i].label
      }
      variables.push(temp);
      unassignedVars.push(temp);

      let domainValues = crosswordValues.filter(val => val.value.length == temp.length) // punjenje domena
      domains[i] = new Array(domainValues.length);
      for (let j = 0; j < domainValues.length; j++) {
        let valIndex = crosswordValues.findIndex(val => val.value == domainValues[j].value) + 1

        domains[i][j] = valIndex;
      }

    }

  }

}


function getConstrainedVars(index, sudoku) { // dohvatanje promenljivih sa kojima je odredjena promenljiva u ogranicenju
  if (sudoku == true) {
    var varBlock;
    let myVarIndex = unassignedVars[index].index
    for (let i = 0; i < 9; i++) {
      if (BLOCKS[i].find(cell => cell == myVarIndex) != undefined) {
        varBlock = i;
        break;
      }
    }
    var horizontalCells = variables.filter(cell => (Math.floor(cell.index / 9)) == (Math.floor(myVarIndex / 9)))
    var verticalCells = variables.filter(cell => cell.index % 9 == myVarIndex % 9)
    var blockCells = variables.filter(cell => BLOCKS[varBlock].find(elem => elem == cell.index) != undefined);
    var allConVars = horizontalCells.concat(verticalCells, blockCells);
    allConVars = [... new Set(allConVars)]
    allConVars = allConVars.filter(cell => cell.index != myVarIndex)

    return allConVars;
  }
  else {

    let lengthVars = getCrosswordLengthConstrainedVars(index)
    let directionVars = getCrosswordDirectionConstrainedVars(index)
    let allConVars = lengthVars.concat(directionVars);
    allConVars = allConVars.filter(v => v != unassignedVars[index])
    return allConVars
  }



}

function getCrosswordDirectionConstrainedVars(myVarIndex) { // dohvatanje promenljivih iz ukrstenice koje se "seku" sa datom promenljivom
  let myVar = unassignedVars[myVarIndex]
  let direction = myVar.isHorizontal;
  let directionVars = [];
  let myColNumber = myVar.index % crosswordWidth;
  let myRowNumber = Math.floor(myVar.index / crosswordHeight);
  if (direction == true) {
    directionVars = variables.filter(v => (v.isHorizontal == false)
      && (v.index % crosswordWidth >= myColNumber) && (v.index % crosswordWidth < myColNumber + myVar.length)
      && (Math.floor(v.index / crosswordHeight) + v.length) > myRowNumber && ((Math.floor(v.index / crosswordHeight) <= myRowNumber)))
  } else {
    directionVars = variables.filter(v => (v.isHorizontal == true)
      && (Math.floor(v.index / crosswordHeight) >= myRowNumber) && (Math.floor(v.index / crosswordHeight) < myRowNumber + myVar.length)
      && ((v.index % crosswordWidth + v.length) > myColNumber) && (v.index % crosswordWidth) <= myColNumber)
  }
  return directionVars;
}


function getCrosswordLengthConstrainedVars(myVarIndex) { // dohvatanje promenljivih iz ukrstenice koje su u ogranicenju po duzini reci sa datom promenljvom
  let myVar = unassignedVars[myVarIndex]
  let lengthVars = variables.filter(v => v.length == myVar.length && v != myVar)
  return lengthVars
}


function isConsistentAssignment(varIndex, value, sudoku) { // provera konzistentosti dodele
  if (sudoku == true) {

    let allConVars = getConstrainedVars(varIndex, sudoku)
    let allOK = allConVars.find(cell => cell.value == value) == undefined;

    return allOK;
  } else {


    let allConVars = getConstrainedVars(varIndex, sudoku)
    let ok = true;
    for (let i = 0; i < allConVars.length; i++) {
      if (allConVars[i].value == 0)
        continue;
      else {
        let index2 = unassignedVars.findIndex(v => v == allConVars[i])
        ok = areLegalValues(varIndex, value, index2, allConVars[i].value, sudoku)
        if (!ok)
          break;
      }
    }

    return ok;
  }
}

function areLegalValues(index1, val1, index2, val2, sudoku) { // provera binarnog ogranicenja izmedju dve date promenljive
  if (sudoku == true) { // sudoku
    return val1 != val2
  } else { // ukrstenica
    let var1 = unassignedVars[index1];
    let var2 = unassignedVars[index2];
    let lengthVars = getCrosswordLengthConstrainedVars(index1, sudoku);
    let directionVars = getCrosswordDirectionConstrainedVars(index1, sudoku);
    let lengthOk = true;
    let directionOk = true;
    if (lengthVars.includes(var2)) { // provera ako su iste duzine
      lengthOk = val1 != val2;
    }
    if (directionVars.includes(var2)) { // provera ako se ove promenljive "seku"


      let word1 = crosswordValues[val1 - 1].value;
      let colNumber1 = var1.index % crosswordWidth;
      let rowNumber1 = Math.floor(var1.index / crosswordHeight);


      let word2 = crosswordValues[val2 - 1].value;
      let colNumber2 = var2.index % crosswordWidth;
      let rowNumber2 = Math.floor(var2.index / crosswordHeight);



      if (var1.isHorizontal == true) {
        directionOk = word1.charAt(Math.abs(colNumber1 - colNumber2)) == word2.charAt(Math.abs(rowNumber1 - rowNumber2))
      } else {
        directionOk = word2.charAt(Math.abs(colNumber1 - colNumber2)) == word1.charAt(Math.abs(rowNumber1 - rowNumber2))
      }



    }
    return directionOk && lengthOk;
  }
}

// POMOCNE FUNKCIJE

function copy(domains) {
  var len = domains.length
  var copyDomains = new Array(len);
  for (let i = 0; i < len; i++) {
    copyDomains[i] = new Array(domains[i].length);
    for (let j = 0; j < domains[i].length; j++)
      copyDomains[i][j] = domains[i][j];
  }
  return copyDomains;
}

function getDomains() {
  return domains;
}

function getSolution(difficulty, sudoku_id, sudoku) {
  let solution = [];
  if (sudoku == true) {
    for (let i = 0; i < unassignedVars.length; i++) {
      solution.push({
        _id: "solution",
        sudoku_id: sudoku_id,
        index: unassignedVars[i].index,
        value: unassignedVars[i].value,
        difficulty: difficulty
      })
    }
    return solution;
  } else {
    for (let i = 0; i < unassignedVars.length; i++) {
      solution.push(unassignedVars[i])
    }
    return solution;
  }
}

function reset() {
  domains.splice(0);
  unassignedVars.splice(0);
  variables.splice(0);
  steps.splice(0);
  crosswordValues.splice(0);
}

function getSteps() {
  return steps;
}


module.exports = { initialize, cspAlgorithm, getDomains, getSolution, reset, getSteps }
