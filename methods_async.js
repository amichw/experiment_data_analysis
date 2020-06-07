
// TODO: CHANGE TO ASYNC/Await !!  :)

//TODO: rhythm : 75% target, 25% no target
//TODO: random : same but instead of 600MS between stimuli - random
//TODO: pairs : red-red, then white-green. intrapair-random 600/900 MS. interpair: random


//
// params.Time.cue=[0.6; 0.9]; % target intervals
// params.Time.ISI=[1.3 1.4 1.5 1.6 1.7; 1.95 2.1 2.25 2.4 2.55]; %inter-pair interval in interval condition
// params.Time.tarIntervalRand=[0.4 0.5 0.6 0.7 0.8; 0.6 0.75 0.9 1.05 1.2]; %target time randomization in random condition
// params.Time.cueJitter=[0.4 0.5 0.6 0.7 0.8; 0.6 0.75 0.9 1.05 1.2]; %cue time randomization in random condition
// params.Time.tar=0.15;
// params.Time.ITI=[0.8 1.1 1.4];

//TODO: space b4 green  - MArk as wrong (score? - minus something??)
//TODO: space b4  white -  feedback  - early : rerun experiment.
//TODO: space after green - score.
var startTime = new Date().getTime();
let expectedTargetTime = -1;

console.log(startTime);
let squareElement=document.getElementById('square');
let  feedbackElement=document.getElementById('feedback');

const EARLY_SRC = 'Additional%20Instructions/tooearly.jpg';
const ONLY_STIMULI_SRC = 'Additional%20Instructions/resptarget.jpg';
const NO_RESPONSE_SRC = 'Additional%20Instructions/noresp.jpg';
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
res = runRhythmTask2();

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

    timers.push(setTimeout(feedbackLate , ISI[4]+MS_SHOW_TARGET));

}

function readKey() {
    return new Promise(resolve => {
        window.addEventListener('keydown', ev => {
            if (ev.code === 'Space') {
                console.log('Space pressed')
            }
            // if not add event again..
            resolve(5);
            } , {once:true}); // remove after press
    });
}
function handleKeydown(resolve){

}

document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
        console.log('Space pressed')
    }
})

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

function feedbackNoTrial(){
    resetState();
    feedbackElement.src = EARLY_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    // setTimeout(doNextTrial, MS_SHOW_FEEDBACK, true);
}
function feedbackNoTarget(){
    resetState();
    feedbackElement.src = ONLY_STIMULI_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    // setTimeout(doNextTrial, MS_SHOW_FEEDBACK);
}
function feedbackLate(){
    resetState();
    resultValid = true;
    targetShownTS = getElapsedMS(); // temporarily, for timing waiting.
    result = MS_SHOW_TARGET;
    feedbackElement.src = NO_RESPONSE_SRC;
    showMS(feedbackElement, MS_SHOW_FEEDBACK);
    // setTimeout(doNextTrial, MS_SHOW_FEEDBACK);
}

function clearTimers(){
    timers.forEach(function(timer){clearTimeout(timer);});
    timers = [];
}


//  shows stimuli if trial not aborted:
function showStimuli(object, MS, color){
    // if (state!== TARGET_READY){return;} // user pressed space.
    showMS(object, MS, color);

}

function showTarget(){
    if (state!==TARGET_EARLY){return;} // user pressed space.
    state=TARGET_READY;
    targetShownTS = getElapsedMS();
    // squareElement.style.background = TARGET_COLOR;
    // squareElement.style.display = 'block';
    showMS(squareElement, MS_SHOW_TARGET, TARGET_COLOR);
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

document.onkeydown = function (ev) {
    if(ev.keyCode === 32 || ev.key===' ' ){
        // console.log("space bar pressed", getElapsedMS());
        let cresult = getElapsedMS() - targetShownTS;
        switch(state) {
            case TARGET_READY:  // saw target
                resetState();
                result = cresult; //record result
                resultValid = true;
                console.log("see you!!", result);
                hideNow(squareElement);
                // doNextTrial();
                break;
            case TARGET_EARLY:
                console.log("WRONG  minus score?!!", cresult);
                resultValid = true;
                targetShownTS = getElapsedMS(); // temporarily, for timing waiting.
                result = getMSRelativeToTarget();
                console.log("Early: ", result);
                feedbackNoTarget();
                break;
            case TARGET_UNDEFINED:
                console.log("Too early!!", cresult);
                feedbackNoTrial();
                break;
            case INSTRUCTIONS:
                console.log(" next instructions!!", cresult);
                break;
        }

    }
};


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