(function() {

    function C(a) {
        this.a = a;
    }
    
    var i = 0;
    while (i < 2) {
        i++;
        var c = new C(i === 1 ? 3 : true); // inconsistent type of field a
    }

})();