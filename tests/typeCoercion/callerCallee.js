// Author: Michael Pradel

function f1() {
    f2();
}

function f2() {
    g();
    h();
}

function g() {
    var x = x | 0;
}

function h() {
    var y = y | 0;
}

f1();
