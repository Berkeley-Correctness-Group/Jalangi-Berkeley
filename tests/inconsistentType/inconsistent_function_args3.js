(function() {

    function foo(x) {
        x;
    }

    var a = {p: 3};
    var b = {p: "99"};
    foo(a);
    foo(b);
    
})();