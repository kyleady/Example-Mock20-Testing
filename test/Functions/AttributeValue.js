var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
require('mock20');
describe('attributeValue()', function() {
  Campaign().MOCK20reset();
  var filePath = path.join(__dirname, '..', '..', 'MyScript.js');
  var MyScript = fs.readFileSync(filePath, 'utf8');
  eval(MyScript);
  it('should allow you to retrive an attribute\'s value', function(){
    var character1 = createObj('character', {name: 'test Character1'});
    var attribute1 = createObj('attribute', {name: 'test attribute', current: '10', max: '30', _characterid: character1.id});
    var character2 = createObj('character', {name: 'test Character2'});
    var attribute2 = createObj('attribute', {name: 'test attribute', current: '15', max: '35', _characterid: character2.id});
    var attribute3 = createObj('attribute', {name: 'attribute value by name', current: '25', max: '45', _characterid: character2.id});
    var value;
    value = attributeValue(attribute3.get('name'));
    expect(value).to.equal(attribute3.get('current'));
    value = attributeValue(attribute3.get('name'), {max: true});
    expect(value).to.equal(attribute3.get('max'));
  });
  it('should allow you to specify an attribute by a character ID or graphic ID', function(){
    var character1 = createObj('character', {name: 'test Character1'});
    var attribute1 = createObj('attribute', {name: 'test attribute', current: '10', max: '30', _characterid: character1.id});
    var character2 = createObj('character', {name: 'test Character2'});
    var attribute2 = createObj('attribute', {name: 'test attribute', current: '15', max: '35', _characterid: character2.id});
    var page = createObj('page', {name: 'test page'}, {MOCK20override: true});
    var graphic = createObj('graphic', {name: 'test graphic', _pageid: page.id, represents: character1.id});
    expect(attribute1.get('name')).to.equal(attribute2.get('name'));
    expect(attribute1.get('current')).to.not.equal(attribute2.get('current'));
    var value;
    value = attributeValue(attribute1.get('name'), {characterid: character2.id});
    expect(value).to.equal(attribute2.get('current'));
    value = attributeValue(attribute2.get('name'), {graphicid: graphic.id});
    expect(value).to.equal(attribute1.get('current'));
  });
  it('should allow you to modify an attribute\'s value', function(){
    var character1 = createObj('character', {name: 'test Character1'});
    var attribute1 = createObj('attribute', {name: 'test attribute', current: '10', max: '30', _characterid: character1.id});
    expect(attribute1.get('current')).to.equal('10');
    attributeValue(attribute1.get('name'), {characterid: character1.id, setTo: '19'});
    expect(attribute1.get('current')).to.equal('19');
  });
  it('should allow you to set/get a local value on a graphic', function(){
    var character1 = createObj('character', {name: 'test Character1'});
    var attribute1 = createObj('attribute', {name: 'test attribute', current: '10', max: '30', _characterid: character1.id});
    var page = createObj('page', {name: 'test page'}, {MOCK20override: true});
    var graphic = createObj('graphic', {name: 'test graphic', _pageid: page.id, represents: character1.id});
    expect(attribute1.get('current')).to.equal('10');
    attributeValue(attribute1.get('name'), {graphicid: graphic.id, setTo: '19'});
    expect(attribute1.get('current')).to.equal('10');
    expect(attributeValue(attribute1.get('name'), {graphicid: graphic.id})).to.equal('19');
  });
  it('should not allow you to set/get a local value on a graphic with bar links', function(){
    var character1 = createObj('character', {name: 'test Character1'});
    var attribute1 = createObj('attribute', {name: 'test attribute', current: '10', max: '30', _characterid: character1.id});
    var page = createObj('page', {name: 'test page'}, {MOCK20override: true});
    var graphic = createObj('graphic', {name: 'test graphic', _pageid: page.id, represents: character1.id, bar1_link: attribute1.id});
    expect(attribute1.get('current')).to.equal('10');
    attributeValue(attribute1.get('name'), {graphicid: graphic.id, setTo: '19'});
    expect(attribute1.get('current')).to.equal('19');
  });
});
