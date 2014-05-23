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

((function (sandbox) {
    var util = {
        ISNAN:isNaN,
        PARSEINT: parseInt,
        isArr: function (obj) {
            return Array.isArray(obj) || (obj && obj.constructor && (obj instanceof Uint8Array || obj instanceof Uint16Array ||
                obj instanceof Uint32Array || obj instanceof Uint8ClampedArray ||
                obj instanceof ArrayBuffer || obj instanceof Int8Array || obj instanceof Int16Array ||
                obj instanceof Int32Array || obj instanceof Float32Array || obj instanceof Float64Array));
        },
        isNormalNumber: function(num) {
            if (typeof num === 'number' && !this.ISNAN(num)) {
                return true;
            } else if (typeof num === 'string' && (this.PARSEINT(num) + "" === num)) {
                return true;
            }
            return false;
        }
    };

    sandbox.Utils = util;

})(J$));