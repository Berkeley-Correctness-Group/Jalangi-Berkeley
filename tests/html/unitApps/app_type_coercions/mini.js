(function() {

    // potentially harmful coercions
    if (!(new Boolean(false))) {
        var x;
        x = x + "abc";
        var y = {} >> [4,3,2,1];
    }

    // harmless coercions
    if (23) {
        "aa" + true;
        5 - new Number(20);
    }


    function foo() {}

    foo();
    foo();

    console.log("done");

})();