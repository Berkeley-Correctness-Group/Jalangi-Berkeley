/*
 * Copyright 2014 University of California, Berkeley.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Liang Gong

// test case 1 checking the following optimization rule
// monomorphic use of operations is preferred over polymorphic operations
console.log('------------------ test case 1 ------------------');
var obj1 = {
    field_a : "value_a",
    field_b : "value_b"
};
var obj2 = {
    field_a : "value_b",
    field_c : "value_b"
};
var obj3 = {
    field_c : "value_b",
    field_d : "value_b"
};
var obj4 = {
    field_a : "value_b1",
    field_b : "value_b2",
    field_c : "value_c"
};
var obj5 = {
    field_b : "value_b",
    field_a : "value_a"
};
obj5.test = 'test field';

function con1(a, b) {
    this.field_a = a;
    this.field_b = b;
}

function getField(obj) {
    console.log('getting field_a from ' + JSON.stringify(obj));
    return obj.field_a;
}

getField(obj1);
getField(obj2);
getField(obj3);
getField(obj4);
getField(obj5);

// created from different constructor, this leads to a new hidden class
getField(new con1('value_a', 'value_b'));

function Cat() {
    this.age = 2;
};
var cat1 = new Cat();
var cat2 = new Cat();

// here changes the prototype reference of object date3,
// this leads to a new hidden class because the __proto__ in a hidden class is immutable
var tmpProto = Cat.prototype;
Cat.prototype = {};
var cat3 = new Cat();
Cat.prototype = tmpProto;

function getField2(obj) {
    console.log('getting toJSON from ' + JSON.stringify(obj));
    return obj.age;
}

getField2(cat1);
getField2(cat2);
getField2(cat3);

// test case 2 checking the following optimization rule
// use contiguous keys statrting at 0 for Arrays
console.log('------------------ test case 2 ------------------');
var array = [];
console.log('accessing array contiguously');
array[0] = 1;
array[1] = 2;
array[2] = 3;
array[1] = 123;

console.log('accessing array incontiguously');
array[10] = 14;
console.log('accessing array incontiguously (2)');
array[118] = 1123;

function loadElement(arr, index) {
    return arr[index]
}

// test case 3 checking the following optimization rule
// Do not load uninitialized or deleted elements
console.log('------------------ test case 3 ------------------');
var array2 = [1, 2, 3, undefined, 4, 5, 6];
console.log('load initialized array elements');
var test = array2[3];
console.log('load initialized array elements');
test = array2[4];

delete array2[0];
console.log('load deleted array elements');
test = array2[0];

delete array2[6];
console.log('load deleted array elements (2)');
test = array2[6];

console.log('load uninitialized array elements');
test = array2[200];

console.log('load uninitialized array elements (in function)');
loadElement(array2, 201);
loadElement(array2, 202);

// test case 4 checking the following optimization rule
// Do not store non-numeric values (objects) in numeric arrays
console.log('------------------ test case 4 ------------------');
var array3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
console.log('store numeric values into numeric array');
array3[2] = 100;
array3[1] = 12;
console.log('store non-numeric value into numeric array (string)');
array3[3] = "non-numeric value";

var array4 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
console.log('store non-numeric value into numeric array (object)');
array4[4] = {};
console.log('store non-numeric value into numeric array (Date)');
array3[5] = new Date();
console.log('store non-numeric value into numeric array (boolean)');
array3[6] = true;

// test case 5 checking the following optimization rule
// Initialize all object memebers in constructor functions (so that the instances do not change the type later)
console.log('------------------ test case 5 ------------------');

var objanother = {};
function Constructor1() {
    this.field1 = 1;
    this.field2 = 13;
    this.field4 = 'test';
    console.log('initialize object2 member in obj1\'s constructor function');
    objanother.field4 = 'test';
}

var con_obj1 = new Constructor1();
var con_obj2 = new Constructor1();

console.log('initialize object member in non constructor function');
con_obj2.field5 = 123;

console.log('set object member in non constructor function call');
var con_obj3 = Constructor1();

// test case 6 checking the polymorphic constructor
console.log('------------------ test case 6 ------------------');
function Node(flag){
    if(flag){
        this.left = 1;
        this.right = 2;
    } else {
        this.right = 1;
        this.left = 2;
    }
}

console.log('constructor creating polymorphic objects');
var node1 = new Node(true);
var node2 = new Node(false);


// test case 7 checking binary operation on undefined values
console.log('------------------ test case 7 ------------------');
var undefvalue;
console.log('binary operation on undefined value');
undefvalue |= 0;


// test case 8 checking polymorphic binary and unary operation
console.log('------------------ test case 8 ------------------');
function f1(v1, v2) {
    return v1 + v2;
}
f1(1,2);
f1(true,2);
f1(1,f1);
f1(1,f1);
f1('1','2');
f1('2',1)

function f2(v1) {
    return !v1;
}
f2(1);
f2('1');
f2(2);
f2(1);
f2('1');
f2({});
f2(f1);

// test case 9 checking arguments leaking
console.log('------------------ test case 9 ------------------');
function argsLeaking() {
    return arguments;
}

console.log('args leaking case #1');
argsLeaking();

function argsLeaking2() {
    var tmp = arguments;
    return tmp;
}

console.log('args leaking case #2');
argsLeaking2();
argsLeaking2();

globalObj1 = 1;
function argsLeaking3() {
    globalObj1 = arguments;
}

console.log('args leaking case #3');
argsLeaking3();

// print result
