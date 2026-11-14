
// ========== MeetChat - app.js ==========
// 1. PUT YOUR FIREBASE CONFIG HERE - Get it from Firebase Console > Project Settings > Your apps > Web App
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "meetchat-cab0c.firebaseapp.com",
  databaseURL: "https://meetchat-cab0c-default-rtdb.firebaseio.com",
  projectId: "meetchat-cab0c",
  storageBucket: "meetchat-cab0c.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let me = JSON.parse(localStorage.getItem('meetchat_me') || 'null');
let currentChat = null, currentChatUser = null, callTimerInt = null, callSec = 0;
let ghost = localStorage.getItem('meetchat_ghost') === '1';
let lite = localStorage.getItem('meetchat_lite') === '1';

function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }
function showAuth(which){
  document.getElementById('loginForm').classList.toggle('hidden', which!=='login');
  document.getElementById('registerForm').classList.toggle('hidden', which!=='register');
  document.getElementById('forgotForm').classList.toggle('hidden', which!=='forgot');
  document.getElementById('tabLoginBtn').classList.toggle('active', which==='login');
  document.getElementById('tabRegBtn').classList.toggle('active', which==='register');
}
function showForgot(){ showAuth('forgot'); }

function uidFromUser(u){ return u.toLowerCase().replace(/[^a-z0-9]/g,'_'); }

function doRegister(){
  const user=document.getElementById('regUser').value.trim();
  const phone=document.getElementById('regCountry').value + document.getElementById('regPhone').value.trim().replace(/^0+/,'');
  const pass=document.getElementById('regPass').value;
  const q=document.getElementById('regQ').value;
  const a=document.getElementById('regA').value.trim();
  if(!user||!pass||!a||document.getElementById('regPhone').value.trim().length<9) return toast('Fill all fields correctly');
  const id=uidFromUser(user);
  db.ref('users/'+id).once('value', s=>{
    if(s.exists()) return toast('Username taken, try another');
    const data={username:user, phone, pass, q, a, name:user, about:'Hey there, I am using MeetChat', pic:'https://ui-avatars.com/api/?name='+encodeURIComponent(user)+'&background=0A2540&color=fff', online:true, lastseen:Date.now(), blue:false, blocked:[]};
    db.ref('users/'+id).set(data, ()=>{
      me={id,...data}; localStorage.setItem('meetchat_me', JSON.stringify(me));
      toast('Welcome to MeetChat, '+user); enterApp();
    });
  });
}
function doLogin(){
  const phone=document.getElementById('loginCountry').value + document.getElementById('loginPhone').value.trim().replace(/^0+/,'');
  const pass=document.getElementById('loginPass').value;
  if(!phone||!pass) return toast('Enter phone and password');
  db.ref('users').once('value', s=>{
    let found=null;
    s.forEach(c=>{ const v=c.val(); if(v.phone===phone && v.pass===pass) found={id:c.key, ...v}; });
    if(!found) return toast('Wrong phone or password');
    me=found; localStorage.setItem('meetchat_me', JSON.stringify(me));
    db.ref('users/'+me.id+'/online').set(true);
    toast('Welcome back '+me.username); enterApp();
  });
}
function doForgot(){
  const user=document.getElementById('forgotUser').value.trim();
  const ans=document.getElementById('forgotAns').value.trim();
  const np=document.getElementById('forgotNewPass').value;
  if(!user||!ans||!np) return toast('Fill all fields');
  const id=uidFromUser(user);
  db.ref('users/'+id).once('value', s=>{
    if(!s.exists()) return toast('User not found');
    const v=s.val();
    if(v.a.toLowerCase()!==ans.toLowerCase()) return toast('Wrong security answer');
    db.ref('users/'+id+'/pass').set(np, ()=>{ toast('Password changed! Login now'); showAuth('login'); });
  });
}
function enterApp(){
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainScreen').classList.remove('hidden');
  document.getElementById('myStatusLine').textContent = ghost ? 'Ghost Mode - Hidden' : 'Online';
  document.getElementById('ghostBadge').classList.toggle('hidden', !ghost);
  document.getElementById('ghostState').textContent = ghost ? 'On' : 'Off';
  document.getElementById('liteState').textContent = lite ? 'On' : 'Off';
  const pic = me.pic || '';
  document.getElementById('myAvatarTop').src = pic;
  document.getElementById('myStatusImg').src = pic;
  document.getElementById('setAvatar').src = pic;
  document.getElementById('setName').value = me.name || me.username;
  document.getElementById('setAbout').value = me.about || '';
  document.getElementById('setPic').value = me.pic || '';
  if(me.blue) document.getElementById('myStatusLine').textContent += ' ✓';
  renderChats(); renderUsers(); renderStatus();
}
function openTab(t){
  ['chats','add','settings'].forEach(x=>{
    document.getElementById('tab-'+x).classList.toggle('hidden', x!==t);
    document.getElementById('btn-'+x).classList.toggle('active', x===t);
  });
}
function renderChats(){
  const q=(document.getElementById('searchChat').value||'').toLowerCase();
  db.ref('users').once('value', s=>{
    let html='';
    s.forEach(c=>{
      const u={id:c.key, ...c.val()};
      if(u.id===me.id) return;
      if(q && !u.username.toLowerCase().includes(q) && !(u.name||'').toLowerCase().includes(q)) return;
      html+=`<div class="chat-item" onclick="openChat('${u.id}')"><img src="${u.pic}"><div class="flex1"><b>${u.name||u.username} ${u.blue?'✓':''}</b><small>${u.online && !ghost ? 'Online' : 'Last seen '+new Date(u.lastseen||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div><span>›</span></div>`;
    });
    document.getElementById('chatList').innerHTML = html || '<p style="padding:20px;text-align:center;color:#888">No chats yet. Go to Add Chat to find people.</p>';
  });
}
function renderUsers(){
  const q=(document.getElementById('searchUser').value||'').toLowerCase();
  db.ref('users').once('value', s=>{
    let html='';
    s.forEach(c=>{
      const u={id:c.key, ...c.val()};
      if(u.id===me.id) return;
      if(q && !u.username.toLowerCase().includes(q)) return;
      html+=`<div class="user-item"><img src="${u.pic}"><div class="flex1"><b>${u.name||u.username} ${u.blue?'✓':''}</b><small>@${u.username} • ${u.about||''}</small></div><button onclick="openChat('${u.id}')">Chat</button></div>`;
    });
    document.getElementById('userList').innerHTML = html || '<p style="padding:20px;text-align:center">No users found</p>';
  });
}
function renderStatus(){
  db.ref('status').once('value', s=>{
    let html='';
    s.forEach(c=>{
      const v=c.val();
      if(v.uid===me.id) return;
      html+=`<div class="status-item" onclick="viewStatus('${c.key}')"><img src="${v.pic}"><span>${v.username}</span></div>`;
    });
    document.getElementById('statusList').innerHTML = html;
  });
}
function addStatus(){
  const text = prompt('What is on your mind? Type your status text:');
  if(!text) return;
  const pic = prompt('Paste image link for status (optional, leave empty for text only):') || me.pic;
  db.ref('status/'+me.id).set({uid:me.id, username:me.username, pic, text, time:Date.now()}, ()=>{ toast('Status posted!'); renderStatus(); });
}
function viewStatus(id){
  db.ref('status/'+id).once('value', s=>{ if(s.exists()) alert(s.val().username+': '+s.val().text); });
}
function chatId(a,b){ return [a,b].sort().join('_'); }
function openChat(uid){
  db.ref('users/'+uid).once('value', s=>{
    currentChatUser={id:uid, ...s.val()}; currentChat=chatId(me.id, uid);
    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('chatWindow').classList.remove('hidden');
    document.getElementById('chatName').textContent=currentChatUser.name||currentChatUser.username;
    document.getElementById('chatAvatar').src=currentChatUser.pic;
    document.getElementById('chatPresence').textContent=currentChatUser.online?'Online':'Offline';
    listenMessages();
  });
}
function closeChat(){
  currentChat=null; currentChatUser=null;
  document.getElementById('chatWindow').classList.add('hidden');
  document.getElementById('mainScreen').classList.remove('hidden');
  renderChats();
}
function listenMessages(){
  db.ref('chats/'+currentChat).off();
  db.ref('chats/'+currentChat).on('value', s=>{
    const box=document.getElementById('messages'); let html='';
    s.forEach(c=>{
      const m=c.val(); const isMe=m.from===me.id;
      const time=new Date(m.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      let body = m.text ? `<div>${m.text}</div>` : '';
      if(m.type==='image') body=`<img src="${m.text}">`;
      if(m.type==='file') body=`<a href="${m.text}" target="_blank">📎 View File</a>`;
      html+=`<div class="msg ${isMe?'me':''}">${body}<small>${time} ${isMe?'✓✓':''}</small></div>`;
    });
    box.innerHTML=html || '<p style="text-align:center;color:#888">Say hi 👋</p>';
    box.scrollTop=box.scrollHeight;
  });
}
function sendMessage(){
  const inp=document.getElementById('msgInput'); const text=inp.value.trim(); if(!text||!currentChat) return;
  const dis=parseInt(document.getElementById('disappearSelect').value||'0');
  const ref=db.ref('chats/'+currentChat).push();
  const msg={from:me.id, to:currentChatUser.id, text, type:'text', time:Date.now()};
  ref.set(msg); inp.value='';
  if(dis>0) setTimeout(()=>ref.remove(), dis*1000);
}
function sendFile(el){
  const f=el.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const isImg=f.type.startsWith('image/');
    db.ref('chats/'+currentChat).push({from:me.id, to:currentChatUser.id, text:e.target.result, type:isImg?'image':'file', time:Date.now()});
    toast('File sent');
  };
  reader.readAsDataURL(f);
}
function sendTyping(){ if(currentChat) db.ref('typing/'+currentChat+'/'+me.id).set(Date.now()); }
function insertEmoji(e){ document.getElementById('msgInput').value+=e; }
function toggleVoice(){ toast('Hold to record voice - coming in next update, use text for now'); }
function toggleBlock(){ if(!currentChatUser) return; toast('User blocked / unblocked'); }
function saveProfile(){
  const name=document.getElementById('setName').value.trim();
  const about=document.getElementById('setAbout').value.trim();
  const pic=document.getElementById('setPic').value.trim() || me.pic;
  db.ref('users/'+me.id).update({name, about, pic}, ()=>{
    me.name=name; me.about=about; me.pic=pic; localStorage.setItem('meetchat_me', JSON.stringify(me));
    toast('Profile saved'); enterApp();
  });
}
function setTheme(t){ document.body.classList.toggle('dark', t==='dark'); toast(t==='dark'?'Dark Blue Mode':'White Mode'); }
function toggleLite(){ lite=!lite; localStorage.setItem('meetchat_lite', lite?'1':'0'); document.getElementById('liteState').textContent=lite?'On':'Off'; toast(lite?'Lite Mode ON - Data Saver':'Lite Mode OFF'); }
function toggleGhost(){ ghost=!ghost; localStorage.setItem('meetchat_ghost', ghost?'1':'0'); toast(ghost?'Ghost Mode ON - You are hidden':'Ghost Mode OFF'); enterApp(); }
function togglePrivacy(k){ toast('Privacy updated'); }
function showBlocked(){ toast('No one blocked you'); }
function toggleAppLock(){ toast('App Lock - Pattern lock coming next update'); }
function switchAccount(){ localStorage.removeItem('meetchat_me'); location.reload(); }
function buyBlueTick(){ const ok=confirm('Get Blue Tick for MeetChat? Pay with MTN MoMo / Airtel Money. Continue?'); if(ok) toast('Payment - Send to INNO MoMo, then send screenshot. Tick will be added by Admin'); }
function shareApp(){ const url=location.href; if(navigator.share) navigator.share({title:'MeetChat', text:'Join me on MeetChat', url}); else { prompt('Copy this link and share:', url); } }
function startCall(type){
  if(!currentChatUser) return;
  document.getElementById('callScreen').classList.remove('hidden');
  document.getElementById('callName').textContent=currentChatUser.name||currentChatUser.username;
  document.getElementById('callAvatar').src=currentChatUser.pic;
  document.getElementById('callStatus').textContent= type==='video' ? 'Video Call Ringing...' : 'Voice Call Ringing...';
  callSec=0; callTimerInt=setInterval(()=>{ callSec++; const m=String(Math.floor(callSec/60)).padStart(2,'0'); const s=String(callSec%60).padStart(2,'0'); document.getElementById('callTimer').textContent=m+':'+s; },1000);
}
function acceptCall(){ document.getElementById('callStatus').textContent='Connected...'; toast('Call connected (Demo - real voice in next update)'); }
function endCall(){ clearInterval(callTimerInt); document.getElementById('callScreen').classList.add('hidden'); toast('Call ended'); }
function logout(){ if(confirm('Log out of MeetChat?')){ db.ref('users/'+me.id+'/online').set(false); localStorage.removeItem('meetchat_me'); location.reload(); } }
window.addEventListener('online', ()=>{ document.getElementById('offlineBar').classList.add('hidden'); toast('Back online'); });
window.addEventListener('offline', ()=>{ document.getElementById('offlineBar').classList.remove('hidden'); });
window.addEventListener('beforeunload', ()=>{ if(me && !ghost) db.ref('users/'+me.id).update({online:false, lastseen:Date.now()}); });

// Splash + Start
let w=0; const si=setInterval(()=>{ w+=20; document.getElementById('splashFill').style.width=w+'%'; if(w>=100){ clearInterval(si); document.getElementById('splash').style.display='none'; if(me){ enterApp(); } else { document.getElementById('authScreen').classList.remove('hidden'); } } },200);
