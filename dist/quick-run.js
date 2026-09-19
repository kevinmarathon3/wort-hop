// Road Run: answers earn an automatically planned and timed move.
const DIRECTIONS = [
  {key:'1', name:'Left', arrow:'←', dx:-1, dy:0},
  {key:'2', name:'Forward', arrow:'↑', dx:0, dy:1},
  {key:'3', name:'Right', arrow:'→', dx:1, dy:0},
  {key:'4', name:'Back', arrow:'↓', dx:0, dy:-1}
];
const TERRAIN = ['grass','road','road','grass','river','river','grass','rail','grass','road','road','road','grass','river','river','grass','rail','grass','road','road','finish'];
let quickRun = null, quickPace = 'adaptive', animatedHop = null;
const guidedStart = startLesson, guidedReview = openReview, guidedMove = move, guidedBird = bird;
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;

bird = function () {
  const target = {...player};
  if (animatedHop) {
    const p = Math.min(1,(performance.now()-animatedHop.started)/150);
    const ease = 1-Math.pow(1-p,3);
    player = {x:animatedHop.x+(target.x-animatedHop.x)*ease,y:animatedHop.y+(target.y-animatedHop.y)*ease};
    if(p>=1) animatedHop=null;
  }
  guidedBird(); player=target;
};
move = function (direction) {
  if(quickRun) return false;
  const old={...player}, moved=guidedMove(direction);
  if(moved&&!reducedMotion) animatedHop={...old,started:performance.now()};
  return moved;
};
function stopQuickRun(){
  quickRun=null; animatedHop=null;
  canvas.height=720;
  document.body.classList.remove('quick-playing');
  $('lesson-content').classList.remove('quick-paused');
  $('quick-toolbar').hidden=true; $('quick-start').textContent='▶ Road Run';
  document.querySelectorAll('[data-move]').forEach(b=>b.setAttribute('aria-label',`Hop ${b.dataset.move==='up'?'forward':b.dataset.move==='down'?'backward':b.dataset.move}`));
  canvas.setAttribute('aria-label','Road crossing game. Use arrow keys after answering a German question.');
}
startLesson=function(n){
  if(Number.isInteger(n)&&n>=0&&n<COURSE.length&&(n===0||saved.completed.includes(n-1)))stopQuickRun();
  return guidedStart(n);
};
openReview=function(){
  if(quickRun){quickRun.paused=true;updatePauseButton();}
  guidedReview();const b=$('start-review');if(b){const f=b.onclick;b.onclick=()=>{stopQuickRun();f();};}
};
$('review').onclick=()=>openReview();
const launch=document.createElement('div');launch.className='quick-launch';
launch.innerHTML='<button class="primary" id="quick-start">▶ Road Run</button><label for="quick-pace">Pace</label><select id="quick-pace"><option value="adaptive">Adaptive · 2–6s</option><option value="arcade">Arcade · 2s</option><option value="untimed">Untimed</option></select><span>Choose the answer. We handle the crossing.</span>';
document.querySelector('.play-layout').before(launch);
const toolbar=document.createElement('div');toolbar.id='quick-toolbar';toolbar.hidden=true;
toolbar.innerHTML='<div class="run-score"><span id="run-distance">0 / 20 rows</span><span id="run-lives" aria-label="3 lives">♥ ♥ ♥</span><span id="run-streak">0 streak</span></div><div class="quick-timer" role="progressbar" aria-label="Answer time remaining" aria-valuemin="0" aria-valuemax="100"><div id="quick-time-fill"></div></div><span id="quick-time-label"></span><button id="quick-pause">Pause</button><button id="quick-exit">Guided lesson</button>';
$('lesson-content').before(toolbar);
$('quick-start').onclick=()=>startQuickRun();
$('quick-pace').onchange=e=>{quickPace=e.target.value;if(quickRun){quickRun.pace=quickPace;if(quickRun.state==='question'){quickRun.limit=quickRun.remaining=quickLimit(quickRun.word);}}};
$('quick-pause').onclick=toggleQuickPause;$('quick-exit').onclick=()=>startLesson(lesson);
const guidedHelp=$('how').onclick;
$('how').onclick=()=>{if(!quickRun){guidedHelp();return;}quickRun.paused=true;updatePauseButton();showDialog('<span class="pill">ROAD RUN</span><h2>Answer fast. Cross safely.</h2><p>Choose the German translation by tapping its answer, pressing <b>1, 2, 3, or 4</b>, or using <b>left, up, right, down</b> respectively. These numbers are answer shortcuts, not directions.</p><p>A correct answer earns one automatic move. Your character looks ahead, waits for gaps, and dodges sideways or backward when needed. Cars, trains, and river currents keep moving while you think, so answering sooner gives it more time to escape.</p><p>Reach row 20 with three lives. Collisions return you to your last grassy checkpoint. New words appear with a hint. Corrections briefly show the answer and continue automatically. Traffic keeps moving, and completed crossings start a new road automatically. P or Space pauses at any time. Untimed removes the answer deadline but traffic still moves.</p><p>Guided lessons remain available for slower practice and course checkpoints.</p>');};

function makeRoad(){return TERRAIN.map((type,row)=>({type,row,speed:(row%2?-1:1)*(.65+(row%3)*.14),offset:Math.random()*5,spacing:type==='river'?3.2:4.8,length:type==='river'?2.45:1.15}));}
function laneObjects(lane,t){
  if(lane.type==='road'||lane.type==='river'){
    const origin=((t*lane.speed+lane.offset)%lane.spacing+lane.spacing)%lane.spacing;
    return [-2,-1,0,1,2,3].map(i=>({x:origin+i*lane.spacing,y:lane.row,length:lane.length,type:lane.type})).filter(o=>o.x>-3&&o.x<10);
  }
  if(lane.type==='rail'){
    const cycle=(t+lane.offset)%9;
    if(cycle>=5.7&&cycle<=7.8)return [{x:-5+(cycle-5.7)*8,y:lane.row,length:4.4,type:'rail'}];
  }
  return [];
}
function unsafeAt(x,y,t){
  const lane=quickRun.road[y];if(!lane||x<-.25||x>6.25)return true;
  const objects=laneObjects(lane,t);
  if(lane.type==='river')return !objects.some(o=>Math.abs(o.x-x)<o.length/2-.12);
  return objects.some(o=>Math.abs(o.x-x)<o.length/2+.18);
}
function startQuickRun(){
  if($('dialog').open)$('dialog').close();
  const pool=COURSE[lesson].words;
  quickRun={pool,deck:shuffle(pool),cursor:0,correct:0,total:0,streak:0,best:0,lives:3,checkpoint:{x:3,y:0},furthest:0,
    missed:new Set(),introduced:new Set(),retry:[],visits:{},paused:false,pace:quickPace,last:performance.now(),clock:0,camera:0,
    state:'intro',word:null,choices:[],remaining:Infinity,limit:Infinity,road:makeRoad(),invulnerable:0,movesPending:0,nextMoveAt:0,laps:0,rescues:0,lastFeedback:''};
  phase='quick';player={x:3,y:0};animatedHop=null;
  document.body.classList.add('quick-playing');
  
  canvas.setAttribute('aria-label','Scrolling road with moving cars, river logs and trains. Choose the German answer with 1, 2, 3, or 4. Arrow keys also select answers: left 1, up 2, right 3, down 4. The character steers automatically. P pauses.');
  $('quick-toolbar').hidden=false;$('quick-start').textContent='↻ Restart run';
  $('lesson-label').textContent=`ROAD RUN · ${COURSE[lesson].title.toUpperCase()}`;
  $('world-label').textContent='THE LONG WAY HOME';updatePauseButton();nextQuickWord();
  window.scrollTo?.({top:0,behavior:'instant'});
}
function quickLimit(w){
  if(quickRun.pace==='untimed')return Infinity;
  if(quickRun.pace==='arcade')return 2000;
  return (saved.memory[memoryKey(w)]?.streak||0)>0&&w[0].split(' ').length<=3?2000:6000;
}
function nextQuickWord(){
  const r=quickRun;if(!r)return;
  if(player.y>=TERRAIN.length-1){finishQuickRun(true);return;}
  const due=r.retry.findIndex(v=>v.at<=r.total);
  if(due>=0)r.word=r.retry.splice(due,1)[0].word;
  else {if(!r.deck.length)r.deck=shuffle(r.pool);r.word=r.deck.pop();}
  r.cursor++;$('lesson-number').textContent=`MOVE ${r.cursor}`;
  const key=memoryKey(r.word);
  r.newWord=!saved.memory[key]&&!r.introduced.has(key);
  r.introduced.add(key);showQuickQuestion();
  updateRunScore();
}
// Forecast occupancy throughout a landing window, including drifting logs.
function safeFor(x,y,at,duration=.9){
  if(!quickRun.road[y]||x<0||x>6)return false;
  const drift=quickRun.road[y].type==='river'?quickRun.road[y].speed:0;
  for(let dt=0;dt<=duration+.001;dt+=.075)if(unsafeAt(x+drift*dt,y,at+dt))return false;
  return true;
}
function chooseSafeMove(){
  const r=quickRun,at=r.clock;
  const candidates=DIRECTIONS.map((d,i)=>({i,x:player.x+d.dx,y:player.y+d.dy}))
    .filter(p=>p.x>=0&&p.x<=6&&p.y>=0&&p.y<TERRAIN.length&&safeFor(p.x,p.y,at));
  const forward=candidates.find(p=>p.i===1);
  if(forward)return forward;
  // Wait for an approaching gap while our current tile remains safe.
  if(safeFor(player.x,player.y,at,.4)&&at-r.navigationSince<.8)return null;
  const sides=candidates.filter(p=>p.i!==3);
  const options=sides.length?sides:candidates;
  options.sort((a,b)=>{
    const score=p=>(safeFor(p.x,p.y+1,at,.4)?20:0)-(r.visits[Math.round(p.x)+','+p.y]||0)*3-Math.abs(p.x-3);
    return score(b)-score(a);
  });
  return options[0]||null;
}
function autoPilot(){
  const r=quickRun;if(!r||!r.movesPending||r.clock<r.nextMoveAt)return false;
  const target=chooseSafeMove();
  if(!target)return false;
  const old={...player};player={x:target.x,y:target.y};r.movesPending--;r.nextMoveAt=r.clock+.18;r.navigationSince=r.clock;
  if(!reducedMotion)animatedHop={...old,started:performance.now()};hopTime=performance.now();
  const key=Math.round(player.x)+','+player.y;r.visits[key]=(r.visits[key]||0)+1;
  r.furthest=Math.max(r.furthest,player.y);
  if(r.road[player.y].type==='grass'&&player.y>r.checkpoint.y)r.checkpoint={...player};
  if(player.y===TERRAIN.length-1){finishQuickRun(true);return true;}
  // Movement runs independently; the next vocabulary prompt never waits for traffic.
  toast('Automatic safe hop');updateRunScore();return true;
}
function showQuickQuestion(){
  const r=quickRun;if(!r)return;
  const fromCard=false;
  
  const distractors=shuffle(r.pool.filter(w=>w[0]!==r.word[0])).slice(0,3).map(w=>w[0]);
  r.choices=shuffle([r.word[0],...distractors]);r.correctAnswer=r.choices.indexOf(r.word[0]);
  r.state='question';r.limit=r.remaining=quickLimit(r.word);r.last=performance.now();
  $('lesson-content').innerHTML=`<span class="pill">ANSWER TO ESCAPE</span><h2>“${esc(r.word[1])}”</h2><p class="run-hint">Pick the German answer. We steer and time the hop.</p><div class="auto-answers">${DIRECTIONS.map((d,i)=>`<button class="answer auto-answer" data-quick-choice="${i}"><kbd>${d.key} ${d.arrow}</kbd><strong>${esc(r.choices[i])}</strong></button>`).join('')}</div><div id="quick-feedback" class="feedback" aria-live="polite">${r.newWord?'New: '+esc(r.word[0])+' = '+esc(r.word[1]):esc(r.lastFeedback||'')}</div>`;
  document.querySelectorAll('[data-quick-choice]').forEach(b=>b.onclick=()=>chooseQuick(Number(b.dataset.quickChoice)));
  $('game-status').textContent='1/← · 2/↑ · 3/→ · 4/↓ answers · P pauses';
  toast('Answer quickly. We handle the crossing.');
  if(fromCard)window.scrollTo?.({top:0,behavior:'instant'});
}
function chooseQuick(choice){
  const r=quickRun;if(!r||r.state!=='question'||r.paused||$('dialog').open||document.hidden)return;
  if(choice!==-1&&(!Number.isInteger(choice)||choice<0||choice>3))return;
  const correct=choice===r.correctAnswer;r.total++;
  updateMemory(r.word,correct);
  if(!correct){
    r.streak=0;r.missed.add(memoryKey(r.word));
    if(!r.retry.some(v=>v.word===r.word))r.retry.push({word:r.word,at:r.total+2});
    showRoadCorrection(choice===-1?'Time’s up.':'Almost.',`${r.word[0]} = ${r.word[1]}`,false);
    return;
  }
  r.correct++;r.streak++;r.best=Math.max(r.best,r.streak);saved.xp+=10;save();
  if(!r.movesPending)r.navigationSince=r.clock;r.movesPending=Math.min(r.movesPending+1,4);
  r.state='hop';r.limit=r.remaining=140;r.lastFeedback='Richtig! '+r.word[0]+' · +10 XP';
  document.querySelectorAll('[data-quick-choice]').forEach(b=>{b.disabled=true;if(Number(b.dataset.quickChoice)===choice)b.classList.add('correct');});
  autoPilot();

}
function showRoadCorrection(title,detail,collision){
  const r=quickRun;r.state='correction';r.limit=r.remaining=1100;
  r.lastFeedback=title+' '+detail;
  // Keep the traffic running while showing the correct answer, without a continue gate.
  player={...r.checkpoint};animatedHop=null;r.movesPending=0;
  r.invulnerable=r.clock+2;
  document.querySelectorAll('[data-quick-choice]').forEach(b=>{b.disabled=true;if(Number(b.dataset.quickChoice)===r.correctAnswer)b.classList.add('correct');});
  $('quick-feedback').textContent=r.lastFeedback;
  toast(r.lastFeedback);updateRunScore();
}
function roadCollision(){
  const r=quickRun;if(!r||r.state==='correction')return;
  r.lives--;r.streak=0;player={...r.checkpoint};animatedHop=null;r.invulnerable=r.clock+.35;
  if(r.lives<=0){r.lives=3;r.rescues++;}
  showRoadCorrection('Bump! Back to safety.',`${r.lives} lives left. Answer sooner to give your character time to escape.`,true);
}
function updateRunScore(){
  const r=quickRun;if(!r)return;
  $('run-distance').textContent=`${Math.floor(r.furthest)} / ${TERRAIN.length-1} rows`;
  $('run-lives').textContent='♥ '.repeat(r.lives)+'♡ '.repeat(3-r.lives);
  $('run-lives').setAttribute('aria-label',`${r.lives} lives`);
  $('run-streak').textContent=`${r.streak} streak`;
  $('cross-count').textContent=`ROW ${Math.floor(player.y)} / ${TERRAIN.length-1}`;
  $('progress-fill').style.width=`${r.furthest/(TERRAIN.length-1)*100}%`;
}
function finishQuickRun(won){
  const r=quickRun;r.laps++;r.road=makeRoad();r.camera=0;
  player={x:3,y:0};animatedHop=null;r.checkpoint={...player};r.furthest=0;r.lives=3;
  r.movesPending=0;r.visits={};r.invulnerable=r.clock+.5;
  r.lastFeedback='Crossing '+r.laps+' complete! Keep going.';
  nextQuickWord();
}
function updatePauseButton(){
  $('quick-pause').textContent=quickRun?.paused?'Resume':'Pause';
  $('quick-pause').setAttribute('aria-pressed',String(!!quickRun?.paused));
  $('lesson-content').classList.toggle('quick-paused',!!quickRun?.paused);
}
function toggleQuickPause(){if(!quickRun)return;quickRun.paused=!quickRun.paused;quickRun.last=performance.now();updatePauseButton();}
function quickTick(now){
  const r=quickRun;if(r){
    const dt=Math.max(0,Math.min(100,now-r.last));r.last=now;
    const running=!r.paused&&!document.hidden&&!$('dialog').open;
    if(running&&['question','hop','correction'].includes(r.state)){
      const worldScale=r.pace==='adaptive'&&quickLimit(r.word)>2000?.5:1;
      r.clock+=dt/1000*worldScale;
      const lane=r.road[player.y];
      if(lane.type==='river')player.x+=lane.speed*dt/1000*worldScale;
      if(r.state!=='correction')autoPilot();
      if(r.clock>r.invulnerable&&unsafeAt(player.x,player.y,r.clock))roadCollision();
      if(['question','hop','correction'].includes(r.state)&&Number.isFinite(r.remaining)){
        r.remaining=Math.max(0,r.remaining-dt);
        if(r.remaining===0){if(r.state==='question')chooseQuick(-1);else nextQuickWord();}
      }
    }
    const fraction=Number.isFinite(r.limit)?r.remaining/r.limit:1;
    $('quick-time-fill').style.width=`${Math.max(0,fraction)*100}%`;
    $('quick-time-fill').parentElement.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
    $('quick-time-label').textContent=r.paused?'Paused':r.state==='question'?(Number.isFinite(r.remaining)?`${(r.remaining/1000).toFixed(1)}s`:'Untimed · traffic moving'):r.state==='hop'?'Next word…':r.state==='correction'?'Reviewing · next word…':'Running';
    $('run-distance').textContent='Crossing '+(r.laps+1)+' · '+Math.floor(r.furthest)+' / 20';
    r.camera+=(player.y-r.camera)*Math.min(1,dt/130);
  }
  requestAnimationFrame(quickTick);
}
requestAnimationFrame(quickTick);
document.addEventListener('keydown',e=>{
  if(!quickRun||$('dialog').open||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.repeat)return;
  if(e.key===' '||e.key.toLowerCase()==='p'){e.preventDefault();toggleQuickPause();}
  else if(['1','2','3','4'].includes(e.key)){e.preventDefault();chooseQuick(Number(e.key)-1);}
  else if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();chooseQuick({ArrowLeft:0,ArrowUp:1,ArrowRight:2,ArrowDown:3}[e.key]);}
});
document.addEventListener('visibilitychange',()=>{if(quickRun&&document.hidden){quickRun.paused=true;updatePauseButton();}});

// Render gameplay geometry with a tracking camera. This is the live game world,
// not a background illustration: all hazard positions match collision checks.
function roadRunFrame(){
  const r=quickRun;if(!r)return false;
  const height=canvas.clientWidth?Math.round(1000*canvas.clientHeight/canvas.clientWidth):720;
  if(canvas.height!==height)canvas.height=height;
  const rowStep=Math.max(61,height/10);
  const originalIso=iso;
  iso=(x,y,z=0)=>({x:500+(x-3)*86+(y-r.camera)*22,y:height*.82-(y-r.camera)*rowStep+(x-3)*15-z});
  try{
    ctx.clearRect(0,0,1000,height);ctx.fillStyle='#a9c682';ctx.fillRect(0,0,1000,height);
    const start=Math.max(-2,Math.floor(r.camera)-3),end=Math.min(TERRAIN.length+2,Math.ceil(r.camera)+10),objects=[];
    for(let y=end;y>=start;y--){
      const lane=r.road[y]||{type:'grass',row:y},kind=lane.type;
      for(let x=-5;x<=11;x++){
        const inside=x>=0&&x<=6;
        const color=kind==='road'?'#647269':kind==='river'?'#68aebb':kind==='rail'?'#a7987b':kind==='finish'?'#c6de92':inside?((x+y)%2?'#a0c079':'#acc982'):'#94b36a';
        tile(x,y,color);
        if(kind==='road'&&x%2===0)box(x,y,.43,.045,.5,'#d8d9b0','#d8d9b0','#d8d9b0');
        if(kind==='rail'){box(x,y-.23,1,.025,2,'#e1ddc8','#888f87','#888f87');box(x,y+.23,1,.025,2,'#e1ddc8','#888f87','#888f87');box(x,y,.08,.75,1,'#6d675b','#6d675b','#6d675b');}
        if(kind==='river'&&x%2===0)box(x+.2,y,.35,.025,.2,'#9ed1d0','#9ed1d0','#9ed1d0');
        if(kind==='finish'&&inside)tile(x,y,x%2?'#fff7d5':'#395b40');
      }
      if(kind==='grass'&&y>=0&&y<TERRAIN.length){objects.push({type:'tree',x:-1.3,y:y+.1});objects.push({type:'tree',x:7.5,y:y-.15});}
      if(['road','river','rail'].includes(kind))objects.push(...laneObjects(lane,r.clock));
      if(kind==='rail'){
        const warning=(r.clock+lane.offset)%9>=3.7&&(r.clock+lane.offset)%9<7.8;
        box(7.1,y,.12,.12,53,'#474d42','#474d42','#474d42');
        box(7.1,y,.25,.22,58,warning?'#ff684a':'#bbc89b',warning?'#ff684a':'#bbc89b','#6b7457');
        if(warning){const p=iso(6.7,y,75);ctx.font='bold 17px sans-serif';ctx.fillStyle='#7c3928';ctx.fillText('TRAIN',p.x,p.y);}
      }
    }
    objects.push({type:'player',...player});
    objects.sort((a,b)=>iso(a.x,a.y).y-iso(b.x,b.y).y);
    for(const o of objects){
      if(o.type==='player')bird();
      else if(o.type==='tree')tree(o.x,o.y,.8);
      else if(o.type==='road')car(o.x,o.y,['#e9b757','#db795c','#8cbbc5'][o.y%3]);
      else if(o.type==='river'){box(o.x,o.y,o.length,.72,10,'#b18a59','#8b6748','#785b3f');for(let k=-1;k<=1;k++)box(o.x+k*.7,o.y,.06,.7,11,'#c7a473','#8b6748','#8b6748');}
      else if(o.type==='rail'){box(o.x,o.y,4.4,.66,36,'#d9a650','#b77a37','#99642f');for(let k=-1;k<=1;k++)box(o.x+k*1.25,o.y,1,.5,53,'#eed49a','#657e7b','#476267');}
    }

  }finally{iso=originalIso;}
  return true;
}
