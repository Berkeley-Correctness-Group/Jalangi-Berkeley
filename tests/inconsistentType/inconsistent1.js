(function () {
    
    function C(a) {
        this.a = a;
    }
    
    function foo(x) {
        
    }
    
    var c1 = new C(2);
    foo(c1);
    c1.b = 5;
    foo(c1);
    
})();