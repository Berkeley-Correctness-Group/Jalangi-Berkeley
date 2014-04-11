var global;

function foo() {
  global = 34;
}

function sayHello() {
  console.log("Hello world");
  foo();
  return 23;
}
  
function bar() {
  return global;
}

sayHello();
setTimeout(bar, 0);


var x = { n: Number.NaN};
console.log(x.n);

eval("console.log('evaled code is running'); y = x.n;");



//console.log("hi there");
