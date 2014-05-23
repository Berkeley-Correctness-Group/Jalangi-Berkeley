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