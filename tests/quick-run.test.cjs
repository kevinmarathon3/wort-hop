const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(),events={};
function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{style:{},dataset:{},hidden:false,open:false,textContent:'',innerHTML:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},before(){},setAttribute(){},querySelectorAll(){return[]},getContext(){return{}},addEventListener(){},showModal(){this.open=true},close(){this.open=false},parentElement:{setAttribute(){}}});}return nodes.get(id);}
let now=1000;
const context={assert,console,Date,Math,performance:{now:()=>now},requestAnimationFrame(){},setInterval(){},localStorage:{getItem(){return null},setItem(){}},window:{addEventListener(){}},document:{hidden:false,body:node('body'),createElement:()=>node('new'),getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener:(name,f)=>(events[name]??=[]).push(f)}};
vm.createContext(context);for(const f of ['curriculum.js','app.js','quick-run.js'])vm.runInContext(fs.readFileSync(`${__dirname}/../dist/${f}`,'utf8'),context);
const run=code=>vm.runInContext(code,context);
function tick(ms){for(let n=0;n<ms;n+=20){now+=20;run(`quickTick(${now})`);}}
run(`saved.sound=false;startQuickRun();assert.equal(quickRun.state,'question');assert(quickRun.newWord);assert.equal(quickRun.limit,6000);assert.equal(quickRun.choices.length,4);assert(!$('lesson-content').innerHTML.includes('quick-ready'));quickRun.road=quickRun.road.map(l=>({...l,type:'grass'}));toggleQuickPause();var remaining=quickRun.remaining,clock=quickRun.clock;`);
tick(1000);run(`assert.equal(quickRun.remaining,remaining);assert.equal(quickRun.clock,clock);toggleQuickPause();var cursor=quickRun.cursor;chooseQuick((quickRun.correctAnswer+1)%4);assert.equal(quickRun.state,'correction');assert.equal(quickRun.retry.length,1);var correctionClock=quickRun.clock;assert(!$('lesson-content').innerHTML.includes('quick-continue'));`);
tick(500);run(`assert(quickRun.clock>correctionClock);assert.equal(quickRun.state,'correction');`);tick(620);run(`assert.equal(quickRun.state,'question');assert.equal(quickRun.cursor,cursor+1);`);
// Traffic waits must never block the next vocabulary question.
run(`var planner=chooseSafeMove;chooseSafeMove=()=>null;chooseQuick(quickRun.correctAnswer);assert.equal(quickRun.state,'hop');assert.equal(quickRun.movesPending,1);var earned=saved.xp;chooseQuick(quickRun.correctAnswer);assert.equal(saved.xp,earned);`);tick(160);run(`assert.equal(quickRun.state,'question');assert.equal(quickRun.movesPending,1);chooseSafeMove=planner;`);tick(20);run(`assert.equal(quickRun.movesPending,0);assert.equal(player.y,1);`);
// Endless crossings automatically roll over; deaths do not create a game-over gate.
run(`quickRun.movesPending=1;player={x:3,y:19};quickRun.nextMoveAt=0;autoPilot();assert.equal(quickRun.laps,1);assert.equal(player.y,0);assert.equal(quickRun.state,'question');quickRun.lives=1;roadCollision();assert.equal(quickRun.lives,3);assert.equal(quickRun.state,'correction');`);tick(1120);run(`assert.equal(quickRun.state,'question');`);
run(`var realChoose=chooseQuick;var pressed=[];chooseQuick=i=>pressed.push(i);`);
for(const key of ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','1','2','3','4'])for(const f of events.keydown)f({key,target:{tagName:'BODY'},repeat:false,preventDefault(){}});
run(`assert.deepEqual(pressed,[0,1,2,3,0,1,2,3]);chooseQuick=realChoose;`);
// Preserve the guided lesson checkpoint and unlock behavior.
run(`startLesson(0);for(let n=0;n<6;n++){phase='question';render();assert(answer(word()[0]).correct);finishCrossing();$('next-crossing').onclick();}for(let n=0;n<6;n++){assert(answer(word()[0]).correct);$('checkpoint-next').onclick();}assert(saved.completed.includes(0));`);
console.log('PASS: inline new-word hints, automatic corrections with moving traffic, nonblocking movement queue, endless crossings, automatic rescue, arrow/number shortcuts, explicit pause, duplicate input and guided unlock.');
