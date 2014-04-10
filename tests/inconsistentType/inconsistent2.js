(function() {

    function C(a) {
        this.a = a;
    }

    var c1 = new C(3);  
    var c2 = C(5); // inconsistent (different return type of C)

})();