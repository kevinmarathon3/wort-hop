// Road Run: vocabulary answers are directional moves in a scrolling world.
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
  if(quickRun) {chooseQuick({left:0,up:1,right:2,down:3}[direction]);return true;}
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
launch.innerHTML='<button class="primary" id="quick-start">▶ Road Run</button><label for="quick-pace">Pace</label><select id="quick-pace"><option value="adaptive">Adaptive · 2–6s</option><option value="arcade">Arcade · 2s</option><option value="untimed">Untimed</option></select><span>1 ← &nbsp; 2 ↑ &nbsp; 3 → &nbsp; 4 ↓ &nbsp; · Answer to move</span>';
document.querySelector('.play-layout').before(launch);
const toolbar=document.createElement('div');toolbar.id='quick-toolbar';toolbar.hidden=true;
toolbar.innerHTML='<div class="run-score"><span id="run-distance">0 / 20 rows</span><span id="run-lives" aria-label="3 lives">♥ ♥ ♥</span><span id="run-streak">0 streak</span></div><div class="quick-timer" role="progressbar" aria-label="Answer time remaining" aria-valuemin="0" aria-valuemax="100"><div id="quick-time-fill"></div></div><span id="quick-time-label"></span><button id="quick-pause">Pause</button><button id="quick-exit">Guided lesson</button>';
$('lesson-content').before(toolbar);
$('quick-start').onclick=()=>startQuickRun();
$('quick-pace').onchange=e=>{quickPace=e.target.value;if(quickRun){quickRun.pace=quickPace;if(quickRun.state==='question'){quickRun.limit=quickRun.remaining=quickLimit(quickRun.word);}}};
$('quick-pause').onclick=toggleQuickPause;$('quick-exit').onclick=()=>startLesson(lesson);
const guidedHelp=$('how').onclick;
$('how').onclick=()=>{if(!quickRun){guidedHelp();return;}quickRun.paused=true;updatePauseButton();showDialog('<span class="pill">ROAD RUN</span><h2>Know the word. Make the move.</h2><p>Translate the English prompt. Each German answer is attached to a direction: <b>1 left, 2 forward, 3 right, 4 back</b>. Press its number, its arrow key, or tap its answer. A correct answer moves you immediately.</p><p>Cars, river currents, and trains keep moving while you answer. Watch the destination tile before jumping. River logs carry you; grass is safe. Red railway signals mean a train is coming.</p><p>Reach row 20 with three lives. A collision sends you to your last grassy checkpoint without forgetting words. Misses and timeouts show the answer and schedule another practice. First-time words pause the world until you are ready.</p><p>Press P or Space to pause. Untimed removes the answer deadline; traffic still moves. Guided lessons remain available for a calmer experience and course checkpoints.</p>');};

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
    state:'intro',word:null,choices:[],remaining:Infinity,limit:Infinity,road:makeRoad(),invulnerable:0};
  phase='quick';player={x:3,y:0};animatedHop=null;
  document.body.classList.add('quick-playing');
  document.querySelectorAll('[data-move]').forEach(b=>b.setAttribute('aria-label',{left:'1 — Left answer',up:'2 — Forward answer',right:'3 — Right answer',down:'4 — Back answer'}[b.dataset.move]));
  canvas.setAttribute('aria-label','Scrolling road with moving cars, river logs and trains. Answer with 1 left, 2 forward, 3 right, or 4 backward. P pauses.');
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
  if(!saved.memory[key]&&!r.introduced.has(key)){
    r.introduced.add(key);r.state='intro';r.limit=r.remaining=Infinity;
    $('lesson-content').innerHTML=`<span class="pill">NEW WORD · WORLD PAUSED</span><h2>${esc(r.word[0])}</h2><p class="quick-meaning">${esc(r.word[1])}</p><div class="word-intro"><div class="context">${esc(r.word[2])}<br><small>${esc(r.word[3])}</small></div></div><button class="outline" id="quick-listen">♪ Hear it</button><button class="primary" id="quick-ready">Ready. Let’s cross →</button>`;
    $('quick-listen').onclick=()=>speak(r.word[0]);$('quick-ready').onclick=showQuickQuestion;
    toast('New word · the world is paused.');
  }else showQuickQuestion();
  updateRunScore();
}
// Pick only legal neighbors. Favor progress, but keep side and backward answers
// meaningful; putting the right answer permanently on Forward defeats recall.
function chooseDirection(){
  const r=quickRun;
  let choices=DIRECTIONS.map((d,i)=>({i,x:player.x+d.dx,y:player.y+d.dy})).filter(p=>p.x>=0&&p.x<=6&&p.y>=0&&p.y<TERRAIN.length);
  const safe=choices.filter(p=>!unsafeAt(p.x,p.y,r.clock+.16));
  if(safe.length)choices=safe;
  const base=[.23,.42,.23,.12];
  const weights=choices.map(p=>base[p.i]/(1+(r.visits[`${Math.round(p.x)},${p.y}`]||0)*.3));
  let pick=Math.random()*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<choices.length;i++){pick-=weights[i];if(pick<=0)return choices[i].i;}
  return choices[choices.length-1].i;
}
function showQuickQuestion(){
  const r=quickRun;if(!r)return;
  const fromCard=r.state==='intro'||r.state==='correction';
  r.correctDirection=chooseDirection();
  const distractors=shuffle(r.pool.filter(w=>w[0]!==r.word[0])).slice(0,3).map(w=>w[0]);
  r.choices=DIRECTIONS.map((_,i)=>i===r.correctDirection?r.word[0]:distractors.pop());
  r.state='question';r.limit=r.remaining=quickLimit(r.word);r.last=performance.now();
  $('lesson-content').innerHTML=`<span class="pill">TRANSLATE TO MOVE</span><h2>“${esc(r.word[1])}”</h2><p class="run-hint">Find the German. Press its number to move.</p><div class="direction-answers">${DIRECTIONS.map((d,i)=>`<button class="answer direction-answer direction-${i}" data-quick-choice="${i}"><span class="direction-label"><kbd>${d.key}</kbd>${d.arrow} ${d.name}</span><strong>${esc(r.choices[i])}</strong></button>`).join('')}</div><div id="quick-feedback" class="feedback" aria-live="polite"></div>`;
  document.querySelectorAll('[data-quick-choice]').forEach(b=>b.onclick=()=>chooseQuick(Number(b.dataset.quickChoice)));
  $('game-status').textContent='1 ← · 2 ↑ · 3 → · 4 ↓ · P pause';
  toast('Answer to move. Watch the road.');
  if(fromCard)window.scrollTo?.({top:0,behavior:'instant'});
}
function chooseQuick(choice){
  const r=quickRun;if(!r||r.state!=='question'||r.paused||$('dialog').open||document.hidden)return;
  if(choice!==-1&&(!Number.isInteger(choice)||choice<0||choice>3))return;
  const correct=choice===r.correctDirection;r.total++;
  updateMemory(r.word,correct);
  if(!correct){
    r.streak=0;r.missed.add(memoryKey(r.word));
    if(!r.retry.some(v=>v.word===r.word))r.retry.push({word:r.word,at:r.total+2});
    showRoadCorrection(choice===-1?'Time’s up.':'Almost.',`${r.word[0]} = ${r.word[1]}`,false);
    return;
  }
  r.correct++;r.streak++;r.best=Math.max(r.best,r.streak);saved.xp+=10;save();
  const d=DIRECTIONS[choice], old={...player};
  player={x:Math.max(0,Math.min(6,player.x+d.dx)),y:Math.max(0,Math.min(TERRAIN.length-1,player.y+d.dy))};
  if(!reducedMotion)animatedHop={...old,started:performance.now()};hopTime=performance.now();
  r.visits[`${Math.round(player.x)},${player.y}`]=(r.visits[`${Math.round(player.x)},${player.y}`]||0)+1;
  r.furthest=Math.max(r.furthest,player.y);
  if(unsafeAt(player.x,player.y,r.clock)){roadCollision();return;}
  if(r.road[player.y].type==='grass'&&player.y>r.checkpoint.y)r.checkpoint={...player};
  if(player.y===TERRAIN.length-1){finishQuickRun(true);return;}
  r.state='hop';r.limit=r.remaining=160;
  document.querySelectorAll('[data-quick-choice]').forEach(b=>{b.disabled=true;if(Number(b.dataset.quickChoice)===choice)b.classList.add('correct');});
  $('quick-feedback').textContent=`Richtig! +10 XP · ${r.streak} streak`;
  toast(`${d.arrow} ${r.word[0]} · +10 XP`);updateRunScore();
}
function showRoadCorrection(title,detail,collision){
  const r=quickRun;r.state='correction';r.limit=r.remaining=Infinity;
  $('lesson-content').innerHTML=`<span class="pill">${collision?'CHECKPOINT RESCUE':'LEARN & KEEP MOVING'}</span><h2>${esc(title)}</h2><p class="quick-meaning">${esc(detail)}</p><div class="word-intro"><div class="context">${esc(r.word[2])}<br><small>${esc(r.word[3])}</small></div></div><p>The world is paused. ${collision?'Your vocabulary progress is safe.':'This word will return after two other answers.'}</p><button class="primary" id="quick-continue">Keep crossing →</button>`;
  $('quick-continue').onclick=()=>{if(r.lives<=0){finishQuickRun(false);return;}nextQuickWord();};
  toast(collision?'Back at your last grassy checkpoint.':'Read the correction. Then keep crossing.');updateRunScore();
}
function roadCollision(){
  const r=quickRun;if(!r||r.state==='correction'||r.state==='complete')return;
  r.lives--;r.streak=0;player={...r.checkpoint};animatedHop=null;r.invulnerable=r.clock+.35;
  if(r.lives<=0){finishQuickRun(false);return;}
  showRoadCorrection('Bump! Back to safety.',`${r.lives} lives left. Watch for a gap before your next hop.`,true);
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
  const r=quickRun;r.state='complete';r.limit=r.remaining=Infinity;updateRunScore();
  $('lesson-content').innerHTML=`<span class="pill">${won?'YOU MADE IT':'RUN FINISHED'}</span><h2>${won?'Across the whole world.':'Another road awaits.'}</h2><p>${r.correct} / ${r.total} answers correct · best streak ${r.best}<br>${r.furthest} rows reached · ${r.missed.size} words to revisit.</p><p>Road Run practices fast recognition. Guided recall checkpoints unlock new lessons.</p><button class="primary" id="quick-again">Run a new road →</button><button class="quiet" id="quick-guided">Continue guided lesson</button>`;
  $('quick-again').onclick=startQuickRun;$('quick-guided').onclick=()=>startLesson(lesson);
  toast(won?'Geschafft! You made it across.':'Your words are saved. Try a new road.');
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
    if(running&&['question','hop'].includes(r.state)){
      const worldScale=r.pace==='adaptive'&&quickLimit(r.word)>2000?.5:1;
      r.clock+=dt/1000*worldScale;
      const lane=r.road[player.y];
      if(lane.type==='river')player.x+=lane.speed*dt/1000*worldScale;
      if(r.clock>r.invulnerable&&unsafeAt(player.x,player.y,r.clock))roadCollision();
      if(['question','hop'].includes(r.state)&&Number.isFinite(r.remaining)){
        r.remaining=Math.max(0,r.remaining-dt);
        if(r.remaining===0){if(r.state==='question')chooseQuick(-1);else nextQuickWord();}
      }
    }
    const fraction=Number.isFinite(r.limit)?r.remaining/r.limit:1;
    $('quick-time-fill').style.width=`${Math.max(0,fraction)*100}%`;
    $('quick-time-fill').parentElement.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
    $('quick-time-label').textContent=r.paused?'Paused':r.state==='question'?(Number.isFinite(r.remaining)?`${(r.remaining/1000).toFixed(1)}s`:'Untimed · traffic moving'):r.state==='complete'?'Finished':'World paused';
    r.camera+=(Math.max(0,player.y-2)-r.camera)*Math.min(1,dt/130);
  }
  requestAnimationFrame(quickTick);
}
requestAnimationFrame(quickTick);
document.addEventListener('keydown',e=>{
  if(!quickRun||$('dialog').open||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.repeat)return;
  if(e.key===' '||e.key.toLowerCase()==='p'){e.preventDefault();toggleQuickPause();}
  else if(['1','2','3','4'].includes(e.key)){e.preventDefault();chooseQuick(Number(e.key)-1);}
  else if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();move({ArrowLeft:'left',ArrowUp:'up',ArrowRight:'right',ArrowDown:'down'}[e.key]);}
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
  iso=(x,y,z=0)=>({x:500+(x-3)*86+(y-r.camera-2)*22,y:height*.72-(y-r.camera)*rowStep+(x-3)*15-z});
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
    if(r.state==='question'){
      for(let i=0;i<4;i++){
        const d=DIRECTIONS[i],x=player.x+d.dx,y=player.y+d.dy;
        if(x<0||x>6||y<0||y>=TERRAIN.length)continue;
        const p=iso(x,y,5),danger=unsafeAt(x,y,r.clock);
        ctx.fillStyle=danger?'#ab493be8':'#fff9e8f2';ctx.beginPath();ctx.arc(p.x,p.y,15,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=danger?'#fff8e6':'#2e5037';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(d.key,p.x,p.y+5);ctx.textAlign='start';
      }
    }
  }finally{iso=originalIso;}
  return true;
}
