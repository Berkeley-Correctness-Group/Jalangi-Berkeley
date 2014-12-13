(function() {

    function O() {
    }

    O.prototype = {
        valueOf:function() {
            return 5;
        }
    };

    var obj = new O()

    23 - obj;

})();