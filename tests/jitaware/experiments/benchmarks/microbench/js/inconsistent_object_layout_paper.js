function C(i) {
  if (i % 2 === 0) {
    this.a = Math.random();
    this.b = Math.random();
  } else {
    this.b = Math.random();
    this.a = Math.random();
  }
}
function sum(base, p1, p2) {
  return base[p1] + base[p2];
}
for(var i=1;i<100000;i++) {
  sum(new C(i), 'a', 'b');
}
