'use strict';
//allows the user to right click without openning the context menu.
const noContext = document.getElementById('RightClickCell');
noContext.addEventListener('contextmenu',(e)=>{
    e.preventDefault();
});

var gLevel={
    size:4,
    mines:2
    };
var gGame;
var gBoard;
var gTimeStart;
var isFisrtClick=true;
var gIntervalTime;
var gIsHint =false;
var gisHintOn =false;
var gIsSizeChanged=false;
//manual
var gisManual =false;
var gisSettingMines=false;
var gMinesCount=0;
var gMinesManual =[];
//sounds
const WINSOUND =new Audio('sounds/win.wav');
const LOSESOUND =new Audio('sounds/lost.wav');
const BOMBSOUND =new Audio('sounds/bomb.wav');
//emojis
const MINE ='💣';
const FLAG  ='🚩';
const LIFE = '❤️';
const LIFE_LOST = '❤️‍🩹';
const HINT='💡';
const USED ='🔋';
const NORMAL = '😃';
const SAD  = '🙁';
const LOST = '😵';
const WON ='😎';

function initGame()
{
    if(!gIsSizeChanged)
    {
        var elBestScore = document.querySelector('.bScore');
        var str ='(Easy):';
        var score = localStorage.getItem('bestScore'+gLevel.size);
        if(score===null) score=0;
        elBestScore.innerText = str+score+'sec';
    }
gGame ={
        isOn:false,
        shownCount:0,
        markedCount: 0,
        secPassed: 0,
        lives:3,
        hints:3,
        safeClick:3
        }
   gBoard = buildBoard();
   renderBoard(gBoard);
}

function buildBoard() {
    var size = gLevel.size;
    var board = [];
    for (var i = 0; i < size; i++) {
        board.push([]);
        for (var j = 0; j < size; j++) {
           var cell ={
               minesAroundCount:0,
               isShown: false,
               isMine: false,
               isMarked:false
           }
            board[i][j] = cell;
        }
    }
    return board;
}

function sizeSet(elRadio)
{
 gIsSizeChanged=true;
 var val = elRadio.value;
 var elBestScore = document.querySelector('.bScore');
 var str='';
 switch(val)
 {
     case "Easy(4x4)":
         gLevel.size =4;
         gLevel.mines =2;
         str = '(Easy):';
         break;
    case "Medium(8x8)":
        gLevel.size =8;
        gLevel.mines =12;
       str = '(Medium):';
         break;
    case "Hard(12x12)":
        gLevel.size=12;
        gLevel.mines=30;
        str = '(Hard):';
        break;
    default:
        gLevel.size =4;
        gLevel.mines =2;
        str = '(Easy):';
        break;
 }
 var score = localStorage.getItem('bestScore'+gLevel.size);
 if(score===null) score =0;
 elBestScore.innerText = str+score+'sec';
 resetGame();
}

function isManuel(flag)
{
    if(!flag && gisManual) 
    {
        gisManual=false;
        gisSettingMines = false;
        resetGame();
    }
    else if(flag&& !gisManual){ 
        gisManual=true;
        gisSettingMines = true;
        resetGame();
    }

}

function resetGame()
{
if(gIntervalTime)clearInterval(gIntervalTime);
gTimeStart = 0;
isFisrtClick = true;
gMinesCount=0;
gMinesManual=[];
//
var elStopper = document.querySelector('.stopper h2');
elStopper.innerText = '0:00';
var elLives = document.querySelector('.lives');
elLives.innerText = LIFE.repeat(3);
var elBt = document.querySelector('.smiley');
elBt.innerText = NORMAL;
var elHints = document.querySelector('.hints');
elHints.innerText = HINT.repeat(3)
var elSpan = document.querySelector('.spanSafeClick');
elSpan.innerText ='(3)';
if(gisManual) gisSettingMines =true;
//
var elBestScore = document.querySelector('.bScore');
var str='';
 switch(gLevel.size)
 {
     case 4:
         gLevel.size =4;
         gLevel.mines =2;
         str = '(Easy):';
         break;
    case 8:
        gLevel.size =8;
        gLevel.mines =12;
       str = '(Medium):';
         break;
    case 12:
        gLevel.size=12;
        gLevel.mines=30;
        str = '(Hard):';
        break;
    default:
        gLevel.size =4;
        gLevel.mines =2;
        str = '(Easy):';
        break;
 }
 var score = localStorage.getItem('bestScore'+gLevel.size)
 if(score===null) score=0;
 elBestScore.innerText = str +score+'sec';
initGame();
}

function placeMines(board,idxI,idxJ)
{
    var emptyCells = findEmptyCells(board);
    emptyCells = shuffle(emptyCells);
    for(var i=0; i<gLevel.mines; i++)
    {
       var pos = emptyCells.shift();
       if(idxI === pos.i && idxJ===pos.j)
       {
        pos = emptyCells.pop();
       } 
       board[pos.i][pos.j].isMine = true;
    }
}

function renderBoard(board)
{
    var strHTML='';
    for(var i=0; i<board.length; i++)
    {
     strHTML+= `<tr>\n`
      for(var j=0; j<board[0].length; j++)
      {
          var cell = board[i][j]
          var cellStr = '';
          if(cell.isShown) 
          {
            cellStr = (cell.isMine)?MINE:cell.minesAroundCount;
          }
          strHTML += `\t<td id="cell-${i}-${j}" 
          onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="addFlag(this,${i},${j})" >${cellStr}
       </td>\n`
      }   
      strHTML += `</tr>\n`  
    }
    var elBoardCells = document.querySelector('.board-cells');
    elBoardCells.innerHTML = strHTML;
}

function gameOver(isWin=false)
{
    var sound = (isWin) ?WINSOUND:LOSESOUND;
    sound.play();
    var elBt = document.querySelector('.smiley');
   if(!isWin) 
   {
       showAllMines();
       
   }
   elBt.innerText = (isWin) ?WON:LOST;
    gGame.isOn = false;
    clearInterval(gIntervalTime);
    
    //upload score to local storage
    if(isWin)
    {
        var score = localStorage.getItem('bestScore'+gLevel.size);
        score = Number(score);
        if(score ===null || score>gGame.secPassed||score===0)localStorage.setItem('bestScore'+gLevel.size,gGame.secPassed);
    }
}

function showAllMines()
{
    for(var i=0; i<gBoard.length; i++)
    {
    for(var j=0; j<gBoard.length; j++)
    {
        var cell = gBoard[i][j];
        if(cell.isMine)
        {
            var elCell =document.getElementById(`cell-${i}-${j}`);
            elCell.innerText = MINE;
        }
    }
    }
}

function useHint()
{
 if(!gIsHint && !isFisrtClick)gIsHint = true;
}

function safeClicked()
{
    if(gisSettingMines) return;
       if(gGame.safeClick>0)
    {
    var emptyCells = findEmptyCells(gBoard);
    emptyCells = shuffle(emptyCells)
    var pos =emptyCells.pop();
    var elCell = document.getElementById(`cell-${pos.i}-${pos.j}`)
    var elSpan = document.querySelector('.spanSafeClick');
    elSpan.innerText ='('+--gGame.safeClick+')';
    elCell.classList.add('safeClick');
    setTimeout(() => {
        elCell.classList.remove('safeClick')
    }, 700);
   }
}

function manualySetMines(i,j)
{
  var cell = gBoard[i][j];
  if(cell.isMine) return false;
  cell.isMine=true;
  var elCell = document.getElementById(`cell-${i}-${j}`);
  elCell.innerText = MINE;
  gMinesManual.push({i:i,j:j});
  gMinesCount++;
  return true;
}

function cellClicked(elCell,i,j)
{
    if(gisManual && gisSettingMines)
    {
      var flag = manualySetMines(i,j);
      if(!flag) return;
      else{
           if(gMinesCount===gLevel.mines)
           {
               console.log(gMinesManual)
               alert('game starts')
               gisSettingMines=false;
               isFisrtClick=false;
               gTimeStart = Date.now();
               gIntervalTime = setInterval(showTime,100);
               for(var i=0; i<gMinesManual.length;i++)
               {
                   var pos = gMinesManual[i];
                   var elCellTemp = document.getElementById(`cell-${pos.i}-${pos.j}`);
                   elCellTemp.innerText = '';
               }
               setMinesNegsCount(gBoard);
               renderBoard(gBoard);
               gGame.isOn =true;
               gMinesCount=0;
               gMinesManual=[];
           }
      }
      return;
    }
    if(gisHintOn) return;
    var cell = gBoard[i][j];
    if(gIsHint&&!isFisrtClick&&gGame.hints>0&&!cell.isShown)
    {  
        gisHintOn=true;
       gGame.hints--;
       elCell.innerText=(cell.isMine)?MINE:cell.minesAroundCount;
       expandShownHint(gBoard,elCell,i,j);
        setTimeout(()=>{
            gIsHint=false;
        },1000);
        var elHints = document.querySelector('.hints');
        elHints.innerText = HINT.repeat(gGame.hints)+USED.repeat(3-gGame.hints);
        return;
    }
    if(isFisrtClick) 
    {
        cell.isShown =true;
        gGame.shownCount++;
        placeMines(gBoard,i,j);
        setMinesNegsCount(gBoard);
        if(cell.minesAroundCount===0)fullExpand(gBoard,elCell,i,j);
        renderBoard(gBoard);
        gTimeStart = Date.now();
        gIntervalTime = setInterval(showTime,100);
        gGame.isOn = true;
        isFisrtClick = false;
    }
    if(!gGame.isOn||cell.isShown||cell.isMarked)return;
    
    if(cell.isMine) 
    {
        BOMBSOUND.play();
        var elLives = document.querySelector('.lives');
        var elBt = document.querySelector('.smiley');
        cell.isShown = true;
        gGame.shownCount++;
        elCell.innerText = MINE;
        if(gGame.lives===1) 
        {
            gameOver();
            gGame.lives--;
            elBt.innerText = LOST;
            elLives.innerText = LIFE.repeat(gGame.lives) + LIFE_LOST.repeat(3-gGame.lives);
            return;
        }
        gGame.lives--;    
        elLives.innerText = LIFE.repeat(gGame.lives) + LIFE_LOST.repeat(3-gGame.lives);
        elBt.innerText = SAD;
        setTimeout(()=>{elBt.innerText=NORMAL},500);

    }
    else if(!cell.isMarked){
        elCell.innerText = cell.minesAroundCount;
        cell.isShown = true;
        gGame.shownCount++;
        //expandShown(gBoard,elCell,i,j);
        if(cell.minesAroundCount===0)fullExpand(gBoard,elCell,i,j);  
        if(gGame.markedCount===gLevel.mines)
        {
            var  flag =checkGameOver();
            if(flag)gameOver(flag);
        }
    }

}
function addFlag(elCell,i,j)
{
    if(!gGame.isOn)return;
    var cell = gBoard[i][j];
    if(cell.isShown&&!cell.isMine)return 
    if(cell.isMarked)
    {
        cell.isMarked = false;
        gGame.markedCount--;
        elCell.innerText=(cell.isMine && cell.isShown)?MINE:'';
    }
    else{
        cell.isMarked = true;
        elCell.innerText = FLAG;
        gGame.markedCount++;
        if(gGame.markedCount===gLevel.mines){
            var flag =checkGameOver();
            if(flag)gameOver(flag);
        }
    }
}

function expandShownHint(board,elCell,cellI,cellJ)
{
    var hintsPositions = [{i:cellI,j:cellJ}];
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > board[i].length - 1) continue;
            if (i === cellI && j === cellJ) continue;
           var cell = board[i][j];
           elCell = document.getElementById(`cell-${i}-${j}`)
            if(!cell.isMarked && !cell.isShown && !gIsHint)
            {
                cell.isShown =true;
                
                elCell.innerText = cell.minesAroundCount;
                gGame.shownCount++;
                continue;
            }
            if(gIsHint&&!cell.isShown&&!cell.isMarked)
            {
                hintsPositions.push({i:i,j:j});
                elCell.innerText=(cell.isMine)?MINE:cell.minesAroundCount;
            }
        }
    }
    setTimeout(()=>{
        clearHints(hintsPositions)},1800);
}

function fullExpand(board,elCell,cellI,cellJ)
{
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > board[i].length - 1) continue;
            if (i === cellI && j === cellJ) continue;
           var cell = board[i][j];
           elCell = document.getElementById(`cell-${i}-${j}`)
            if(!cell.isMarked && !cell.isShown && !gIsHint)
            {
                cell.isShown =true;
                elCell.innerText = cell.minesAroundCount;
                gGame.shownCount++;
                if(cell.minesAroundCount===0) fullExpand(board,elCell,i,j);
                continue;
            }
            if(gIsHint&&!cell.isShown&&!cell.isMarked)
            {
                hintsPositions.push({i:i,j:j});
                elCell.innerText=(cell.isMine)?MINE:cell.minesAroundCount;
            }
        }
        
    }
}

function clearHints(hintsPositions)
{
   if(hintsPositions.length!==1)
   {
      for(var i=0; i<hintsPositions.length; i++)
      {
        var idxI =hintsPositions[i].i;
        var idxJ = hintsPositions[i].j;
        var elCell = document.getElementById(`cell-${idxI}-${idxJ}`)
        elCell.innerText ='';
      }
   }
   gisHintOn = false;
}

function checkGameOver()
{
    for(var i=0;i<gBoard.length;i++)
    {
        for(var j=0; j<gBoard.length; j++)
        {
           var cell = gBoard[i][j];
            if(cell.isMine)
            {
                if(!cell.isMarked) return false;
            }
            else{
                if(cell.isMarked)return false;
                if(!cell.isShown)return false;
            }
        }
    }
    return true;
}

function showTime()
{
    var now = Date.now();
    var time = now - gTimeStart;
   // time = parseInt(time/1000);
    gGame.secPassed = parseInt(time/1000);
    var elStopper = document.querySelector('.stopper');
    var elStopperh2 = elStopper.querySelector('h2');
    elStopperh2.innerText = timeToString(time);
    // if(time<60)
    // {
    //  elStopperh2.innerText = time+'s';
    // }
    // else{
        // var temp =parseInt(parseInt(time)/60);
        // time = parseInt(time-(temp*60));
}

function setMinesNegsCount(board)
{
  for(var i=0; i<board.length; i++)
  {
      for(var j=0;  j<board.length; j++)
      {
          var cell = board[i][j];
          cell.minesAroundCount = (!cell.isMine)?countMineNegs({i:i,j:j}):0;
      }
  }
}

function countMineNegs(pos)
{  
    var cell;
    var cellI = pos.i;
    var cellJ = pos.j;
    var MineCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > gBoard[i].length - 1) continue;
            if (i === cellI && j === cellJ) continue;
            cell = gBoard[i][j];
            if (cell.isMine) MineCount++;
        }
    }
    return MineCount;
}