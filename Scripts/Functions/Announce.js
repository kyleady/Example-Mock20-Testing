function announce(content, options){
  if(typeof options != 'object') options = {};
  var speakingAs = options.speakingAs || 'API';
  if(options.noarchive == undefined) options.noarchive = true;
  if(!content) return whisper('announce() attempted to send an empty message.');
  sendChat(speakingAs, content, null, options);
}
