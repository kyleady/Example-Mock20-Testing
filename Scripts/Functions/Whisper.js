function whisper(content, speakingTo, options){
  if(typeof options != 'object') options = {};
  var speakingAs = options.speakingAs || 'API';
  if(options.noarchive == undefined) options.noarchive = true;
  if(!content) return whisper('whisper() attempted to send an empty message.');
  if (Array.isArray(speakingTo)) {
    if (speakingTo.indexOf('all') != -1) return announce(content, options);
    if (options.gmEcho) {
      var gmIncluded = false;
      _.each(speakingTo, function(target) {
        if (playerIsGM(target)) gmIncluded = true;
      });
      if(!gmIncluded) whisper(content, false, options);
      options.gmEcho = false;
    }

    _.each(speakingTo, function(target) {
      whisper(content, target, options);
    });
    return;
  }

  if(speakingTo){
    if(getObj('player', speakingTo)){
      if(options.gmEcho && !playerIsGM(speakingTo)) whisper(content, false, options);
      return sendChat(speakingAs, '/w \"' + getObj('player',speakingTo).get('_displayname') + '\" ' + content, null, options );
    } else {
      return whisper('The playerid ' + speakingTo + ' was not recognized and the following msg failed to be delivered: ' + content);
    }
  } else {
    return sendChat(speakingAs, '/w gm ' + content, null, options);
  }
}
