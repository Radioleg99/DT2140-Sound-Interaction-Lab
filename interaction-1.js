//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "engine";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
engine.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        engineParamRanges.volume = getMinMaxParam("/engine/volume");
        engineParamRanges.maxSpeed = getMinMaxParam("/engine/maxSpeed");
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

const MODE_COUNT = 6;
const MODE_VOLUME_FRACTIONS = [0.1, 0.25, 0.4, 0.55, 0.7, 0.9];
const MODE_SPEED_FRACTIONS = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
const engineParamRanges = {
    volume: [0, 1],
    maxSpeed: [0, 1]
};
let engineGateOpen = false;
let currentEngineMode = -1;

function accelerationChange(accx, accy, accz) {
    updateEngineFromPosition(accx);
}

function rotationChange(rotx, roty, rotz) {
    updateEngineFromPosition(rotx);
}

function mousePressed() {
    playAudio()
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    playAudio();
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function updateEngineFromPosition(rawX) {
    if (!dspNode || audioContext.state !== 'running') {
        return;
    }
    const clampedX = clamp(rawX);
    const modeSize = 180 / MODE_COUNT;
    const modeIndex = Math.min(MODE_COUNT - 1, Math.floor(clampedX / modeSize));
    if (modeIndex === currentEngineMode) {
        return;
    }
    currentEngineMode = modeIndex;
    const volume = scaleFraction(engineParamRanges.volume, MODE_VOLUME_FRACTIONS[modeIndex]);
    const speed = scaleFraction(engineParamRanges.maxSpeed, MODE_SPEED_FRACTIONS[modeIndex]);
    dspNode.setParamValue("/engine/volume", volume);
    dspNode.setParamValue("/engine/maxSpeed", speed);
    ensureEngineRunning();
}

function playAudio() {
    ensureEngineRunning();
}

function ensureEngineRunning() {
    if (!dspNode || audioContext.state !== 'running' || engineGateOpen) {
        return;
    }
    dspNode.setParamValue("/engine/gate", 1);
    engineGateOpen = true;
}

function clamp(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return 0;
    }
    if (value < 0) {
        return 0;
    }
    if (value > 180) {
        return 180;
    }
    return value;
}

function scaleFraction([min, max], fraction) {
    const safeFraction = Math.min(1, Math.max(0, fraction));
    return min + (max - min) * safeFraction;
}

//==========================================================================================
// END
//==========================================================================================