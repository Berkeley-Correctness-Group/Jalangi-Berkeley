function TreeNode(){
	this.left = null;
	this.right = null;
	this.key = null;
}

TreeNode.prototype = {
	getItem: function(key) {
		if (this.key === null) {
			return null;
		}
		if (key == this.key) {
			return this.item;
		}
		if (key > this.key) {
			return this.right.getItem(key);
		} else {
			return this.left.getItem(key);
		}
	},
	addItem: function(key, item) {
		if (this.key == null) {
			this.left = new TreeNode();
			this.right = new TreeNode();
			this.item = item;
			this.key = key;
		} else {
			if (key == this.key) {
				this.item = item;
			} else {
				if (key > this.key) {
					this.right.addItem(key, item);
				} else {
					this.left.addItem(key, item);
				}
			}
		}
	}
};

var tree = new TreeNode();

// super good order.
var keylist = [5, 9, 3, 2, 1, 4, 7, 6, 8, 11, 10, 12];
var vallist = [10, 2, 4, 5, 6, 2, 19, 8, 3, 7, 18, 17];  
for (var i = 0; i < keylist.length; i++) {
	tree.addItem(keylist[i], vallist[i]);
}
for (var i = 0; i < keylist.length; i++) {
	console.log("tree[" + keylist[i] + "] = " + tree.getItem(keylist[i]) + " ?= " + vallist[i] + " _ " + i);
}

