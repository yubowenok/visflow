
/*
 * DataflowConstants is essentially a single constant or a set of constants
 * used for filtering
 */

"use strict";

var extObject = {
  initialize: function(text) {

    this.isSet = false;  // a single item is considered non-set
    this.type = "constants"; // to be differentiated from data

    this.constantType = "empty"; // empty, int, float, string

    // un-initialized state
    this.numElements = 0;
    this.elements = [];
    this.hasElement = {}; // collection that makes unique

    // change status
    this.changed = true;


    if (text != null) {

      if ( typeof text !== "string")
        return console.error("non-string input sent to DataflowConstants");

      var eles = text.split(/[,;]+/);
      for (var i in eles)
        this.add(eles[i]);

      //console.log(this.constantType, this.elements);
    }
  },

  compatible: function(pack) {
    if (this.constantType == "empty" || pack.constantType == "empty")
      return true;
    if (this.constantType == "string" ^ pack.constantType == "string")
      return false;
    return true;
  },

  stringify: function() {
    var result = "";
    for (var i in this.elements) {
      result += this.elements[i];
      result += i == this.elements.length - 1 ? "" : ", ";
    }
    return result;
  },

  // parse input string
  parse: function(text) {
    var res;
    res = text.match(/^-?[0-9]+/);
    if (res && res[0] === text) {
      return {
        type: "int",
        value: parseInt(text)
      };
    }
    res = text.match(/^-?([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)/);
    if (res && res[0] === text) {
      return {
        type: "float",
        value: parseFloat(text)
      };
    }
    if (text === "") {  // empty constants are ignored
      return {
        type: "empty",
        value: null
      };
    }
    return {
      type: "string",
      value: text
    };
  },

  // add one element
  add: function(value) {

    var typeGrade = {
      "empty": -1,
      "int" : 0,
      "float" : 1,
      "string" : 2
    };
    var gradeTypes = ["int", "float", "string"];
    var grade = typeGrade[this.constantType];
    var e = this.parse(value);

    if (e.type === "empty")
      return; //  ignore empty element
    value = e.value;

    if (this.hasElement[value])
      return; // element already exists

    this.hasElement[value] = true;
    this.numElements++;
    this.elements.push(value);
    this.isSet = this.numElements > 1;

    var newgrade = Math.max(grade, typeGrade[e.type]);
    this.constantType = gradeTypes[newgrade];

    // force conversion to higher types
    // i.e. int -> float -> string
    if (newgrade > grade) {
      for (var i in this.elements) {
        var e = this.elements[i];
        if (grade === 1)
          e = parseFloat(e);
        if (grade === 2)
          e = e.toString();
        this.elements[i] = e;
      }
    }
  },

  // remove all elements, returns to un-initialized state
  clear: function() {
    this.numElements = 0;
    this.elements = [];
    this.isSet = false;
    this.constantType = "empty";
  },

  getOne: function() {
    if (this.numElements === 0)
      return null;
    return this.elements[0];
  },

  getAll: function() {
    if (this.numElements === 0)
      return null;
    return this.elements;
  },

  count: function() {
    return this.elements.length;
  }

};

var DataflowConstants = Base.extend(extObject);
