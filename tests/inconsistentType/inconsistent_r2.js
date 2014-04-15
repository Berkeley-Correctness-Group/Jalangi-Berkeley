//
// wordpress:
//   https://core.trac.wordpress.org/ticket/27691
//
//

var attachments = JSON.parse('[{"sizes" : {"full" : 4}}, {}, {"sizes" : {"thumbnail" : 5}}]');

attachments.forEach(function(attachment) {
  if ( attachment.sizes.thumbnail ) { 
    attachment.thumbnail = attachment.sizes.thumbnail; 
 	} else { 
	 	attachment.thumbnail = attachment.sizes.full; 
	}
});
