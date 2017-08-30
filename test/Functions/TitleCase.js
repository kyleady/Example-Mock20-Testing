var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
require('mock20');
describe('string.prototype.toTitleCase()', function() {
  Campaign().MOCK20reset();
  var filePath = path.join(__dirname, '..', '..', 'MyScript.js');
  var MyScript = fs.readFileSync(filePath, 'utf8');
  eval(MyScript);
  it('should capitalize the first letter of each word', function(){
    var str = 'there is no i in a team.';
    expect(str.toTitleCase()).to.equal('There Is No I In A Team.');
  });
});
