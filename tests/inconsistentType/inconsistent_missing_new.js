(function() {

    function C(a) {
        this.a = a;
    }
    
    function other(x) {
        x;
    }

    var c1 = new C(3);  
    var c2 = C(5); // inconsistent (different return type of C)
    
    other(23);

})();