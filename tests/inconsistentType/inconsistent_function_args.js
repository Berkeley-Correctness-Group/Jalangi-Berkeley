(function() {

    function foo(x, y) {
        x;
        y;
    }

    var a;
    foo(3, 4);
    foo(3, a);
    
})();