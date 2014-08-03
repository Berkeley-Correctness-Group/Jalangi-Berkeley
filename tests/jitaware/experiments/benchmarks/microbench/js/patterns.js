/*
 * Copyright 2014 University of California, Berkeley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Liang Gong, Michael Pradel

var sum = 0;

function pattern1_orig() {
  function Thing(i) {
    var m = i%6;
    if (m === 0) {
      this.a = Math.random();
      this.b = Math.random();
      this.c = Math.random();
    } else if (m === 1) {
      this.a = Math.random();
      this.c = Math.random();
      this.b = Math.random();
    } else if (m === 2) {
      this.b = Math.random();
      this.a = Math.random();
      this.c = Math.random();
    } else if (m === 3) {
      this.b = Math.random();
      this.c = Math.random();
      this.a = Math.random();
    } else if (m === 4) {
      this.c = Math.random();
      this.a = Math.random();
      this.b = Math.random();
    } else {
      this.c = Math.random();
      this.b = Math.random();
      this.a = Math.random();
    }   
  }
    function getSum(base, prop1, prop2, prop3) {
        return base[prop1] + base[prop2] + base[prop3];
    }
    sum = 0;
    for (var i = 0; i < 3000000; i++) {
        sum += getSum(new Thing(i), 'a', 'b', 'c');
    }
}

function pattern1_fix() {
    function Thing(i) {
    var m = i%6;
    if (m === 0) {
      this.a = Math.random();
      this.b = Math.random();
      this.c = Math.random();
    } else if (m === 1) {
      this.a = Math.random();
      this.b = Math.random();
      this.c = Math.random();
    } else if (m === 2) {
      this.a = Math.random();
      this.b = Math.random();
      this.c = Math.random();
    } else if (m === 3) {
      this.a = Math.random();
      this.b = Math.random();
      this.c = Math.random();
    } else if (m === 4) {
      this.a = Math.random();
      this.b = Math.random();
      this.c = Math.random();
    } else {
      this.a = Math.random();
      this.b = Math.random();
      this.c = Math.random();
    }   
    }
    function getSum(base, prop1, prop2, prop3) {
        return base[prop1] + base[prop2] + base[prop3];
    }
    sum = 0;
    for (var i = 0; i < 3000000; i++) {
        sum += getSum(new Thing(i), 'a', 'b', 'c');
    }
}

//////////////////// pattern-2 ////////////////////
// polymorphic operations

function pattern2_orig() {
    function f(a, b) {
        return a + b;
    }
    for (var i = 0; i < 5000000; i++) {
        var arg1, arg2;
        if (i % 2 === 0) {
            arg1 = 1; arg2 = 2;
        } else {
            arg1 = 'a';
            arg2 = 'b';
        }
        f(arg1, arg2);	 // function can be called with different types of parameters
    }
}



function pattern2_fix() {
    function g(a, b) {
        return a + b;
    }

    function f(a, b) {
        return a + b;
    }
    for (var i = 0; i < 5000000; i++) {
        var arg1, arg2;
        if (i % 2 === 0) {
            arg1 = 1; arg2 = 2;
            f(arg1, arg2);
        } else {
            arg1 = 'a';
            arg2 = 'b';
            g(arg1, arg2);
        }
    }
}


function pattern3_orig() {
  for (var j = 0; j < 400; j++) {
    var array = [];
    for (var i = 5000; i >=0; i--) { // initializing array in reverse order makes the array non-contiguous 
      array[i] = i;
    }
  }
}

function pattern3_fix() {
  for (var j = 0; j < 400; j++) {
    var array = [];
    for (var i = 0; i <= 5000; i++) {
      array[i] = i;
    }
  }
}

//////////////////// pattern-4 ////////////////////
// accessing uninitialized or deleted array elements

function pattern4_orig() {
    var array = [];
    for (var i = 0; i < 100; i++)
        array[i] = 1;
    for (var j = 0; j < 100000; j++) {
        var ij = 0;
        var len = array.length;
        var sum = 0;
        while (array[ij]) { // accessing non-numeric value in the last round, very slow
            ij++;
        }
    }
}

function pattern4_fix() {
    var array = [];
    for (var i = 0; i < 100; i++)
        array[i] = 1;
    for (var j = 0; j < 100000; j++) {
        var ij = 0;
        var len = array.length;
        var sum = 0;
        while (ij < len) {
            array[ij];
            ij++;
        }
    }
}

//////////////////// pattern-5 ////////////////////
// storing non-numeric values in numeric arrays

var globalarray1, globalarray2;
function pattern5_orig() {
    for (var j = 0; j < 200; j++) {
        var array = [];
        for (var i = 0; i < 100000; i++)
            array[i] = i/10;
        array[4] = "aaa"; // array data structure switched to accommodate double value
        array[4] = 1.23;
        globalarray1 = array;
    }
}

function pattern5_fix() {
    for (var j = 0; j < 200; j++) {
        var array = [];
        for (var i = 0; i < 100000; i++)
            array[i] = i/10;
        array[4] = 3;
        array[4] = 1.23;
        globalarray2 = array;
    }
}


//////////////////// pattern-6 ////////////////////
// binary operation on undefined

function pattern6_orig() {
    var x, y;
    for(var i=0;i<30000000;i++){
        y = x | 2;
    }
}

function pattern6_fix() {
    var x = 0, y;
    for(var i=0;i<30000000;i++){
        y = x | 2;
    }
}
