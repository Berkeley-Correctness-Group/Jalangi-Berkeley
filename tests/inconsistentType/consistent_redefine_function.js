(function() {

    // minimal version of false positive in jQuery

    // original library
    var lib = function() {
        return new lib.fn.init();
    };

    lib.fn = lib.prototype = {
        init:function() {            
        }
    };

    // extend library: redefine an existing function
    lib.fn.init = function(x) {
    };


})();