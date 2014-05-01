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

var array1 = [];
array1[1] = 2;
array1[2] = 3.3;
array1.push(1);
array1.pop();
array1.test = 'test';
array1.test2;


var array2 = new Array();
array2[1] = 2;
array2[2] = {};
array2[3] = 'test';

var array3 = new Uint32Array(123);
array3[1] = 3;

var fakearray = {};
fakearray[2] = 1;

var array4 = [];
array4[1] = 2;
array4[2] = -2;
console.log(typeof array4);

var array5 = [];
array5[1] = 2.0;
array5[200] = 123123123123.123123123123123123;

var array6 = [];
array6[1] = 2;
array6[2] = 3;
array6.push({});

var array7 = [];
array7[2] = 1;