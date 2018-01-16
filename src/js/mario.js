/* mario.js */
// Starts everything.

function FullScreenMario() {
  var time_start = Date.now();
  
  // Thanks, Obama...
  ensureLocalStorage();
  
  // I keep this cute little mini-library for some handy functions
  TonedJS(true);
  
  // It's useful to keep references to the body
  window.body = document.body;
  window.bodystyle = body.style;
  
  // Know when to shut up
  window.verbosity = { Maps: false, Sounds: false };
  
  window.requestAnimationFrame = window.requestAnimationFrame
                           || window.mozRequestAnimationFrame
                           || window.webkitRequestAnimationFrame
                           || window.msRequestAnimationFrame
                           || function(func) { setTimeout(func, timer); };
  window.cancelAnimationFrame = window.cancelAnimationFrame
                           || window.webkitCancelRequestAnimationFrame
                           || window.mozCancelRequestAnimationFrame
                           || window.oCancelRequestAnimationFrame
                           || window.msCancelRequestAnimationFrame
                           || clearTimeout;

  window.Uint8ClampedArray = window.Uint8ClampedArray
                           || window.Uint8Array
                           || Array;

  // Resetting everything may take a while
  resetMeasurements();
  resetLibrary();
  resetEvents();
  resetCanvas();
  resetThings();
  resetScenery();
  resetMapsManager();
  resetStatsHolder();
  resetInputWriter();
  resetTriggers();
  resetSounds();

    if ('ontouchstart' in document.documentElement) {
      mobileButtons();
    }

  // With that all set, set the map to World11.
  StatsHolder.set("lives", 3);
  setMap([1,1]);
 
  log("It took " + (Date.now() - time_start) + " milliseconds to start.");
}

// To do: add in a real polyfill
function ensureLocalStorage() {
  var ls_ok = false;
  try {
  if(!window.hasOwnProperty("localStorage"))
    window.localStorage = { crappy: true };
  
  // Some browsers (mainly IE) won't allow it on a local machine anyway
  if(window.localStorage) ls_ok = true;
 }
 catch(err) {
    ls_ok = false;
  }
  if(!ls_ok) {
    var nope = document.body.innerText = "It seems your browser does not allow localStorage!";
    throw nope;
  }
}

/* Basic reset operations */
function resetMeasurements() {
  resetUnitsize(4);
  resetTimer(1000 / 60);
  
  window.jumplev1 = 32;
  window.jumplev2 = 64;
  window.ceillev  = 88; // The floor is 88 spaces (11 blocks) below the yloc = 0 level
  window.ceilmax  = 104; // The floor is 104 spaces (13 blocks) below the top of the screen (yloc = -16)
  window.castlev  = -48;
  window.paused   = true;
  
  resetGameScreen();
  if(!window.parentwindow) window.parentwindow = false;
}

// Unitsize is kept as a measure of how much to expand (typically 4)
function resetUnitsize(num) {
  window.unitsize = num;
  for(var i = 2; i <= 64; ++i) {
    window["unitsizet" + i] = unitsize * i;
    window["unitsized" + i] = unitsize / i;
  }
  window.scale = unitsized2; // Typically 2
  window.gravity = round(12 * unitsize) / 100; // Typically .48
}

function resetTimer(num) {
  num = roundDigit(num, .001);
  window.timer = window.timernorm = num;
  window.timert2 = num * 2;
  window.timerd2 = num / 2;
  window.fps = window.fps_target = roundDigit(1000 / num, .001);
  window.time_prev = Date.now();
}

function resetGameScreen() {
  window.gamescreen = new getGameScreen();
}
function getGameScreen() {
  resetGameScreenPosition(this);
  // Middlex is static and only used for scrolling to the right
  this.middlex = (this.left + this.right) / 2;
  // this.middlex = (this.left + this.right) / 3;
  
  // This is the bottom of the screen - water, pipes, etc. go until here
  window.botmax = this.height - ceilmax;  
  if(botmax < unitsize ) { 
    body.innerHTML = "<div class='nottall'><br>Your screen isn't high enough. Make it taller, then refresh.</div>";
  }
  
  // The distance at which Things die from falling
  this.deathheight = this.bottom + 48;
}
function resetGameScreenPosition(me) {
  me = me || window.gamescreen;
  me.left = me.top = 0;
  me.bottom = innerHeight;
  me.right = innerWidth;
  me.height = innerHeight / unitsize;
  me.width = innerWidth / unitsize;
  me.unitheight = innerHeight;
  me.unitwidth = innerWidth;
}

// Events are done with TimeHandlr.js
// This helps make timing obey pauses, and makes class cycles much easier
function resetEvents() {
  window.TimeHandler = new TimeHandlr({
    onSpriteCycleStart: "onadding",
    doSpriteCycleStart: "placed",
    cycleCheckValidity: "alive",
    timingDefault: 9
  });
}

// Sounds are done with AudioPlayr.js
function resetSounds() {
  window.sounds = {};
  window.theme = false;
  window.muted = (localStorage && localStorage.muted == "true");
  
  window.AudioPlayer = new AudioPlayr({
    directory: "Sounds",
    getVolumeLocal: function() { return .49; },
    getThemeDefault: function() { return setting.split(' ')[0]; }, 
    localStorageMuted: "muted",
    library: {
      Sounds: [
        "Bowser Falls",
        "Bowser Fires",
        "Break Block",
        "Bump",
        "Coin",
        "Ending",
        "Fireball",
        "Firework",
        "Flagpole",
        "Gain Life",
        "Game Over 2",
        "Game Over",
        "Hurry",
        "Into the Tunnel",
        "Jump Small",
        "Jump Super",
        "Kick",
        "Level Complete",
        "Player Dies",
        "Pause",
        "Pipe",
        "Power Down",
        "Powerup Appears",
        "Powerup",
        "Stage Clear",
        "Vine Emerging",
        "World Clear",
        "You Dead"
      ],
      Themes: [
        "Castle",
        "Overworld",
        "Overworld1",
        "Underwater",
        "Underworld",
        "Star",
        "Sky",
        "Hurry Castle",
        "Hurry Overworld",
        "Hurry Underwater",
        "Hurry Underworld",
        "Hurry Star",
        "Hurry Sky"
      ]
    }
  });
}

// Quadrants are done with QuadsKeepr.js
// This starts off with 7 cols and 6 rows (each has 1 on each side for padding)
function resetQuadrants() {
  window.QuadsKeeper = new QuadsKeepr({
    num_rows: 5,
    num_cols: 6,
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    tolerance: unitsized2,
    onUpdate: function() { MapsManager.spawnMap((gamescreen.right + QuadsKeeper.getOutDifference() ) / unitsize); },
    onCollide: false
  });
}

// Variables regarding the state of the game
// This is called in setMap to reset everything
function resetGameState(nocount) {
  // HTML is reset here
  clearAllTimeouts();
  window.nokeys = window.spawning = window.spawnon =
    window.notime = window.editing = window.qcount = window.lastscroll = 0;
  window.paused = window.gameon = window.speed = 1;
  // Shifting location shouldn't wipe the gamecount (for key histories)
  if(!nocount) window.gamecount = 0;
  // And quadrants
  resetQuadrants();
  // Keep a history of pressed keys
  window.gamehistory = [];
  // Clear audio
  AudioPlayer.pause();
}

function scrollWindow(x, y) {
  x = x || 0; y = y || 0;
  var xinv = -x, yinv = -y;
  
  gamescreen.left += x; gamescreen.right += x;
  gamescreen.top += y; gamescreen.bottom += y;
  
  shiftAll(characters, xinv, yinv);
  shiftAll(solids, xinv, yinv);
  shiftAll(scenery, xinv, yinv);
  shiftAll(QuadsKeeper.getQuadrants(), xinv, yinv);
  shiftElements(texts, xinv, yinv);
  QuadsKeeper.updateQuadrants(xinv);
  
  if(window.playediting) scrollEditor(x, y);
}
function shiftAll(stuff, x, y) {
  for(var i = stuff.length - 1; i >= 0; --i)
      shiftBoth(stuff[i], x, y);
}
function shiftElements(stuff, x, y) {
  for(var i = stuff.length - 1, elem; i >= 0; --i) {
    elem = stuff[i];
    elementShiftLeft(elem, x);
    elementShiftTop(elem, y);
  }
}

// Similar to scrollWindow, but saves the player's x-loc
function scrollPlayer(x, y, see) {
  var saveleft = player.left,
      savetop = player.top;
  y = y || 0;
  scrollWindow(x,y);
  setLeft(player, saveleft, see);
  setTop(player, savetop + y * unitsize, see);
  QuadsKeeper.updateQuadrants();
}

// Calls log if window.verbosity has the type enabled
function mlog(type) {
  if(verbosity[type]) {
    log.apply(console, arguments);
  }
}

//Add buttons for mobile
function  mobileButtons() {
    
  var mb = document.createElement('div');
      mb.className = 'mobile-buttons',
      rarr = getRightArr(),
      larr = getLeftArr(),
      uarr = getUpArr(),
      darr = getDownArr(),
      innerHTML = "<a class='mb' id='mb-left'>"+larr+"</a><a class='mb' id='mb-down'>"+darr+"</a><a class='mb' id='mb-up'>"+uarr+"</a><a class='mb' id='mb-right'>"+rarr+"</a>";
      mb.innerHTML = innerHTML;

  body.appendChild(mb);

  //buttons
  var mbUp = document.getElementById('mb-up'),
      mbDown = document.getElementById('mb-down'),
      mbLeft = document.getElementById('mb-left'),
      mbRight = document.getElementById('mb-right');

  mbUp.addEventListener('touchstart', function(e){
    e.preventDefault();

    var pressEv = new Event("keydown");
        pressEv.key="ArrowUp";    
        pressEv.keyCode=38;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=38;

        body.dispatchEvent(pressEv);
  });

  mbUp.addEventListener('touchend', function(e){
    e.preventDefault();

    var pressEv = new Event("keyup");
        pressEv.key="ArrowUp";    
        pressEv.keyCode=38;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=38;

        body.dispatchEvent(pressEv);
  });

  mbDown.addEventListener('touchstart', function(e){
    e.preventDefault();

    var pressEv = new Event("keydown");
        pressEv.key="ArrowDown";    
        pressEv.keyCode=40;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=40;

        body.dispatchEvent(pressEv);
  });

  mbDown.addEventListener('touchend', function(e){
    e.preventDefault();

    var pressEv = new Event("keyup");
        pressEv.key="ArrowDown";    
        pressEv.keyCode=40;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=40;

        body.dispatchEvent(pressEv);
  });

  
  mbLeft.addEventListener('touchstart', function(e){
    e.preventDefault();

    var pressEv = new Event("keydown");
        pressEv.key="ArrowLeft";    
        pressEv.keyCode=37;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=37;

        body.dispatchEvent(pressEv);
  });

  mbLeft.addEventListener('touchend', function(e){
    e.preventDefault();

    var pressEv = new Event("keyup");
        pressEv.key="ArrowLeft";    
        pressEv.keyCode=37;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=37;

        body.dispatchEvent(pressEv);
  });

  mbRight.addEventListener('touchstart', function(e){
    e.preventDefault();

    var pressEv = new Event("keydown");
        pressEv.key="ArrowRight";    
        pressEv.keyCode=39;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=39;

        body.dispatchEvent(pressEv);
  });

  mbRight.addEventListener('touchend', function(e){
    e.preventDefault();

    var pressEv = new Event("keyup");
        pressEv.key="ArrowRight";    
        pressEv.keyCode=39;
        pressEv.altKey=false;
        pressEv.ctrlKey=false;
        pressEv.shiftKey=false;
        pressEv.metaKey=false;
        pressEv.bubbles=true;
        pressEv.which=39;

        body.dispatchEvent(pressEv);
  });
}


function getRightArr(){
return '<img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU0IDU0IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NCA1NDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPGc+CgkJPHBhdGggc3R5bGU9ImZpbGw6Izg4QzA1NzsiIGQ9Ik0yNyw1M0wyNyw1M0MxMi42NDEsNTMsMSw0MS4zNTksMSwyN3YwQzEsMTIuNjQxLDEyLjY0MSwxLDI3LDFoMGMxNC4zNTksMCwyNiwxMS42NDEsMjYsMjZ2MCAgICBDNTMsNDEuMzU5LDQxLjM1OSw1MywyNyw1M3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojODhDMDU3OyIgZD0iTTI3LDU0QzEyLjExMiw1NCwwLDQxLjg4OCwwLDI3UzEyLjExMiwwLDI3LDBzMjcsMTIuMTEyLDI3LDI3UzQxLjg4OCw1NCwyNyw1NHogTTI3LDIgICAgQzEzLjIxNSwyLDIsMTMuMjE1LDIsMjdzMTEuMjE1LDI1LDI1LDI1czI1LTExLjIxNSwyNS0yNVM0MC43ODUsMiwyNywyeiIvPgoJPC9nPgoJPGc+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0zNi4xNDQsMjguMDE3bC0xNS4xMDEsOC43MTlDMjAuNTc5LDM3LjAwNCwyMCwzNi42NjksMjAsMzYuMTM0VjE4LjY5NiAgICBjMC0wLjUzNSwwLjU3OS0wLjg3LDEuMDQzLTAuNjAybDE1LjEwMSw4LjcxOUMzNi42MDgsMjcuMDgxLDM2LjYwOCwyNy43NSwzNi4xNDQsMjguMDE3eiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBkPSJNMjAuNjk3LDM3LjgzYy0wLjkzNiwwLTEuNjk3LTAuNzYxLTEuNjk3LTEuNjk2VjE4LjY5NkMxOSwxNy43NjEsMTkuNzYxLDE3LDIwLjY5NywxNyAgICBjMC4yOTUsMCwwLjU4OCwwLjA3OCwwLjg0NiwwLjIyOGwxNS4xMDEsOC43MTljMC41MzEsMC4zMDcsMC44NDgsMC44NTUsMC44NDgsMS40NjlzLTAuMzE3LDEuMTYyLTAuODQ4LDEuNDY5bC0xNS4xMDEsOC43MTkgICAgQzIxLjI4NSwzNy43NTIsMjAuOTkyLDM3LjgzLDIwLjY5NywzNy44M3ogTTIxLDE5LjIyNHYxNi4zODNsMTQuMTg3LTguMTkxTDIxLDE5LjIyNHoiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K" />';
}

function getLeftArr(){
return '<img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU0IDU0IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NCA1NDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPGc+CgkJPHBhdGggc3R5bGU9ImZpbGw6Izg4QzA1NzsiIGQ9Ik0yNywxTDI3LDFjMTQuMzU5LDAsMjYsMTEuNjQxLDI2LDI2djBjMCwxNC4zNTktMTEuNjQxLDI2LTI2LDI2aDBDMTIuNjQxLDUzLDEsNDEuMzU5LDEsMjd2MCAgICBDMSwxMi42NDEsMTIuNjQxLDEsMjcsMXoiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojODhDMDU3OyIgZD0iTTI3LDU0QzEyLjExMiw1NCwwLDQxLjg4OCwwLDI3UzEyLjExMiwwLDI3LDBzMjcsMTIuMTEyLDI3LDI3UzQxLjg4OCw1NCwyNyw1NHogTTI3LDIgICAgQzEzLjIxNSwyLDIsMTMuMjE1LDIsMjdzMTEuMjE1LDI1LDI1LDI1czI1LTExLjIxNSwyNS0yNVM0MC43ODUsMiwyNywyeiIvPgoJPC9nPgoJPGc+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0xNy44NTYsMjUuOTgzbDE1LjEwMS04LjcxOUMzMy40MjEsMTYuOTk2LDM0LDE3LjMzMSwzNCwxNy44NjZ2MTcuNDM3ICAgIGMwLDAuNTM1LTAuNTc5LDAuODctMS4wNDMsMC42MDJsLTE1LjEwMS04LjcxOUMxNy4zOTIsMjYuOTE5LDE3LjM5MiwyNi4yNSwxNy44NTYsMjUuOTgzeiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkZGRkY7IiBkPSJNMzMuMzA0LDM3Yy0wLjI5NSwwLTAuNTg4LTAuMDc4LTAuODQ3LTAuMjI4bC0xNS4xMDItOC43MTljLTAuNTMtMC4zMDctMC44NDgtMC44NTUtMC44NDgtMS40NjkgICAgczAuMzE3LTEuMTYyLDAuODQ4LTEuNDY5bDE1LjEwMi04LjcxOWMwLjI1OS0wLjE0OSwwLjU1Mi0wLjIyOCwwLjg0Ny0wLjIyOGMwLjkzNiwwLDEuNjk2LDAuNzYxLDEuNjk2LDEuNjk2djE3LjQzOCAgICBDMzUsMzYuMjM5LDM0LjIzOSwzNywzMy4zMDQsMzd6IE0xOC44MTIsMjYuNTg1TDMzLDM0Ljc3NlYxOC4zOTRMMTguODEyLDI2LjU4NXoiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K" />';
}

function getUpArr() {
return '<img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU0IDU0IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NCA1NDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPGc+CgkJPHBhdGggc3R5bGU9ImZpbGw6Izg4QzA1NzsiIGQ9Ik01MywyN0w1MywyN2MwLDE0LjM1OS0xMS42NDEsMjYtMjYsMjZoMEMxMi42NDEsNTMsMSw0MS4zNTksMSwyN3YwQzEsMTIuNjQxLDEyLjY0MSwxLDI3LDFoMCAgICBDNDEuMzU5LDEsNTMsMTIuNjQxLDUzLDI3eiIvPgoJCTxwYXRoIHN0eWxlPSJmaWxsOiM4OEMwNTc7IiBkPSJNMjcsNTRDMTIuMTEyLDU0LDAsNDEuODg4LDAsMjdTMTIuMTEyLDAsMjcsMHMyNywxMi4xMTIsMjcsMjdTNDEuODg4LDU0LDI3LDU0eiBNMjcsMiAgICBDMTMuMjE1LDIsMiwxMy4yMTUsMiwyN3MxMS4yMTUsMjUsMjUsMjVzMjUtMTEuMjE1LDI1LTI1UzQwLjc4NSwyLDI3LDJ6Ii8+Cgk8L2c+Cgk8Zz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTI4LjAxNywxNy44NTZsOC43MTksMTUuMTAxQzM3LjAwNCwzMy40MjEsMzYuNjY5LDM0LDM2LjEzNCwzNEgxOC42OTYgICAgYy0wLjUzNSwwLTAuODctMC41NzktMC42MDItMS4wNDNsOC43MTktMTUuMTAxQzI3LjA4MSwxNy4zOTIsMjcuNzUsMTcuMzkyLDI4LjAxNywxNy44NTZ6Ii8+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0zNi4xMzQsMzVIMTguNjk2Yy0wLjYxMywwLTEuMTYyLTAuMzE2LTEuNDY5LTAuODQ4Yy0wLjMwNi0wLjUzLTAuMzA3LTEuMTY0LDAtMS42OTVsOC43MTktMTUuMTAyICAgIGMwLjMwNy0wLjUzLDAuODU1LTAuODQ4LDEuNDY5LTAuODQ4czEuMTYyLDAuMzE3LDEuNDY5LDAuODQ4bDguNzE5LDE1LjEwMmMwLjMwNywwLjUzMSwwLjMwNiwxLjE2NSwwLDEuNjk1ICAgIEMzNy4yOTYsMzQuNjg0LDM2Ljc0NywzNSwzNi4xMzQsMzV6IE0xOS4yMjQsMzNoMTYuMzgzbC04LjE5MS0xNC4xODhMMTkuMjI0LDMzeiIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=" />';
}

function getDownArr(){
return '<img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU0IDU0IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NCA1NDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPGc+CgkJPHBhdGggc3R5bGU9ImZpbGw6Izg4QzA1NzsiIGQ9Ik0xLDI3TDEsMjdDMSwxMi42NDEsMTIuNjQxLDEsMjcsMWgwYzE0LjM1OSwwLDI2LDExLjY0MSwyNiwyNnYwYzAsMTQuMzU5LTExLjY0MSwyNi0yNiwyNmgwICAgIEMxMi42NDEsNTMsMSw0MS4zNTksMSwyN3oiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojODhDMDU3OyIgZD0iTTI3LDU0QzEyLjExMiw1NCwwLDQxLjg4OCwwLDI3UzEyLjExMiwwLDI3LDBzMjcsMTIuMTEyLDI3LDI3UzQxLjg4OCw1NCwyNyw1NHogTTI3LDIgICAgQzEzLjIxNSwyLDIsMTMuMjE1LDIsMjdzMTEuMjE1LDI1LDI1LDI1czI1LTExLjIxNSwyNS0yNVM0MC43ODUsMiwyNywyeiIvPgoJPC9nPgoJPGc+CgkJPHBhdGggc3R5bGU9ImZpbGw6I0ZGRkZGRjsiIGQ9Ik0yNS45ODMsMzYuMTQ0bC04LjcxOS0xNS4xMDFDMTYuOTk2LDIwLjU3OSwxNy4zMzEsMjAsMTcuODY2LDIwaDE3LjQzNyAgICBjMC41MzUsMCwwLjg3LDAuNTc5LDAuNjAyLDEuMDQzbC04LjcxOSwxNS4xMDFDMjYuOTE5LDM2LjYwOCwyNi4yNSwzNi42MDgsMjUuOTgzLDM2LjE0NHoiLz4KCQk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTI2LjU4NSwzNy40OTJjLTAuNjEzLDAtMS4xNjItMC4zMTctMS40NjktMC44NDhsLTguNzE5LTE1LjEwMmMtMC4zMDctMC41MzEtMC4zMDYtMS4xNjUsMC0xLjY5NSAgICBDMTYuNzA0LDE5LjMxNiwxNy4yNTMsMTksMTcuODY2LDE5aDE3LjQzOGMwLjYxMywwLDEuMTYyLDAuMzE2LDEuNDY5LDAuODQ4YzAuMzA2LDAuNTMsMC4zMDcsMS4xNjQsMCwxLjY5NWwtOC43MTksMTUuMTAyICAgIEMyNy43NDcsMzcuMTc1LDI3LjE5OCwzNy40OTIsMjYuNTg1LDM3LjQ5MnogTTE4LjM5NCwyMWw4LjE5MSwxNC4xODhMMzQuNzc2LDIxSDE4LjM5NHoiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K" />';
}

