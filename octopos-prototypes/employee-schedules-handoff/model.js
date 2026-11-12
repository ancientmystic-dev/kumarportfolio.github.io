/* OctoPOS schedule model · prototype only. All times below are location-local minutes.
   Production adapters must provide date + IANA zone + authoritative schedule/timecard IDs. */
(function(global){'use strict';
const palette=[['Blue','#5477b2','#e4ebf7'],['Emerald','#418773','#e0f1e9'],['Violet','#8d649f','#eee4f2'],['Copper','#a77147','#f3e7db'],['Steel','#4d7e97','#e1edf2'],['Berry','#9a617c','#f2e3eb'],['Olive','#7b7f4f','#edf0df'],['Indigo','#646e9c','#e5e8f4'],['Teal','#398789','#dff0ef'],['Ochre','#927438','#f3eddc'],['Sage','#5e8a60','#e5f0e4'],['Plum','#866b94','#eee7f1']];
const names=['Alice Green','Emma Watson','Michael Smith','David Lee','Sophia Johnson','Nova Clark','Olivia Brown','Liam Paine','Mia Chen','Sarah James','Ethan Davis','Ava Reed'];
const extra=['Isabella Ruiz','James Okafor','Charlotte Diaz','Benjamin Whitaker','Amelia Petrova','Elijah Adeyemi','Harper Liu','Henry Morales','Evelyn Bennett','Alexander Price','Abigail Tran','Daniel Rossi','Sofia Novak','Matthew Coleman','Emily Grant','Logan Shah','Lily Hayes','Jackson Delgado','Ella Brooks','Sebastian Nguyen','Grace Farouk','Owen Lind','Chloe Turner','Mason Haddad','Ella Rivera','Leo Hassan','Aria Park','Oliver Adams','Chloe Silva','Theo Kim','Maya Brooks','Finn Ali','Ruby Wilson','Oscar Cruz','Iris Evans','Luca Ramos','Nora King','Felix Cole','Lila Morgan','Adam Tran','Zara Bell','Hugo Reed','Nina Kapoor','Miles Wood','Freya Lin','Isaac Fox','Ada Walsh','Louis Grant','Luna Nair','Arlo Scott','Jade Wang','Ezra Carter','Rose Singh','Eli James','Clara Lewis','Omar Chen','Stella Hall','Kai Young','Lucy Baker','Max Allen'];
const roles=[['Cashier'],['Cashier','Shift Lead'],['Stock'],['Cashier'],['Shift Lead','Cashier'],['Stock'],['Cashier'],['Cashier','Stock'],['Cashier'],['Stock'],['Manager'],['Shift Lead']];
const defaultEmployees=names.concat(extra).map((name,i)=>({id:'e'+(i+1),name,roles:roles[i%12],wage:i%12===10?29:i%12===4?24:20,locations:['grocery','corner'],color:i%12}));
const locations={grocery:{id:'grocery',name:'Grocery Mart',timezone:'America/Phoenix',open:420,close:1260},corner:{id:'corner',name:'Corner Store',timezone:'America/Phoenix',open:480,close:1200}};
const today='2026-11-10',now=810,anchor='2026-11-09';
const pad=n=>String(n).padStart(2,'0');
const date=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d,12))};
const key=d=>d.toISOString().slice(0,10);
const add=(s,n)=>{let d=date(s);d.setUTCDate(d.getUTCDate()+n);return key(d)};
const weekday=s=>date(s).getUTCDay();
const weekStart=s=>add(s,-((weekday(s)+6)%7));
const week=s=>Array.from({length:7},(_,i)=>add(s,i));
const formatDate=(s,opts={weekday:'short',month:'short',day:'numeric'})=>date(s).toLocaleDateString('en-US',{...opts,timeZone:'UTC'});
const time=(m,full=true)=>{if(m===1440)return '12:00 AM (+1 day)';return `${Math.floor(m/60)%12||12}${full?':'+pad(m%60):m%60?':'+pad(m%60):''} ${m<720?'AM':'PM'}`};
const inputTime=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const parseTime=s=>{if(!/^\d{2}:\d{2}$/.test(s||''))return NaN;let[h,m]=s.split(':').map(Number);return h<24&&m<60?h*60+m:NaN};
const dur=m=>m===0?'0m':`${Math.floor(m/60)?Math.floor(m/60)+'h':''}${m%60?(Math.floor(m/60)?' ':'')+m%60+'m':''}`;
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
const overlaps=(a,b)=>a.start<b.end&&b.start<a.end;
const unique=a=>[...new Set(a)];
function createState(){return{view:'week',week:anchor,day:today,location:'grocery',team:12,scenario:'normal',role:'',query:'',filtersOpen:false,highlights:[],colorOverrides:{},nameOverrides:{},newEmployees:[],overrides:{},added:[],removed:[],recurring:[],timecards:{},closedGroups:[],showFree:false,showOff:true,closureOverrides:[],removedClosures:[],audit:[],permission:'owner'};}
function employees(s,all=false){let data=defaultEmployees.slice(0,all?72:s.team).concat(s.newEmployees||[]).map(e=>({...e,name:s.nameOverrides[e.id]||e.name,color:s.colorOverrides[e.id]??e.color}));if(s.scenario==='noemployees')data=[];return data;}
function emp(s,id){return employees(s,true).find(e=>e.id===id)||{id,name:'Former employee',roles:[],wage:0,color:0,locations:[]};}
function people(s,filtered=true){return employees(s).filter(e=>e.locations.includes(s.location)&&(!filtered||(!s.role||e.roles.includes(s.role))&&(!s.query||e.name.toLowerCase().includes(s.query.toLowerCase()))));}
function closures(s){return [{id:'maintenance',date:'2026-11-12',name:'Maintenance day',location:'grocery',annual:false},{id:'sunday',date:'2026-11-15',name:'Store holiday',location:'grocery',annual:true},...s.closureOverrides].filter(c=>!s.removedClosures.includes(c.id));}
function closure(s,day){return closures(s).find(c=>c.location===s.location&&(c.date===day||(c.annual&&day>=c.date&&day.slice(5)===c.date.slice(5))));}
function timeOff(s,day){if(s.scenario==='noemployees'||s.scenario==='emptyweek'||s.scenario==='nosetup')return[];let result=[];if(weekday(day)===3)result.push({emp:'e9',start:0,end:1440,label:'Time off · all day'});if(weekday(day)===5)result.push({emp:'e12',start:420,end:720,label:'Time off · 7:00 AM–12:00 PM'});return result.filter(o=>people(s,false).some(e=>e.id===o.emp));}
const plannedBreaks=duration=>duration>=360?[{name:'Rest',duration:15,paid:true,after:120},{name:'Lunch',duration:30,paid:false,after:240}]:duration>=180?[{name:'Rest',duration:15,paid:true,after:120}]:[];
function seed(s,day){if(['nosetup','emptyweek','noemployees','disabled'].includes(s.scenario))return[];let res=[],wd=weekday(day),loc=locations[s.location];
 const patterns=wd===2?[[420,780],[840,1260],[540,780],[1020,1260]]:wd===3?[[480,840],[960,1260]]:wd===5?[[420,780],[840,1260],[540,1020]]:[[540,1020],[600,1080],[720,1200],[960,1260]];
 people(s,false).forEach((e,i)=>{if((wd+i)%14===0||i%12===11&&wd!==5)return;if(timeOff(s,day).some(o=>o.emp===e.id&&o.start===0))return;
 let p=patterns[Math.floor(i/3)%patterns.length],start=p[0],end=p[1],type=wd===3&&Math.floor(i/3)%2===0?'one-time':'scheduled';if(closure(s,day)&&type==='scheduled')return;
 if(wd===2){if(i<3){start=840;end=1260;}else if(i<6){start=420;end=780;}else if(i<8){start=540;end=780;}else if(i<11){start=1020;end=1260;}}
 if(s.location==='corner'){start=Math.max(480,start+60);end=Math.min(1200,end);if(i%2===0)return;}
 if(timeOff(s,day).some(o=>o.emp===e.id&&overlaps({start,end},o))){start=780;end=Math.max(end,1020);}
 if(s.scenario==='staggered'){start+=i%6*5;end-=i%4*10;}
 if(s.scenario==='historical'&&i===2&&day>='2026-11-11')return;
 if(s.scenario==='historical'&&i===5&&s.location==='grocery'&&day>='2026-11-11')return;
 let id=`${s.location}:${day}:${e.id}`,shift={id,day,emp:e.id,location:s.location,start,end,type,source:type==='one-time'?'manual':'usual',plannedBreaks:plannedBreaks(end-start)};
 s.recurring.filter(r=>r.emp===e.id&&r.location===s.location&&r.weekday===wd&&day>=r.from&&day>=today&&type==='scheduled').forEach(r=>{shift={...shift,start:r.start,end:r.end,plannedBreaks:r.plannedBreaks};});res.push(shift);
 });
 if(s.scenario==='short'&&wd===4&&!closure(s,day)){} // inserted after closure handling below
 if(s.scenario==='short'&&wd===3){res=res.filter(x=>!['e1','e2','e3','e4','e5','e6'].includes(x.emp));const tests=[['e1',600,615],['e2',600,615],['e3',615,640],['e4',625,630],['e5',635,660],['e6',1230,1255]];tests.forEach(([id,a,b],i)=>{if(emp(s,id)&&people(s,false).some(e=>e.id===id))res.push({id:`${s.location}:${day}:${id}:short`,day,emp:id,location:s.location,start:a,end:b,type:i===3?'one-time':'scheduled',source:'demo',plannedBreaks:[]});});}
 if(s.scenario==='closurework'&&closure(s,day)&&weekday(day)===4){res.push({id:'closure-exception',day,emp:'e1',location:s.location,start:600,end:720,type:'one-time',source:'manual',plannedBreaks:[]});}
 if(s.scenario==='edgehours'&&wd===3){res=res.filter(x=>x.emp!=='e1'&&x.emp!=='e2');res.push({id:'early-shift',day,emp:'e1',location:s.location,start:30,end:210,type:'one-time',source:'manual',plannedBreaks:[]},{id:'late-shift',day,emp:'e2',location:s.location,start:1320,end:1439,type:'one-time',source:'manual',plannedBreaks:[]});}
 return res;
}
function shifts(s,day,filtered=false){let result=seed(s,day).concat(s.added.filter(x=>x.day===day&&x.location===s.location)).filter(x=>!s.removed.includes(x.id)).map(x=>({...x,...(s.overrides[x.id]||{})}));if(filtered){let ids=new Set(people(s).map(x=>x.id));result=result.filter(x=>ids.has(x.emp));}return result.sort((a,b)=>a.start-b.start||emp(s,a.emp).name.localeCompare(emp(s,b.emp).name));}
function findShift(s,id){for(const day of week(s.week).concat([s.day])){let item=shifts(s,day).find(x=>x.id===id);if(item)return item;}return s.added.find(x=>x.id===id);}
function groups(s,day){const map=new Map();shifts(s,day,true).forEach(x=>{let k=`${x.start}|${x.end}|${x.type}`;if(!map.has(k))map.set(k,{key:k,start:x.start,end:x.end,type:x.type,items:[]});map.get(k).items.push(x);});return [...map.values()].sort((a,b)=>a.start-b.start||b.end-a.end);}
function getTimecard(s,x){if(s.timecards[x.id])return s.timecards[x.id];let complete=x.day<today||x.day===today&&x.end<=now;if(!complete)return null;
 let sessions=[{start:x.start,end:x.end,auto:false}],breaks=[];if(x.end-x.start>=360)breaks=[{name:'Rest',start:x.start+135,end:x.start+150,paid:true,paidAllowance:15,source:'pos'},{name:'Lunch',start:x.start+240,end:x.start+270,paid:false,source:'pos'}];
 if(x.emp==='e1'&&x.day===anchor){sessions[0].start+=17;}
 if(x.emp==='e2'&&x.day===anchor){sessions=[{start:x.start,end:780,auto:false},{start:900,end:x.end,auto:false}];breaks=breaks.filter(b=>sessions.some(w=>b.start>=w.start&&b.end<=w.end));}
 let report=null;if(x.emp==='e4'&&x.day===anchor){sessions[0].end=x.end+30;sessions[0].auto=true;report={after:x.end+30,reportedAt:1204,resolved:false};}
 if(x.emp==='e3'&&x.day===anchor){sessions[0].end-=20;}
 if(x.emp==='e8'&&x.day===anchor)return{sessions:[],breaks:[],missing:true,report:null};
 return{sessions,breaks,report,missing:false};}
function attendance(s,x){const tc=getTimecard(s,x);if(!tc)return{kind:'none',flags:[],text:'Scheduled shift'};if(tc.missing||!tc.sessions.length)return{kind:'review',flags:['No clock-in or clock-out recorded'],text:'Missing time record'};let flags=[],first=Math.min(...tc.sessions.map(t=>t.start)),last=Math.max(...tc.sessions.map(t=>t.end));let a=first-x.start,b=last-x.end;
 if(Math.abs(a)>15)flags.push(`Clocked in ${dur(Math.abs(a))} ${a>0?'late':'early'}`);
 if(Math.abs(b)>15)flags.push(`Clocked out ${dur(Math.abs(b))} ${b>0?'late':'early'}`);
 if(tc.report&&!tc.report.resolved)return{kind:'review',flags,text:`Worked past ${time(tc.report.after)} · reported at ${time(tc.report.reportedAt)}`};
 return{kind:flags.length?'flag':'ok',flags,text:flags.join(' · ')||'Recorded within the attendance window'};}
const canEdit=x=>x.day>today||x.day===today&&x.start>now;
function breakAllocation(b){let duration=Number.isFinite(b.end-b.start)?Math.max(0,b.end-b.start):0,paid=b.paid?(b.source==='manual'?duration:Math.min(duration,b.paidAllowance??duration)):0;return{duration,paid,unpaid:duration-paid};}
function totals(s,x,actual=false){if(!actual){const unpaid=x.plannedBreaks.filter(b=>!b.paid).reduce((a,b)=>a+b.duration,0);return{paid:Math.max(0,x.end-x.start-unpaid),unpaid,breakPaid:x.plannedBreaks.filter(b=>b.paid).reduce((a,b)=>a+b.duration,0),span:x.end-x.start};}const tc=getTimecard(s,x)||{sessions:[],breaks:[]};let span=tc.sessions.reduce((a,b)=>a+b.end-b.start,0),unpaid=tc.breaks.reduce((a,b)=>a+breakAllocation(b).unpaid,0),paidBreak=tc.breaks.reduce((a,b)=>a+breakAllocation(b).paid,0);return{span,unpaid,breakPaid:paidBreak,paid:Math.max(0,span-unpaid)};}
function aggregate(s,arr){return arr.reduce((a,x)=>{const p=totals(s,x).paid;return{minutes:a.minutes+p,cost:a.cost+p/60*emp(s,x.emp).wage};},{minutes:0,cost:0});}
function gaps(s,day){if(closure(s,day)||s.scenario==='nosetup'||s.scenario==='disabled')return[];let l=locations[s.location],intervals=shifts(s,day).filter(x=>!s.role||emp(s,x.emp).roles.includes(s.role)).map(x=>({start:Math.max(l.open,x.start),end:Math.min(l.close,x.end)})).filter(x=>x.end>x.start).sort((a,b)=>a.start-b.start);let cursor=l.open,out=[];for(let r of intervals){if(r.start>cursor)out.push({start:cursor,end:r.start});cursor=Math.max(cursor,r.end);}if(cursor<l.close)out.push({start:cursor,end:l.close});return out;}
function bounds(s,day){let days=day?[day]:week(s.week),arr=days.flatMap(d=>shifts(s,d)),l=locations[s.location];return{start:Math.max(0,Math.floor(Math.min(l.open,...arr.map(x=>x.start))/60)*60),end:Math.min(1440,Math.ceil(Math.max(l.close,...arr.map(x=>x.end))/60)*60+60)};}
function shiftValidation(s,x,except){let errors=[],warnings=[];if(!Number.isFinite(x.start)||!Number.isFinite(x.end))errors.push('Enter a start and end time.');else if(x.end<=x.start)errors.push('End time must be after start time. Overnight schedules aren’t supported.');else{if(x.end>1440)errors.push('The shift must end on the same day.');if(x.end-x.start>720)warnings.push('This shift is longer than 12 hours. Check the times.');let conflicts=shifts(s,x.day).filter(z=>z.emp===x.emp&&z.id!==except&&overlaps(z,x));if(conflicts.length)errors.push(`This employee already has a shift at ${time(conflicts[0].start)}–${time(conflicts[0].end)}.`);let l=locations[s.location];if(x.start<l.open||x.end>l.close)warnings.push('This shift is outside store opening hours.');if(closure(s,x.day))warnings.push('The store is closed. This will be saved as a one-time shift.');if(timeOff(s,x.day).some(t=>t.emp===x.emp&&overlaps(t,x)))warnings.push('This shift overlaps the employee’s time off. Confirm their availability.');for(let b of x.plannedBreaks){if(b.after>=x.end-x.start)errors.push(`${b.name} is available after ${dur(b.after)}, but this shift is only ${dur(x.end-x.start)}.`);else if(b.after+b.duration>x.end-x.start)warnings.push(`${b.name} may extend past the shift end.`);}if(x.plannedBreaks.reduce((a,b)=>a+b.duration,0)>x.end-x.start)errors.push('Total break time can’t exceed the shift duration.');}return{errors,warnings};}
function timecardValidation(tc){let err=[];let sessions=tc.sessions.slice().sort((a,b)=>a.start-b.start);if(!sessions.length)return['Add at least one work session.'];sessions.forEach((x,i)=>{if(!Number.isFinite(x.start)||!Number.isFinite(x.end)||x.end<=x.start)err.push('Enter valid clock-in and clock-out times.');if(i&&x.start<sessions[i-1].end)err.push('Work sessions can’t overlap.');});let breaks=tc.breaks.slice().sort((a,b)=>a.start-b.start);breaks.forEach((x,i)=>{if(x.end<=x.start||!Number.isFinite(x.start)||!Number.isFinite(x.end))err.push('Break end time must be after its start.');if(!sessions.some(w=>x.start>=w.start&&x.end<=w.end))err.push(`${x.name} must fall within one work session.`);if(i&&x.start<breaks[i-1].end)err.push('Breaks can’t overlap.');});return unique(err);}
const api={palette,locations,today,now,anchor,createState,employees,people,emp,closures,closure,timeOff,shifts,findShift,groups,getTimecard,attendance,canEdit,breakAllocation,totals,aggregate,gaps,bounds,shiftValidation,timecardValidation,plannedBreaks,date,key,add,weekday,weekStart,week,formatDate,time,inputTime,parseTime,dur,money,overlaps,unique};global.ScheduleModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
