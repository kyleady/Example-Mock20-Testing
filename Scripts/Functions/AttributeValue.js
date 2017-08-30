function attributeValue(name, options){
  if(typeof options != 'object') options = false;
  options = options || {};
  if(options['alert'] == undefined) options['alert'] = true;
  if(options['max']){
    var workingWith = 'max';
  } else {
    var workingWith = 'current';
  }

  if(options['graphicid']){
    var graphic = getObj('graphic',options['graphicid']);
    if(!graphic){
      if(options['alert']) whisper('Graphic ' + options['graphicid'] + ' does not exist.');
      return undefined;
    }

    if(options['bar']){
      if(workingWith == 'current') workingWith = 'value';
      if(options['setTo']) graphic.set(options['bar'] + '_' + workingWith, options['setTo']);
      var barValue = graphic.get(options['bar'] + '_' + workingWith) || 0;
      return barValue;
    }

    if(workingWith == 'current'
    && graphic.get('bar1_link') == ''
    && graphic.get('bar2_link') == ''
    && graphic.get('bar3_link') == ''){
      var localAttributes = new LocalAttributes(graphic);
      if(options['setTo'] != undefined) {
        localAttributes.set(name, options['setTo']);
      }

      if(options['delete']){
        localAttributes.remove(name);
        if(options['show']) whisper(name + ' has been deleted.');
        return true;
      }

      if(localAttributes.get(name) != undefined){
        return localAttributes.get(name);
      }
    }

    options['characterid'] = graphic.get('represents');
  }

  var attribute = getAttribute(name, options);
  if(!attribute) {
    if(options['setTo'] != undefined){
      attributes = [createObj('attribute', {
        name: name,
        current: options['setTo'],
        max: options['setTo'],
        characterid: character.id
      })];
      return attributes[0];
    }

    return;
  }
  if(options['setTo'] != undefined) attribute.set(workingWith, options['setTo']);
  return attribute.get(workingWith);
}
