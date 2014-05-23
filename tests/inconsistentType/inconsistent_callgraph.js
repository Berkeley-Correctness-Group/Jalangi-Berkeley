(function() {

    function fc(c) {
        return c;
    }

    function fb(b) {
        return fc(b);
    }

    function fa(a) {
        return fb(a);
    }

    fa(3);
    fa([]);

    function fc2(l) {
        return l;
    }

    function fb2(n) {
        return fc2(n);
    }

    function fa2(m) {
        return fb2(m);
    }

    fa2(3);
    fa2([]);


})();