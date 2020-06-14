

// rhythm : 75% target, 25% no target
// random : same but instead of 600MS between stimuli - random
// pairs : red-red, then white-green. intrapair-random 600/900 MS. interpair: random

//  COPIED FROM MATLAB:
// params.Time.cue=[0.6; 0.9]; % target intervals
// params.Time.ISI=[1.3 1.4 1.5 1.6 1.7; 1.95 2.1 2.25 2.4 2.55]; %inter-pair interval in interval condition
// params.Time.tarIntervalRand=[0.4 0.5 0.6 0.7 0.8; 0.6 0.75 0.9 1.05 1.2]; %target time randomization in random condition
// params.Time.cueJitter=[0.4 0.5 0.6 0.7 0.8; 0.6 0.75 0.9 1.05 1.2]; %cue time randomization in random condition
// params.Time.tar=0.15;
// params.Time.ITI=[0.8 1.1 1.4];


"use strict";

let name = "name"; //TODO get name.
let userNum =  Math.floor(Math.random()*999); //TODO get userNum.
const BLOCK_LENGTH = 2;
let output=[];
output.push({'x':'ready', 'y':'OR Not'});


const TrialType = Object.freeze({
    Rhythmic:   Symbol("rhythmic"),
    Interval:  Symbol("interval"),
    Random: Symbol("random")
});


class Trial{
    constructor(reds, white, target, type, long=false, showTarget=true){
        this.reds = reds;
        this.white = white;
        this .target = target;
        this.type = type;
        this.showTarget = showTarget;
        this.showTargetVal = showTarget?0:2;
        this.longVal = long?2:1;
        this.col11 = long?54:36;
        let val = 0;
        if (type===TrialType.Rhythmic) val = 1;
        else if (type===TrialType.Interval) val = 2;
        else val = 3;
        this.trialTypeVal = val;
    }
}

class OutputOrganizer {
    constructor(userNum){
        this.results = [];
        this.trialNum = 0;
        this.blockNum = 0;
        this.userNum = userNum;
    }
    startingBlock(){
        this.blockNum++;
        this.trialNum = 0;
    }
    updateOutput(trial, reactionTime, reactionCode){
        this.trialNum++;
        this.results.push({1:this.userNum, 2:this.blockNum, 3:trial.trialTypeVal, 4:this.trialNum, 5:'5', 6:'6',
            7:trial.longVal, 8:trial.showTargetVal, 9:reactionCode,10: reactionTime, 11:trial.col11});
    }
}





let startTime = new Date().getTime();
let expectedTargetTime = -1;
console.log(startTime);
let squareElement=document.getElementById('square');
let  feedbackElement=document.getElementById('feedback');

const EARLY_SRC = 'pics/tooearly.jpg';
const ONLY_STIMULI_SRC = 'pics/resptarget.jpg';
const NO_RESPONSE_SRC = 'pics/noresp.jpg';
const START_SRC = 'pics/menu.jpg';
const BLOCK_BEGIN_SRC = 'pics/begblock.jpg';
const RHYTHM_TARGET_SRC = 'pics/rhythm_target.jpg';
const RHYTHM_SRC = 'pics/rhythm.jpg';
const RHYTHM_HELP_SRC = 'pics/srhythm.jpg';
// const INTERVAL_SRC = 'pics/interval.jpg';
const INTERVAL_TARGET_SRC = 'pics/interval_target.jpg';
const INTERVAL_HELP_SRC = 'pics/sinterval.jpg';
const RANDOM_TARGET_SRC = 'pics/random_target.jpg';
const RANDOM_HELP_SRC = 'pics/srandom.jpg';
const END_SRC = 'pics/end.jpg';

const MS_BETWEEN_TRIALS = 1000;
const MS_SHOW_TARGET = 3000;
const MS_SHOW_CUE = 100;
const MS_SHOW_FEEDBACK = 3000;
const TARGET_COLOR = '#00ff00';
const TARGET_READY = 1;
const TARGET_EARLY = 2;
const TARGET_UNDEFINED = 3;
const INSTRUCTIONS = 4;
var state = INSTRUCTIONS;
var targetShownTS = 0;
// var ISI = [1300,1400,1500,1600,1700,1950,2100,2250,2400,2550];
var ISI = [600,1300,2000,2700,3400];
// var rhythmTask = [singleRhythmTrial, singleRhythmTrial, singleRhythmTrial, singleRhythmTrial, singleRhythmTrial];
// var rhythm75Task = [rhythm75Trial, rhythm75Trial, rhythm75Trial, rhythm75Trial, rhythm75Trial];
var task75 = [1,1,1,0];
var timers = [];
var currentTaskArray = []
var trialNum = 0;


// ===================  =======  async =====       ===========

let asyncState = -1;
let result = -1;
let resultValid = false;
let rythmTrialsNum = 6;
// res = runRhythmTask2();
// let res = runRhythmTask3();
// let res = runAnyTask([600,1300,2000],2700,3400, 6 );


window.addEventListener("beforeunload", closing, false);


let prom = runExperiment();
async function showInstruction(instructionURL) {

    feedbackElement.src = instructionURL;
    feedbackElement.style.display = 'block';
    await waitForSpaceKey();
    hideNow(feedbackElement);
}

async function runExperiment(){

    await showInstruction(START_SRC);
    let outputObj = new OutputOrganizer(userNum);
    outputObj.startingBlock();

    await showInstruction(INTERVAL_TARGET_SRC);
    await showInstruction(INTERVAL_HELP_SRC);
    await showInstruction(BLOCK_BEGIN_SRC);
    output = await runSingleIntervalBlock(BLOCK_LENGTH, outputObj);
    outputObj.startingBlock();
    await showInstruction(RANDOM_TARGET_SRC);
    await showInstruction(RANDOM_HELP_SRC);
    await showInstruction(BLOCK_BEGIN_SRC);
    output = await runRandomBlock(BLOCK_LENGTH, outputObj);
    outputObj.startingBlock();
    await showInstruction(RHYTHM_TARGET_SRC);
    await showInstruction(RHYTHM_HELP_SRC);
    await showInstruction(BLOCK_BEGIN_SRC);
    output = await runRhythmBlock(BLOCK_LENGTH, 0, outputObj);
    outputObj.startingBlock();
    await showInstruction(RHYTHM_SRC);
    await showInstruction(RHYTHM_HELP_SRC);
    await showInstruction(BLOCK_BEGIN_SRC);
    output = await runRhythmBlock(BLOCK_LENGTH, 4, outputObj);

    console.log("results", outputObj.results);
    exportXL(outputObj.results);
}



async function runSingleIntervalBlock(blockLength, outputObj){

    let trial = null;
    let trialNum = 0;
    while (trialNum<blockLength){
        trial = createSingleIntervalTrial();
        let reaction  = await runTrial(trial.reds, trial.white, trial.target, trial.showTarget);
        if (reaction[0] !== null){
            trialNum++;
            outputObj.updateOutput(trial, reaction[0], reaction[1]);
        }
    }
    return outputObj;
}


/**
 * creates a single trial object of type Interval.
 * @returns {Trial} trial object.
 */
function createSingleIntervalTrial(){
    let intervals = [];
    let randomIndex = Math.floor(Math.random()*2);
    let cue = [600, 900][randomIndex];
    let ISIS = [1.3, 1.4, 1.5, 1.6, 1.7, 1.95, 2.1, 2.25, 2.4, 2.55]; //inter-pair interval in interval condition
    let initial = 500;
    intervals.push(initial); // first red box.
    intervals.push(initial+cue); // second red box.
    randomIndex = Math.floor(Math.random()*ISIS.length);
    let randomOffset = ISIS[randomIndex]*1000;
    intervals.push(initial+cue+randomOffset);
    intervals.push(initial+cue+randomOffset+cue);

    return new Trial(intervals.slice(0,2),intervals[2], intervals[3],TrialType.Interval);
}


async function runRandomBlock(blockLength, outputObj){

    let trial = null;
    let trialNum = 0;
    while (trialNum<blockLength){
        trial = createRandomTrial();
        let reaction  = await runTrial(trial.reds, trial.white, trial.target, trial.showTarget);
        if (reaction[0] !== null){
            trialNum++;
            outputObj.updateOutput(trial, reaction[0], reaction[1]);
        }
    }
    return outputObj;
}


/**
 * creates a single trial object of type Random.

 * @returns {Trial} trial object.
 */
function createRandomTrial(){
    let intervals = [];
    let ISIVals = [0.4, 0.5, 0.6, 0.7, 0.8, 0.6, 0.75, 0.9, 1.05, 1.2];
    let offset = 0;
    // let ISIVals = [400, 500, 600, 700, 800, 600, 750, 900, 1050, 1200];
    for (let i=0; i < 5; i++){
        let randomIndex = Math.floor(Math.random()*ISIVals.length);
        offset += ISIVals[randomIndex]*1000;
        intervals.push(offset);
        // intervals.push(ISIVals[randomIndex]);
    }

    return new Trial(intervals.slice(0,3),intervals[3], intervals[4],TrialType.Random);
}


/**
 * retun array of length 'size' full of zeros. with '2' once every 'factor'. shuffled randomly.
 * so for an array of length 20, with a quarter '2', do: getRandomRatioArray(20, 4);
 * @param size length of array
 * @param factor ratio: (1/factor)
 * @returns {Array} shuffled array
 */
function getRandomRatioArray(size , factor){
    if (factor<1)return Array(size).fill(0);

    let bucket = [];
    let result = [];
    for (let i=0;i<size;i++) {
        if (i%factor===0) bucket.push(2);
        else bucket.push(0);
    }

    for (let i=0;i<size;i++) {
        let randomIndex = Math.floor(Math.random()*bucket.length);
        result.push(bucket.splice(randomIndex, 1)[0]);
    }
    return result;
}


async function runRhythmBlock(blockLength, dontShowTargetFactor, outputObj){

    let showTarget = getRandomRatioArray(blockLength, dontShowTargetFactor);
    let trial = null;
    let trialNum = 0;
    // let results = [];

    while (trialNum<blockLength){
        trial = createRhythmTrial(trialNum%2===0, showTarget[trialNum]===0); //TODO: when long, when short?? is long 900+100...
        let reaction  = await runTrial(trial.reds, trial.white, trial.target, trial.showTarget);
        if (reaction[0] !== null){
            trialNum++;
            outputObj.updateOutput(trial, reaction[0], reaction[1]);
            // results.push({1:userNum, 2:blockNum, 3:trial.trialTypeVal, 4:trialNum, 5:'5', 6:'6', 7:trial.longVal, 8:trial.showTargetVal, 9:reaction[1],10: reaction[0], 11:36});
        }
    }
    // console.log("results", outputObj.);
    // exportXL(results);
    // return results;
    return outputObj;
}


/**
 * creates a single trial object of type Rhythmic.
 * @param long true for long intervals (9000)
 * @param showTarget true to show target
 * @returns {Trial} trial object.
 */
function createRhythmTrial(long, showTarget){
    if (long) return new Trial([900,1900,2900],3900,4900,TrialType.Rhythmic, long, showTarget);
    else return new Trial([600,1300,2000],2700,3400,TrialType.Rhythmic, long, showTarget);
}


// ===========   =====     =========   ======   ==========   =======



async function runRhythmTask2() {
    trialNum = 0;
    // currentTaskArray = rhythmTask;
    let results = [];
    let response = -1;
    while (trialNum<rythmTrialsNum){
        setupRhythm();
        let temp = await singleRhythmTrial2();
        if (temp !== null){
            // results.push(temp);
            trialNum++;
            if (temp<0){response = -1;}
            else if(temp===MS_SHOW_TARGET){response=0;}
            else {response=1;}
            results.push({1:1123, 2:1, 3:1, 4:trialNum,5:'5', 6:'6', 7:1, 8:0, 9:response,10: temp, 11:36});
        }
    }
    console.log("results", results);
    exportXL(results)
    return results;
}


async function runTrial(reds, white, target, showTarget){
    let response = -1;
    await waitMS(MS_BETWEEN_TRIALS);
    setupTrial(reds, white, target, showTarget);
    let reaction = await timeReaction(target, MS_SHOW_TARGET);
    hideNow(squareElement);
    console.log("relative reaction: ", reaction);
    if (reaction !== null){
        if (reaction<0){ response = -1; await feedbackEarly();} // early.
        else if(reaction===MS_SHOW_TARGET){response=0; if (showTarget)await feedbackLate();} // late(didn't press)
        else { response=1;  if (!showTarget){ await feedbackNoTarget();}  // pressed even though no target:
        }
    }
    return [reaction, response];
}

async function runAnyTask(reds, white, target, numTrials) {
    trialNum = 0;
    let results = [];
    let response = -1;
    while (trialNum<numTrials){
        let reaction  = await runTrial(reds, white, target, showTarget);
        if (reaction[0] !== null){
            trialNum++;
            response = reaction[1];
            results.push({1:1123, 2:1, 3:1, 4:trialNum,5:'5', 6:'6', 7:1, 8:0, 9:response,10: reaction[0], 11:36});
        }
    }
    console.log("results", results);
    // exportXL(results);
    return results;
}


async function runRhythmTask3() {
    trialNum = 0;

    let results = [];
    let response = -1;
    while (trialNum<rythmTrialsNum){
        await waitMS(MS_BETWEEN_TRIALS);
        // setupRhythm();
        setupTrial(ISI.slice(0,3), ISI[3], ISI[4] );
        let temp = await timeReaction(ISI[4], MS_SHOW_TARGET);
        hideNow(squareElement);
        console.log("relative reaction: ", temp);
        if (temp !== null){
            trialNum++;
            if (temp<0){ response = -1; await feedbackEarly();} // early.
            else if(temp===MS_SHOW_TARGET){response=0; await feedbackLate();} // late(didn't press)
            else {response=1;}
            results.push({1:1123, 2:1, 3:1, 4:trialNum,5:'5', 6:'6', 7:1, 8:0, 9:response,10: temp, 11:36});
        }
    }
    console.log("results", results);
    // exportXL(results);
    return results;
}


function setupTrial(reds, white, target, showTargetSquare=true) {
    hideNow(squareElement);
    console.log("starting trial..");
    let color = '#ff0000'; //RED
    reds.forEach(timing => timers.push(setTimeout(showStimuli, timing, squareElement, MS_SHOW_CUE, color)));
    color = '#ffffff'; //white
    timers.push(setTimeout(showStimuli, white, squareElement, MS_SHOW_CUE, color));
    timers.push(setTimeout(showTarget, target, showTargetSquare));
    expectedTargetTime = getElapsedMS() + target;
}


function setupRhythm() {
    targetShownTS = getElapsedMS(); // temporarily, for timing waiting.
    hideNow(squareElement);
    state = TARGET_EARLY; // pressing now should get feedback ' Minus!!'
    resultValid = false;
    // asyncState = 1;
    console.log("starting trial..");
    let color = '#ff0000'; //RED
    timers.push(setTimeout(showStimuli, ISI[0], squareElement, MS_SHOW_CUE, color));
    timers.push(setTimeout(showStimuli, ISI[1], squareElement, MS_SHOW_CUE, color));
    timers.push(setTimeout(showStimuli, ISI[2], squareElement, MS_SHOW_CUE, color));
    color = '#ffffff'; //white
    timers.push(setTimeout(showStimuli, ISI[3], squareElement, MS_SHOW_CUE, color));
    timers.push(setTimeout(showTarget, ISI[4]));
    expectedTargetTime = getElapsedMS() + ISI[4];

    // timers.push(setTimeout(feedbackLate , ISI[4]+MS_SHOW_TARGET));

}


function waitForSpaceHelper(resolve){

    window.addEventListener('keydown', ev => {
        if (ev.code === 'Space') {
            console.log('Space pressed, instructions')
            resolve(1);
        }
        else{
            console.log('Different Key pressed, instructions')

            waitForSpaceHelper(resolve);}
    } , {once:true}); // remove after press
}
function waitForSpaceKey(){
    return new Promise(resolve => {
        waitForSpaceHelper(resolve);
    });
}

/**
 * Waits for key press , or till stimuli should finish being shown.
 * Returns timing of keyPress, relative to stimuli event (can be a negative number.)
 *  (Can also be used to show instruction till key pressed, or for 'MSTillStimuli + MSShowStimuli' time.
 *  doesn't show things, only waits and records time.)
 * @param MSTillStimuli MS till stimuli will be shown
 * @param MSShowStimuli - MS to wait for user to react to stimuli.
 * @returns {Promise<int>} time relative to stimuli onset.
 */
function timeReaction(MSTillStimuli, MSShowStimuli) {
    return new Promise(resolve => {

        setTimeout(() => {resolve(MSShowStimuli);}, MSTillStimuli+MSShowStimuli); // if no press, return.

        window.addEventListener('keydown', ev => {
            if (ev.code === 'Space') {
                console.log('Space pressed')
            }
            resetState(); // don't show late msg..
            resolve(getMSRelativeToTarget());
        } , {once:true}); // remove after press
    });
}
function handleKeydown(resolve){

}

function singleRhythmTrial2(){
    return new Promise(resolve => {setTimeout(()=> {
        if (!resultValid) {resolve(null);} // Do not count as trial
        if (result<0)  // early:
        {setTimeout(()=>{resolve(result);}, MS_SHOW_FEEDBACK - ( getElapsedMS()-result))} // wait for "late" feedback
        else{ resolve(result);}
    }, ISI[4]+MS_SHOW_TARGET+5)}); // show target


     }


// ===================  =======  async  end  ================



//
// hideNow(squareElement);
// // setTimeout(showMS, 3000, squareElement, 100);
// // singleRhythmTrial();
// runRhythmTask();
// runRhythm75Task();
//
// function runRhythmTask() {
//     trialNum = 0;
//     currentTaskArray = rhythmTask;
//     doNextTrial();
// }
//
// function runRhythm75Task() {
//     trialNum = 0;
//     currentTaskArray = rhythm75Task;
//     task75 = shuffleArray(task75);
//     doNextTrial();
// }
//
// function rhythm75Trial(){
//     clearTimers();
//     hideNow(squareElement);
//     state = TARGET_EARLY; // pressing now should get feedback 'wrong!!'
//     var color = '#ff0000';
//     for (var i = 0; i < ISI.length; i++) {
//         if (i===2){color = '#ffffff'}
//         if (i===3){timers.push(setTimeout(showTarget, ISI[i]));}
//         else { timers.push(setTimeout(showStimuli, ISI[i], squareElement, MS_SHOW_CUE, color));}
//     }
// }
//
//
//
// function singleRhythmTrial(){
//     clearTimers();
//     hideNow(squareElement);
//     state = TARGET_EARLY; // pressing now should get feedback 'wrong!!'
//     var color = '#ff0000';
//     for (var i = 0; i < ISI.length; i++) {
//         if (i===2){color = '#ffffff'}
//         if (i===3){timers.push(setTimeout(showTarget, ISI[i]));}
//         else { timers.push(setTimeout(showStimuli, ISI[i], squareElement, MS_SHOW_CUE, color));}
//     }
// }



function resetState(){
    state = INSTRUCTIONS;
    clearTimers();
}
//
// // runs the flow of task:
// function doNextTrial(runPrevious){
//     resetState();
//     if (runPrevious===true){trialNum--;}
//     if(trialNum >= currentTaskArray.size){
//         console.log("finished task!", trialNum);
//         return -1;
//     }
//     // if  ((typeof runPrevious === undefined ) && runPrevious===false){trialNum--;}
//     state = TARGET_UNDEFINED;
//     console.log("running trial", trialNum);
//     timers.push(setTimeout(currentTaskArray[trialNum], MS_BETWEEN_TRIALS));
//     trialNum++;
// }

function feedbackEarly(){
    resetState();
    feedbackElement.src = EARLY_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    return waitMS(MS_SHOW_FEEDBACK);
    // setTimeout(doNextTrial, MS_SHOW_FEEDBACK, true);
}
function feedbackNoTarget(){
    resetState();
    feedbackElement.src = ONLY_STIMULI_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    return waitMS(MS_SHOW_FEEDBACK);
    // setTimeout(doNextTrial, MS_SHOW_FEEDBACK);
}


function feedbackLate(){
    resetState();
    resultValid = true;
    // targetShownTS = getElapsedMS(); // temporarily, for timing waiting.
    result = MS_SHOW_TARGET;
    feedbackElement.src = NO_RESPONSE_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    return waitMS(MS_SHOW_FEEDBACK);
    // setTimeout(doNextTrial, MS_SHOW_FEEDBACK);
}

function clearTimers(){
    timers.forEach(function(timer){clearTimeout(timer);});
    timers = [];
}


//  shows stimuli if trial not aborted:
function showStimuli(object, MS, color){
    showMS(object, MS, color);
}

function showTarget(show=true){
    targetShownTS = getElapsedMS();
    console.log("expected minus actual", expectedTargetTime, targetShownTS, expectedTargetTime-targetShownTS);
    expectedTargetTime = getElapsedMS();
    if (show) showMS(squareElement, MS_SHOW_TARGET, TARGET_COLOR);
}


function getElapsedMS(){return new Date().getTime() - startTime;}
function getMSRelativeToTarget(){return getElapsedMS() - expectedTargetTime;}


function hideNow(object){ object.style.display = 'none';}

// show object for MS milliseconds. optional: change color.
function showMS(object, MS, color){
    //
    if (typeof color !== 'undefined'){object.style.background = color;}
    object.style.display = 'block';
    // targetShownTS = getElapsedMS();
    setTimeout(hideNow, MS, object);
}

function shuffleArray(array) {
    var result = array.slice(0);
    for (var i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}


// squareElement=document.getElementById('square');
// squareElement.setAttribute('background', color);
// squareElement.style.background = '#ff0000';

// document.onkeydown = function (ev) {
//     if(ev.keyCode === 32 || ev.key===' ' ){
//         // console.log("space bar pressed", getElapsedMS());
//         let cresult = getElapsedMS() - targetShownTS;
//         switch(state) {
//             case TARGET_READY:  // saw target
//                 resetState();
//                 result = cresult; //record result
//                 resultValid = true;
//                 console.log("see you!!", result);
//                 hideNow(squareElement);
//                 // doNextTrial();
//                 break;
//             case TARGET_EARLY:
//                 console.log("WRONG  minus score?!!", cresult);
//                 resultValid = true;
//                 targetShownTS = getElapsedMS(); // temporarily, for timing waiting.
//                 result = getMSRelativeToTarget();
//                 console.log("Early: ", result);
//                 feedbackNoTarget();
//                 break;
//             case TARGET_UNDEFINED:
//                 console.log("Too early!!", cresult);
//                 feedbackEarly();
//                 break;
//             case INSTRUCTIONS:
//                 console.log(" next instructions!!", cresult);
//                 break;
//         }
//
//     }
// };


/**
 * like sleep(). pauses calling function for 'MS' MS..
 * @param MS
 * @returns {Promise<any>}
 */
function waitMS(MS) {
    return new Promise(resolve => {
        setTimeout(() => {resolve('resolved');
        }, MS);
    });
}


function resolveAfter2Seconds() {
    return new Promise(resolve => {
        setTimeout(() => {resolve('resolved');
    }, 2000);
});
}

async function asyncCall() {
    console.log('calling');
    const result = await resolveAfter2Seconds();
    console.log(result);
    // expected output: 'resolved'
}

/**
 * To save current data, in case of window close
 * @param ev
 */
function closing(ev) {
    //TODO save data to excel:
    // alert('REally???!!');
    console.log("closing..");
    // exportXL(output);


}
