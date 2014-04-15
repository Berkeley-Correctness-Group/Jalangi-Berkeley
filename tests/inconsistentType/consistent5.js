(function() {
    
    // simplified version of a false positive in joomla/mootools
    
    function Type() {
        this.hooks = [];
    }
    
    var t1 = new Type();
    t1.hooks.push(function() {});
    t1.hooks[0]();
    
    var t2 = new Type();
    t2.hooks.push(function() {});
    t2.hooks[0]();
    
})();