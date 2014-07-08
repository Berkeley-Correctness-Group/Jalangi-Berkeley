var script = document.createElement("script");
script.src = "script.js";
script.onload = function() {
  alert("Script loaded");
};
document.getElementsByTagName('head')[0].appendChild(script);