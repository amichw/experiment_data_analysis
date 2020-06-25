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


// TODO : training loop. what to do when train rhythmic75 ?

"use strict";

const BLOCK_LENGTH = 32;

let output = [];

let startTime = new Date().getTime();
let expectedTargetTime = -1;
let squareElement = document.getElementById('square');
let feedbackElement = document.getElementById('feedback');

const EARLY_SRC = 'res/tooearly.jpg';
const ONLY_STIMULI_SRC = 'res/resptarget.jpg';
const NO_RESPONSE_SRC = 'res/noresp.jpg';
const PRACTICE_SRC = 'res/menu.jpg';
const BLOCK_BEGIN_SRC = 'res/begblock.jpg';
const RHYTHM_TARGET_SRC = 'res/rhythm_target.jpg';
const RHYTHM_SRC = 'res/rhythm.jpg';
const RHYTHM_HELP_SRC = 'res/srhythm.jpg';
const INTERVAL_TARGET_SRC = 'res/interval_target.jpg';
const INTERVAL_HELP_SRC = 'res/sinterval.jpg';
const RANDOM_TARGET_SRC = 'res/random_target.jpg';
const RANDOM_HELP_SRC = 'res/srandom.jpg';
const END_SRC = 'res/end.jpg';
const OTHER_KEY_SRC = 'res/other_key.jpg';
const HALF_SRC = 'res/half.jpg';

const MS_BETWEEN_TRIALS = 1000;
const MS_SHOW_TARGET = 3000;
const MS_SHOW_CUE = 100;
const MS_SHOW_FEEDBACK = 3000;
const TARGET_COLOR = '#00ff00';
const LONG_TRAINING = 6;
const SHORT_TRAINING = 2;
const KEY_KUF = 'KeyE';
const KEY_MEM = 'KeyN';
let targetShownTS = 0;
let timers = [];

window.addEventListener("resize", resizeInstructions, false);


// window.addEventListener("beforeunload", closing, false);




const TrialType = Object.freeze({
    Rhythmic: Symbol("rhythmic"),
    Interval: Symbol("interval"),
    Random: Symbol("random")
});


class Trial {
    constructor(reds, white, target, type, long = false, showTarget = true) {
        this.reds = reds;
        this.white = white;
        this.target = target;
        this.type = type;
        this.showTarget = showTarget;
        this.showTargetVal = showTarget ? 0 : 2;
        this.longVal = long ? 2 : 1;
        // this.col11 = long ? 54 : 36;
        this.col11 = Math.round((target-white)*6/100);
        let val = 0;
        if (type === TrialType.Rhythmic) val = 1;
        else if (type === TrialType.Interval) val = 2;
        else val = 3;
        this.trialTypeVal = val;
    }
}

class OutputOrganizer {
    constructor(userNum) {
        this.results = [];
        this.trialNum = 0;
        this.blockNum = 0;
        this.userNum = userNum;
    }

    startingBlock() {
        this.blockNum++;
        this.trialNum = 0;
    }

    updateOutput(trial, reactionTime, reactionCode) {
        this.trialNum++;
        this.results.push({
            "1 - user code": this.userNum, '2 - block num': this.blockNum, '3 - trial type': trial.trialTypeVal,
            '4 - trial num': this.trialNum, 5: '5', 6: '6', '7 - long(2)': trial.longVal,
            '8 - target shown (0)': trial.showTargetVal, '9 - reaction type': reactionCode,
            '10 - reaction time': reactionTime, '11 - Pre target interval code': trial.col11
        });
    }
}



async function showTrainingMenu() {
    feedbackElement.src = PRACTICE_SRC;
    feedbackElement.style.display = 'block';
    let k = await waitForSpaceKey(true);
    hideNow(feedbackElement);
    return k;
}


async function showInstruction(instructionURL) {

    feedbackElement.src = instructionURL;
    feedbackElement.style.display = 'block';
    await waitForSpaceKey();
    hideNow(feedbackElement);
}


async function runExperiment(twice) {

    hideNow(squareElement);
    hideNow(feedbackElement);
    resizeInstructions();
    await showInstruction(BLOCK_BEGIN_SRC);

    let userNum = "";
    while (userNum===null || userNum===""){ userNum = prompt("Please enter user code", ""); }

    let outputObj = new OutputOrganizer(userNum);
    let one = [runSingleIntervalBlock, runRandomBlock, runRhythmBlock75];
    let two = [runSingleIntervalBlock, runRandomBlock, runRhythmBlock75];
    one = shuffleArray(one);
    two = shuffleArray(two);

    for(let i=0; i< one.length; i++){
        outputObj.startingBlock();
        await one[i](BLOCK_LENGTH, outputObj);
    }

    for(let i=0; i< one.length; i++){
        outputObj.startingBlock();
        await two[i](BLOCK_LENGTH, outputObj);
    }


    // twice = confirm("Start second part when ready\n (press cancel to save and end now.)");
    await showInstruction(HALF_SRC);
    // 100% target appearance:
    if (twice){

        one = [runSingleIntervalBlock, runRandomBlock, runRhythmBlock100];
        two = [runSingleIntervalBlock, runRandomBlock, runRhythmBlock100];
        one = shuffleArray(one);
        two = shuffleArray(two);

        for(let i=0; i< one.length; i++){
            outputObj.startingBlock();
            await one[i](BLOCK_LENGTH, outputObj);
        }

        for(let i=0; i< one.length; i++){
            outputObj.startingBlock();
            await two[i](BLOCK_LENGTH, outputObj);
        }
    }

    await showInstruction(END_SRC);


    console.log("results", outputObj.results);
    exportXL(outputObj.results, outputObj.userNum);
    return true;
}



async function runTrainingBlock(type) {

    let k = await showTrainingMenu();
    while (k === KEY_MEM || k === KEY_KUF) {
        if (type===TrialType.Random) await showInstruction(RANDOM_HELP_SRC);
        else if (type===TrialType.Interval) await showInstruction(INTERVAL_HELP_SRC);
        else if (type===TrialType.Rhythmic) await showInstruction(RHYTHM_HELP_SRC);
        let trial = null;
        let trialNum = 0;
        let length = k === KEY_MEM ? LONG_TRAINING : SHORT_TRAINING;
        let longOrShort = getRandomRatioArray(length, 2);
        while (trialNum < length) {
            await waitForSpaceKey();
            if (type===TrialType.Random) trial = createRandomTrial(longOrShort[trialNum]);
            else if (type === TrialType.Interval) trial = createSingleIntervalTrial(longOrShort[trialNum]);
            else if (type === TrialType.Rhythmic) trial = createRhythmTrial(longOrShort[trialNum], true);
            let reaction = await runTrial(trial.reds, trial.white, trial.target, trial.showTarget);
            if (reaction[0] !== null) {
                trialNum++;
            }
        }
        await waitForSpaceKey();
        k = await showTrainingMenu();
    }
}


async function runSingleIntervalBlock(blockLength, outputObj) {
    await showInstruction(BLOCK_BEGIN_SRC);
    await showInstruction(INTERVAL_TARGET_SRC);
    // await showInstruction(PRACTICE_SRC);
    await runTrainingBlock(TrialType.Interval);
    await showInstruction(INTERVAL_HELP_SRC);
    let trial = null;
    let trialNum = 0;
    let longOrShort = getRandomRatioArray(blockLength, 2);
    while (trialNum < blockLength) {
        trial = createSingleIntervalTrial(longOrShort[trialNum] === 0);
        let reaction = await runTrial(trial.reds, trial.white, trial.target, trial.showTarget);
        if (reaction[0] !== null) {
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
function createSingleIntervalTrial(long) {
    let intervals = [];
    let cue = [600, 900][long?1:0];
    let ISIShort = [1.3, 1.4, 1.5, 1.6, 1.7];
    let ISILong = [1.95, 2.1, 2.25, 2.4, 2.55]; //inter-pair interval in interval condition
    let initial = 500;
    intervals.push(initial); // first red box.
    intervals.push(initial + cue); // second red box.
    let randomIndex = Math.floor(Math.random() * ISIShort.length);
    let randomOffset = ISIShort[randomIndex] * 1000;
    if (long) randomOffset = ISILong[randomIndex] * 1000;
    intervals.push(initial + cue + randomOffset);
    intervals.push(initial + cue + randomOffset + cue);

    return new Trial(intervals.slice(0, 2), intervals[2], intervals[3], TrialType.Interval, long);
}


async function runRandomBlock(blockLength, outputObj) {
    await showInstruction(BLOCK_BEGIN_SRC);
    await showInstruction(RANDOM_TARGET_SRC);
    await runTrainingBlock(TrialType.Random);
    await showInstruction(RANDOM_HELP_SRC);
    let trial = null;
    let trialNum = 0;
    let longOrShort = getRandomRatioArray(blockLength, 2);
    while (trialNum < blockLength) {
        trial = createRandomTrial(longOrShort[trialNum]);
        let reaction = await runTrial(trial.reds, trial.white, trial.target, trial.showTarget);
        if (reaction[0] !== null) {
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
function createRandomTrial(long) {
    let intervals = [];
    let ISIShort = [0.4, 0.5, 0.6, 0.7, 0.8];
    let ISILong = [0.6, 0.75, 0.9, 1.05, 1.2];
    let ISIs = long? ISILong:ISIShort;

    let offset = 0;
    for (let i = 0; i < 5; i++) {
        let randomIndex = Math.floor(Math.random() * ISIs.length);
        offset += ISIs[randomIndex] * 1000;
        intervals.push(offset);
    }

    return new Trial(intervals.slice(0, 3), intervals[3], intervals[4], TrialType.Random, long);
}


/**
 * retun array of length 'size' full of zeros. with '2' once every 'factor'. shuffled randomly.
 * so for an array of length 20, with a quarter '2', do: getRandomRatioArray(20, 4);
 * @param size length of array
 * @param factor ratio: (1/factor)
 * @returns {Array} shuffled array
 */
function getRandomRatioArray(size, factor) {
    if (factor < 1) return Array(size).fill(0);

    let bucket = [];
    let result = [];
    for (let i = 0; i < size; i++) {
        if (i % factor === 0) bucket.push(2);
        else bucket.push(0);
    }

    for (let i = 0; i < size; i++) {
        let randomIndex = Math.floor(Math.random() * bucket.length);
        result.push(bucket.splice(randomIndex, 1)[0]);
    }
    return result;
}


async function runRhythmBlock75(blockLength, outputObj) {
    await runRhythmBlock(blockLength, 4, outputObj)
}


async function runRhythmBlock100(blockLength, outputObj) {
    await runRhythmBlock(blockLength, 0, outputObj)
}


async function runRhythmBlock(blockLength, dontShowTargetFactor=0, outputObj) {

    await showInstruction(BLOCK_BEGIN_SRC);

    if (dontShowTargetFactor===0) await showInstruction(RHYTHM_TARGET_SRC);
    else await showInstruction(RHYTHM_SRC);
    // await showInstruction(PRACTICE_SRC);
    await runTrainingBlock(TrialType.Rhythmic);
    await showInstruction(RHYTHM_HELP_SRC);

    let showTarget = getRandomRatioArray(blockLength, dontShowTargetFactor);
    let longOrShort = getRandomRatioArray(blockLength, 2);
    let trial = null;
    let trialNum = 0;

    while (trialNum < blockLength) {
        trial = createRhythmTrial(longOrShort[trialNum] === 0, showTarget[trialNum] === 0);
        let reaction = await runTrial(trial.reds, trial.white, trial.target, trial.showTarget);
        if (reaction[0] !== null) {
            trialNum++;
            outputObj.updateOutput(trial, reaction[0], reaction[1]);
        }
    }
}


/**
 * creates a single trial object of type Rhythmic.
 * @param long true for long intervals (9000)
 * @param showTarget true to show target
 * @returns {Trial} trial object.
 */
function createRhythmTrial(long, showTarget) {
    if (long) return new Trial([900, 1800, 2700], 3600, 4500, TrialType.Rhythmic, long, showTarget);
    else return new Trial([600, 1200, 1800], 2400, 3000, TrialType.Rhythmic, long, showTarget);
}


// ===========   =====     =========   ======   ==========   =======


async function runTrial(reds, white, target, showTarget) {
    let response = -1;
    await waitMS(MS_BETWEEN_TRIALS);
    setupTrial(reds, white, target, showTarget);
    let reactionTime = await timeReaction(target, MS_SHOW_TARGET);
    hideNow(squareElement);
    console.log("relative reaction: ", reactionTime);
    if (reactionTime !== null) {
        if (reactionTime < 0) {
            response = -1;
            await feedbackEarly();
        } // early.
        else if (reactionTime === MS_SHOW_TARGET) {
            response = 0;
            if (showTarget) await feedbackLate();
        } // late(didn't press)
        else {
            response = 1;
            if (!showTarget) {
                await feedbackNoTarget();
            }  // pressed even though no target:
        }
    }
    else{ // pressed other key then space:
        await feedbackWrongKey();
        return [getMSRelativeToTarget(), 0]

    }
    return [reactionTime, response];
}


function setupTrial(reds, white, target, showTargetSquare = true) {
    hideNow(squareElement);
    console.log("starting trial..");
    let color = '#ff0000'; //RED
    reds.forEach(timing => timers.push(setTimeout(showStimuli, timing, squareElement, MS_SHOW_CUE, color)));
    color = '#ffffff'; //white
    timers.push(setTimeout(showStimuli, white, squareElement, MS_SHOW_CUE, color));
    timers.push(setTimeout(showTarget, target, showTargetSquare));
    expectedTargetTime = getElapsedMS() + target;
}


function waitForSpaceHelper(resolve, train) {

    window.addEventListener('keydown', ev => {
        if (ev.code === 'Space') {
            console.log('Space pressed, instructions');
            resolve(getElapsedMS());
        }
        else if (train && ev.code === 'KeyE'){resolve(KEY_KUF);}
        else if (train && ev.code === 'KeyN'){resolve(KEY_MEM);}
        else {
            console.log('Different Key pressed, instructions');
            waitForSpaceHelper(resolve, train);
        }
    }, {once: true}); // remove after press
}

function waitForSpaceKey(train=false) {
    return new Promise(resolve => {
        waitForSpaceHelper(resolve, train);
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

        setTimeout(() => {
            resolve(MSShowStimuli);
        }, MSTillStimuli + MSShowStimuli); // if no press, return.

        window.addEventListener('keydown', ev => {
            resetState(); // don't show late msg..

            if (ev.code === 'Space') {
                console.log('Space pressed');
                resolve(getMSRelativeToTarget());
            }
            else{ // other key: return false
                resolve(null);
            }
        }, {once: true}); // remove after press
    });
}


function resetState() {
    clearTimers();
}


function feedbackEarly() {
    resetState();
    feedbackElement.src = EARLY_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    return waitMS(MS_SHOW_FEEDBACK);
}


function feedbackNoTarget() {
    resetState();
    feedbackElement.src = ONLY_STIMULI_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    return waitMS(MS_SHOW_FEEDBACK);
}


function feedbackLate() {
    resetState();
    feedbackElement.src = NO_RESPONSE_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    return waitMS(MS_SHOW_FEEDBACK);
}


function feedbackWrongKey() {
    resetState();
    feedbackElement.src = OTHER_KEY_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    return waitMS(MS_SHOW_FEEDBACK);
}


function clearTimers() {
    timers.forEach(function (timer) {
        clearTimeout(timer);
    });
    timers = [];
}


//  shows stimuli if trial not aborted:
function showStimuli(object, MS, color) {
    showMS(object, MS, color);
}

function showTarget(show = true) {
    targetShownTS = getElapsedMS();
    console.log("expected minus actual", expectedTargetTime, targetShownTS, expectedTargetTime - targetShownTS);
    expectedTargetTime = getElapsedMS();
    if (show) showMS(squareElement, MS_SHOW_TARGET, TARGET_COLOR);
}


function getElapsedMS() {
    return new Date().getTime() - startTime;
}

function getMSRelativeToTarget() {
    return getElapsedMS() - expectedTargetTime;
}


function hideNow(object) {
    object.style.display = 'none';
}

// show object for MS milliseconds. optional: change color.
function showMS(object, MS, color) {
    //
    if (typeof color !== 'undefined') {
        object.style.background = color;
    }
    object.style.display = 'block';
    // targetShownTS = getElapsedMS();
    setTimeout(hideNow, MS, object);
}


/**
 * like sleep(). pauses calling function for 'MS' MS..
 * @param MS
 * @returns
 */
function waitMS(MS) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve('resolved');
        }, MS);
    });
}


/**
 * To save current data, in case of window close
 * @param ev
 */
function closing(ev) {
    console.log("closing..");
    // if (outputObj !== null && output.length > 0 && !finished) exportXL(output);


}


function resizeInstructions() {
    let img = feedbackElement;
    //
    let wid = Math.floor(window.innerWidth);
    img.style.width = wid + 'px';
    // if (img.clientHeight > window.innerHeight) {
    img.style.height = window.innerHeight + 'px';
    // }
}


function shuffleArray(array) {
    let result = array.slice(0);
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}


// actual run:
finished = runExperiment(true);
