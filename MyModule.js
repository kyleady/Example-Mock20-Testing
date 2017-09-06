require('mock20')

function attributeHandler(matches,msg,options){
  if(typeof options != 'object') options = {};
  if(options['show'] == undefined) options['show'] = true;
  var workingWith = (matches[1].toLowerCase() == 'max') ? 'max' : 'current';
  var statName = matches[2];
  var operator = matches[3].replace('/\s/g','');
  var sign = matches[4] || '';
  var modifier = matches[5] || '';
  if(options['partyStat']) msg.selected = [{_type: 'unique'}];
  eachCharacter(msg, function(character, graphic){
    graphic = graphic || {};
    character = character || {};
    var attribute = {
      current: attributeValue(statName, {graphicid: graphic.id, max: false, bar: options['bar']}),
      max: attributeValue(statName, {graphicid: graphic.id, max: true, alert: false, bar: options['bar']})
    };
    var name = (options.partyStat) ? '' : character.get('name');
    if(attribute.current == undefined) return;
    if(attribute.max == undefined){
      if(modifier == 'max' && operator == '='){
        attributeValue(statName, {graphicid: graphic.id, delete: true, alert: false, bar: options['bar']});
        return whisper(statName + ' has been reset.', {speakingTo: msg.playerid, gmEcho: true});
      } else if(workingWith == 'max' || modifier == 'max') {
        return whisper('Local attributes do not have maximums to work with.', {speakingTo: msg.playerid, gmEcho: true});
      } else {
        attribute.max = '-';
      }
    }

    var modifiedAttribute = modifyAttribute(attribute, {
      workingWith: workingWith,
      operator: operator,
      sign: sign,
      modifier: modifier,
      inlinerolls: msg.inlinerolls
    });
    if(!modifiedAttribute) return;
    if(operator.indexOf('?') != -1) {
      if(options['show'] == false) return;
      whisper(name + attributeTable(statName, modifiedAttribute), {speakingTo: msg.playerid});
    } else if(operator.indexOf('=') != -1) {
      attributeValue(statName, {setTo: modifiedAttribute[workingWith], graphicid: graphic.id, max: workingWith, bar: options['bar']});
      if(options['show'] == false) return;
      var output = attributeTable(statName, attribute);
      output += attributeTable('|</caption><caption>V', modifiedAttribute, 'Yellow');
      if(options['partyStat']){
        var players = canViewAttr(statName, {alert: false});
        whisper(name + output, {speakingTo: players, gmEcho: true});
      } else {
        whisper(name + output, {speakingTo: msg.playerid, gmEcho: true});
      }
    }
  });
}

function correctAttributeName(name){
  return name.trim();
}

function makeAttributeHandlerRegex(yourAttributes){
  var regex = "!\\s*";
  if(typeof yourAttributes == 'string'){
    yourAttributes = [yourAttributes];
  }
  if(yourAttributes == undefined){
    regex += "attr\\s+";
    regex += "(max|)\\s*";
    regex += "(\\S[^-\\+=/\\?\\*]*)\\s*";
  } else if(Array.isArray(yourAttributes)){
    regex += "(|max)\\s*";
    regex += "("
    for(var yourAttribute of yourAttributes){
      regex += yourAttribute + "|";
    }
    regex = regex.replace(/\|$/, "");
    regex += ")";
  } else {
    whisper('invalid yourAttributes');
    return;
  }
  regex += "\\s*" + numModifier.regexStr();
  regex += "\\s*(|\\d+\\.?\\d*|max|current|\\$\\[\\[\\d\\]\\])";
  regex += "\\s*$";
  return RegExp(regex, "i");
};

on("ready", function(){
  var re = makeAttributeHandlerRegex();
  CentralInput.addCMD(re, function(matches, msg){
    matches[2] = correctAttributeName(matches[2]);
    attributeHandler(matches, msg);
  }, true);
});
function LocalAttributes(graphic) {
  this.graphic = graphic;
  this.gmnotes = decodeURIComponent(graphic.get('gmnotes'));
  this.gmnotes = this.gmnotes.replace(/<br>/g, '\n');
  this.Attributes = {};
  if(/[^\{\}]*(\{.*\})[^\{\}]*/.test(this.gmnotes)){
    this.Attributes = this.gmnotes.replace(/[^\{\}]*(\{.*\})[^\{\}]*/, '$1');
    this.Attributes = JSON.parse(this.Attributes);
  }

  this.get = function(attribute) {
    return this.Attributes[attribute];
  }

  this.set = function(attribute, value) {
    var newValue = this.Attributes[attribute] = value;
    this.save();
    return newValue;
  }

  this.remove = function(attribute) {
    delete this.Attributes[attribute];
    this.save();
  }

  this.save = function() {
    if(/[^\{\}]*(\{.*\})[^\{\}]*/.test(this.gmnotes)){
      this.gmnotes = this.gmnotes.replace(/[^\{\}]*(\{.*\})[^\{\}]*/, JSON.stringify(this.Attributes));
    } else {
      this.gmnotes = this.gmnotes + '<br>' + JSON.stringify(this.Attributes);
    }

    this.gmnotes = encodeURIComponent(this.gmnotes);
    this.graphic.set('gmnotes', this.gmnotes);
  }
}
function announce(content, options){
  if(typeof options != 'object') options = {};
  var speakingAs = options.speakingAs || 'API';
  var callback = options.callback || null;
  if(options.noarchive == undefined) options.noarchive = true;
  if(!content) return whisper('announce() attempted to send an empty message.');
  sendChat(speakingAs, content, callback, options);
}
function attributeTable(name, attribute, options){
  if(typeof options != 'object') options = {};
  if(options['color'] == undefined) options['color'] = '00E518';
  var attrTable = '<table border = \"2\" width = \"100%\">';
  attrTable += '<caption>' + name + '</caption>';
  attrTable += '<tr bgcolor = \"' + options['color'] + '\"><th>Current</th><th>Max</th></tr>';
  attrTable += '<tr bgcolor = \"White\"><td>' + attribute.current + '</td><td>' + attribute.max + '</td></tr>';
  attrTable += '</table>';
  return attrTable;
}
function attributeValue(name, options){
  if(typeof options != 'object') options = false;
  options = options || {};
  if(options['alert'] == undefined) options['alert'] = true;
  if(!options['max'] || options['max'] == 'current'){
    var workingWith = 'current';
  } else {
    var workingWith = 'max';
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
var CentralInput = {};
CentralInput.Commands = [];
CentralInput.addCMD = function(cmdregex, cmdaction, cmdpublic){
  if(cmdregex == undefined){return whisper('A command with no regex could not be included in CentralInput.js.');}
  if(cmdregex == undefined){return whisper('A command with no function could not be included in CentralInput.js.');}
  cmdpublic = cmdpublic || false;
  var Command = {cmdRegex: cmdregex, cmdAction:cmdaction, cmdPublic: cmdpublic};
  this.Commands.push(Command);
}

CentralInput.input = function(msg){
  var inputRecognized = false;
  if(msg.content.indexOf('!{URIFixed}') == 0){
    msg.content = msg.content.replace('{URIFixed}','');
    msg.content = decodeURIComponent(msg.content);
  }
  for(var i = 0; i < this.Commands.length; i++){
    if(this.Commands[i].cmdRegex.test(msg.content)
    && (this.Commands[i].cmdPublic || playerIsGM(msg.playerid)) ){
      inputRecognized = true;
      this.Commands[i].cmdAction(msg.content.match(this.Commands[i].cmdRegex), msg);
    }
  }

  if(!inputRecognized){
    whisper('The command ' + msg.content + ' was not recognized. See ' + getLink('!help') + ' for a list of commands.', {speakingTo: msg.playerid});
  }
}

on('chat:message', function(msg) {
  if(msg.type == 'api' && msg.playerid && getObj('player', msg.playerid)){
    CentralInput.input(msg);
  }
});

function encodeURIFixed(str){
  return encodeURIComponent(str).replace(/['()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}
function defaultCharacter(playerid){
  var candidateCharacters = findObjs({
    _type: 'character',
    controlledby: playerid
  });
  if(candidateCharacters && candidateCharacters.length == 1){
    return candidateCharacters[0];
  } else if(!candidateCharacters || candidateCharacters.length <= 0) {
    var player = getObj('player', playerid);
    var playername = '[' + playerid + ']';
    if(player) playername = player.get('_displayname');
    whisper('No default character candidates were found for ' + playername + '.');
  } else {
    var player = getObj('player', playerid);
    var playername = '[' + playerid + ']';
    if(player) playername = player.get('_displayname');
    whisper('Too many default character candidates were found for ' + playername + '. Please refer to the api output console for a full listing of those characters');
    log('Too many default character candidates for '  + playername + '.');
    for(var i = 0; i < candidateCharacters.length; i++){
      log('(' + (i+1) + '/' + candidateCharacters.length + ') ' + candidateCharacters[i].get('name'))
    }
  }
}
function eachCharacter(msg, givenFunction){
  if(msg.selected == undefined || msg.selected.length <= 0){
    if(playerIsGM(msg.playerid)){
      var gm = getObj('player', msg.playerid)
      var pageid = gm.get('_lastpage') || Campaign().get('playerpageid');
      msg.selected = findObjs({
        _pageid: pageid,
        _type: 'graphic',
        _subtype: 'token',
        isdrawing: false,
        layer: 'objects'
      });
    } else {
      msg.selected = [defaultCharacter(msg.playerid)];
      if(msg.selected[0] == undefined){return;}
    }
  }

  _.each(msg.selected, function(obj){
    if(obj._type == 'graphic'){
      var graphic = getObj('graphic', obj._id);
      if(graphic == undefined) {
        log('graphic undefined')
        log(obj)
        return whisper('graphic undefined', {speakingTo: msg.playerid, gmEcho: true});
      }

      var character = getObj('character', graphic.get('represents'))
      if(character == undefined){
        log('character undefined')
        log(graphic)
        return whisper('character undefined', {speakingTo: msg.playerid, gmEcho: true});
      }
    } else if(obj._type == 'unique'){
      var graphic = undefined;
      var character = undefined;
    } else if(typeof obj.get === 'function' && obj.get('_type') == 'character') {
      var character = obj;
      var graphic = undefined;
      if(Campaign().get('playerspecificpages') && Campaign().get('playerspecificpages')[msg.playerid]){
        graphic = findObjs({
          _pageid: Campaign().get('playerspecificpages')[msg.playerid],
          _type: 'graphic',
          represents: character.id
        })[0];
      }

      if(graphic == undefined){
        graphic = findObjs({
          _pageid: Campaign().get('playerpageid'),
          _type: 'graphic',
          represents: character.id
        })[0];
      }

      if(graphic == undefined){
        graphic = findObjs({
          _type: 'graphic',
          represents: character.id
        })[0];
      }

      if(graphic == undefined){
        return whisper(character.get('name') + ' does not have a token on any map in the entire campaign.',
         {speakingTo: msg.playerid, gmEcho: true});
      }
    } else if(typeof obj.get === 'function' && obj.get('_type') == 'graphic') {
      var graphic = obj;
      var character = getObj('character', graphic.get('represents'));
      if(character == undefined){
        log('character undefined')
        log(graphic)
        return whisper('character undefined', {speakingTo: msg.playerid, gmEcho: true});
      }
    } else {
      log('Selected is neither a graphic nor a character.')
      log(obj)
      return whisper('Selected is neither a graphic nor a character.', {speakingTo: msg.playerid, gmEcho: true});
    }

    givenFunction(character, graphic);
  });
}
function getAttribute(name, options) {
  if(typeof options != 'object') options = false;
  options = options || {};
  if(options['alert'] == undefined) options['alert'] = true;
  if(options['graphicid']) {
    var graphic = getObj('graphic', options['graphicid']);
    if(graphic == undefined){
      if(options['alert']) whisper('Graphic ' + options['graphicid'] + ' does not exist.');
      return undefined;
    }

    options['characterid'] = graphic.get('represents');
  }

  if(options['characterid']){
    var character = getObj('character', options['characterid']);
    if(character == undefined) {
      if(options['alert']) whisper('Character ' + options['characterid'] + ' does not exist.');
      return undefined;
    }

    var attributes = findObjs({
      _type: 'attribute',
      _characterid: options['characterid'],
      name: name
    });
    if(!attributes || attributes.length <= 0){
      if(options['setTo'] == undefined){
        if(options['alert']) whisper(character.get('name') + ' does not have a(n) ' + name + ' Attribute.');
        return undefined;
      }
    } else if(attributes.length >= 2){
      if(options['alert']) whisper('There were multiple ' + name + ' attributes owned by ' + character.get('name')
       + '. Using the first one found. A log has been posted in the terminal.');
      log(character.get('name') + '\'s ' + name + ' Attributes');
      _.each(attributes, function(attribute){ log(attribute)});
    }
  } else {
    var attributes = findObjs({
      _type: 'attribute',
      name: name
    });
    if(!attributes || attributes.length <= 0){
      if(options['alert']) whisper('There is nothing in the campaign with a(n) ' + name + ' Attribute.');
      return undefined;
    } else if(attributes.length >= 2){
      if(options['alert']) whisper('There were multiple ' + name + ' attributes. Using the first one found. A log has been posted in the terminal.');
      log(name + ' Attributes')
      _.each(attributes, function(attribute){ log(attribute)});
    }
  }

  return attributes[0];
}
function getLink (Name, Link){
  Link = Link || '';
  if(Link == ''){
    var Handouts = findObjs({ _type: 'handout', name: Name });
    var objs = filterObjs(function(obj) {
      if(obj.get('_type') == 'handout' || obj.get('_type') == 'character'){
        var regex = Name;
        regex = regex.replace(/[\.\+\*\[\]\(\)\{\}\^\$\?]/g, function(match){return '\\' + match});
        regex = regex.replace(/\s*(-|–|\s)\s*/, '\\s*(-|–|\\s)\\s*');
        regex = regex.replace(/s?$/, 's?');
        regex = '^' + regex + '$';
        var re = RegExp(regex, 'i');
        return re.test(obj.get('name'));
      } else {
        return false;
      }
    });
    objs = trimToPerfectMatches(objs, Name);
    if(objs.length > 0){
      return '<a href=\"http://journal.roll20.net/' + objs[0].get('_type') + '/' + objs[0].id + '\">' + objs[0].get('name') + '</a>';
    } else {
        return Name;
    }
  } else {
    return '<a href=\"' + Link + '\">' + Name + '</a>';
  }
}
function modifyAttribute(attribute, options) {
  if (typeof options != 'object' ) options = {};
  if(options.workingWith != 'max') options.workingWith = 'current';
  if(!options.sign) options.sign = '';
  if(typeof options.modifier == 'number') options.modifier = options.modifier.toString();

  if(attribute.get) {
    attribute = {
      current: attribute.get('current'),
      max: attribute.get('max')
    };
  }

  if(/\$\[\[\d+\]\]/.test(options.modifier)){
    var inlineMatch = options.modifier.match(/\$\[\[(\d+)\]\]/);
    if(inlineMatch && inlineMatch[1]){
      var inlineIndex = Number(inlineMatch[1]);
    }
    if(inlineIndex != undefined && options.inlinerolls && options.inlinerolls[inlineIndex]
    && options.inlinerolls[inlineIndex].results
    && options.inlinerolls[inlineIndex].results.total != undefined){
      options.modifier = options.inlinerolls[inlineIndex].results.total.toString();
    } else {
      log('msg.inlinerolls')
      log(options.inlinerolls);
      return whisper('Invalid Inline');
    }
  }

  switch(options.modifier.toLowerCase()){
    case 'max':
      options.modifier = attribute.max;
      break;
    case 'current':
      options.modifier = attribute.current;
      break;
  }

  var modifiedAttribute = {
    current: attribute.current,
    max: attribute.max
  };

  modifiedAttribute[options.workingWith] = numModifier.calc(
    attribute[options.workingWith],
    options.operator,
    options.sign + options.modifier
  );

  return modifiedAttribute;
}
var numModifier = {};
numModifier.calc = function(stat, operator, modifier){
  if(operator.indexOf('+') != -1){
    stat = Number(stat) + Number(modifier);
    return Math.round(stat);
  } else if(operator.indexOf('-') != -1){
    stat = Number(stat) - Number(modifier);
    return Math.round(stat);
  } else if(operator.indexOf('*') != -1){
    stat = Number(stat) * Number(modifier);
    return Math.round(stat);
  } else if(operator.indexOf('/') != -1){
    stat = Number(stat) / Number(modifier);
    return Math.round(stat);
  } else if(operator.indexOf('=') != -1){
    return modifier;
  } else {
    return stat;
  }
}

numModifier.regexStr = function(){
  return '(\\?\\s*\\+|\\?\\s*-|\\?\\s*\\*|\\?\\s*\\/|\\?|=|\\+\\s*=|-\\s*=|\\*\\s*=|\\/\\s*=)\s*(|\\+|-)'
}
function trimToPerfectMatches(objs, phrase){
  var exactMatches = [];
  _.each(objs, function(obj){
    if(obj.get('_type') == 'player'){
      var name = obj.get('_displayname');
    } else {
      var name = obj.get('name');
    }
    if(name == phrase){
      exactMatches.push(obj);
    }
  });
  if(exactMatches.length >= 1){
    return exactMatches;
  } else {
    return objs;
  }
}
function whisper(content, options){
  if(typeof options != 'object') options = {};
  var speakingAs = options.speakingAs || 'API';
  if(options.noarchive == undefined) options.noarchive = true;
  if(!content) return whisper('whisper() attempted to send an empty message.');
  var new_options = {};
  for(var k in options) new_options[k] = options[k];
  delete new_options.speakingTo;
  if (Array.isArray(options.speakingTo)) {
    if (options.speakingTo.indexOf('all') != -1) return announce(content, new_options);
    if (options.gmEcho) {
      var gmIncluded = false;
      _.each(options.speakingTo, function(target) {
        if (playerIsGM(target)) gmIncluded = true;
      });
      if(!gmIncluded) whisper(content, new_options);
      delete options.gmEcho;
    }

    _.each(options.speakingTo, function(target) {
      new_options.speakingTo = target;
      whisper(content, new_options);
    });
    return;
  }

  if(options.speakingTo == 'all') {
    return announce(content, new_options);
  } else if(options.speakingTo) {
    if(getObj('player', options.speakingTo)){
      if(options.gmEcho && !playerIsGM(options.speakingTo)) whisper(content, new_options);
      return sendChat(speakingAs, '/w \"' + getObj('player',options.speakingTo).get('_displayname') + '\" ' + content, options.callback, options );
    } else {
      return whisper('The playerid ' + JSON.stringify(options.speakingTo) + ' was not recognized and the following msg failed to be delivered: ' + content);
    }
  } else {
    return sendChat(speakingAs, '/w gm ' + content, options.callback, options);
  }
}
function canViewAttribute(name, options){
  if(typeof options != 'object') options = false;
  options = options || {};
  var attribute = getAttribute(name, options);
  if(!attribute) return;
  var character = getObj('character', attribute.get('_characterid'));
  return viewerList = character.get('inplayerjournals').split(',');
}
MOCK20endOfLastScript();
