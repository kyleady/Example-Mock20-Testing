# Example Mock20 Testing

An example [Roll20](https://roll20.net/) project that uses the [Mock20](https://github.com/kyleady/Mock20) module to test its scripts.

# Usage

#### npm test

When running tests on this script through node, the project will compile every javascript file within the Scripts folder into the `MyScript.js` file. It will also create the `MyModule.js` file at the same time. Thus, any changes you make directly to `MyScript.js` or `MyModule.js` will be lost each time you run `npm test`.

#### MyScript.js

This file is just a concatenation of every javascript file within the Scripts folder. The purpose of this is to have one file that can easily be copy-pasted into roll20 that is made up of many smaller javascript files that are easy to organize and edit.

#### MyModule.js

This file begins with `require('mock20');` and ends with `MOCK20endOfLastScript();`. The purpose of this module is to allow you to check if your Script would even run using `node MyModule.js` from the command line. However, thorough testing of each piece of your Script is the best way to ensure your Script will avoid errors.

# eval() vs. modules

When testing you will have to find what works for you. I personally chose to test my Scripts with `eval()`.

Test setup with mocha/chai using `eval()`.
````
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
require('mock20');
describe('MyScriptPiece', function() {
  it('should pass this test', function() {
    Campaign().MOCK20reset();
    var filePath = path.join(__dirname, '..', '..', 'MyScript.js');
    var MyScript = fs.readFileSync(filePath, 'utf8');
    eval(MyScript);
    //my test
  });
});
````

Test setup with mocha/chai using modules.
````
var expect = require('chai').expect;
require('mock20');
require('./../../Scripts/MyScriptPiece');
describe('MyScriptPiece', function() {
  it('should pass this test', function() {
    //my test
  });
});
````

#### `eval()` cons
+ If an error occurs in `MyScript.js` while testing, you will not get the line and file at which the error occurs.
+ Incompatible with coverage tools like [nyc](https://istanbul.js.org/).

#### `eval()` pros
+ You can write your Script for Roll20 without having to accomidate nodejs (in terms of global, exports, require).
+ You can control the scope of where `MyScript.js` is evaluated. (This project shows `eval()` being used in different scopes).

#### module cons
+ Testing the Script in isolated pieces will not catch errors in `MyScript.js` due to two different pieces modifiying variables with the same name.
+ You will have to accomodate nodejs when writing your Script (global, exports, require), and you will need to stub or remove those accomidations to also accomidate Roll20.
+ Having the Script insulated in a module makes scope more difficult to manage.

#### module pros
+ If an error occurs during testing, you can see the exact line number and file name of where the error occured.
+ Far more tools are compaible with testing modules.

