// Show only one page at a time
function showOnly(id) {
  var pages = ["splash", "createPage", "loginPage", "mainPage"];
  for (var i = 0; i < pages.length; i++) {
    var el = document.getElementById(pages[i]);
    if (el) el.style.display = "none";
  }
  var show = document.getElementById(id);
  if (show) show.style.display = "block";
}

// Start: show splash for 2 seconds, then Create Account
showOnly("splash");
setTimeout(function(){
  showOnly("createPage");
}, 2000);

// Go to Login
document.getElementById("goLogin").onclick = function(){
  showOnly("loginPage");
};

// Go to Forgot - for now back to Create
document.getElementById("goForgot").onclick = function(){
  alert("Forgot coming in next step");
};

// For now, Create and Login buttons go to Main
document.getElementById("createBtn").onclick = function(){
  showOnly("mainPage");
};
document.getElementById("loginBtn").onclick = function(){
  showOnly("mainPage");
};
