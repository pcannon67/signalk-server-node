var debug = require('debug')('signalk:subscriptionmanager:test');


var chai = require("chai");
chai.Should();

var SubscriptionManager = require('../lib/subscriptionmanager');

var assert = require("assert")

var apparentWindSpeed = {
  "environment": {
    "wind": {
      "speedApparent": {
        "value": 10.96,
        "source": {
          "label": "",
          "type": "NMEA2000",
          "pgn": "130306",
          "src": "115"
        },
        "timestamp": "2014-08-15-16:00:00.785"
      },
      "angleApparent": {
        "value": 58,
        "source": {
          "label": "",
          "type": "NMEA2000",
          "pgn": "130306",
          "src": "115"
        },
        "timestamp": "2014-08-15-16:00:00.785"
      }
    }
  }
};

var emptySubscription = {
  "context": "vessels.self",
  "subscribe": []
};

var emptyDelta = {
  "context": "vessels.self",
  "updates": []
};

function TestEmitter() {}
var EventEmitter = require('events').EventEmitter;
require('util').inherits(TestEmitter, EventEmitter);

TestEmitter.prototype.push = function(data) {
  this.emit('change:delta', data);
}


describe('Without subscriptions', function() {
  it('Only heartbeat received', function(done) {
    var testEmitter = new TestEmitter();
    var subscriptionManager = new SubscriptionManager(testEmitter);
    var result = [];
    subscriptionManager.handleCommand("emptyid", emptySubscription, function(data) {
      result.push(data);
    });
    testEmitter.push(apparentWindSpeed);
    setTimeout(function() {
      result.length.should.equal(1);
      result[0].should.deep.equal(emptyDelta);
      done();
    }, 1500);
  })
});

var variation = {
  "updates": [{
    "source": {
      "label": "",
      "type": "NMEA2000",
      "pgn": "127250",
      "timestamp": "2014-08-15-16:00:00.078",
      "src": "160"
    },
    "values": [{
      "path": "navigation.magneticVariation",
      "value": 8.3
    }]
  }]
};
var depth = {
  "updates": [{
    "source": {
      "label": "",
      "type": "NMEA2000",
      "pgn": "128267",
      "timestamp": "2014-08-15-16:00:00.081",
      "src": "115"
    },
    "values": [{
      "path": "environment.depth.belowTransducer",
      "value": 43.21
    }]
  }]
};
var stw1 = {
  "updates": [{
    "source": {
      "label": "",
      "type": "NMEA2000",
      "pgn": "128259",
      "timestamp": "2014-08-15-16:00:00.417",
      "src": "115"
    },
    "values": [{
      "path": "navigation.speedThroughWater",
      "value": 3.61
    }]
  }]
};
var stw2 = {
  "updates": [{
    "source": {
      "label": "",
      "type": "NMEA2000",
      "pgn": "128259",
      "timestamp": "2014-08-15-16:00:02.376",
      "src": "115"
    },
    "values": [{
      "path": "navigation.speedThroughWater",
      "value": 3.76
    }]
  }]
};
var stw3 = {
  "updates": [{
    "source": {
      "label": "",
      "type": "NMEA2000",
      "pgn": "128259",
      "timestamp": "2014-08-15-16:00:02.418",
      "src": "115"
    },
    "values": [{
      "path": "navigation.speedThroughWater",
      "value": 3.74
    }]
  }]
};
var current = {
  "updates": [{
    "source": {
      "label": "",
      "type": "NMEA2000",
      "pgn": "129291",
      "timestamp": "2014-08-15-16:00:02.558",
      "src": "160"
    },
    "values": [{
      "path": "navigation.current",
      "value": {
        "setTrue": 96.3,
        "drift": 0.56
      }
    }]
  }]
};

function withSubscriptions(subscriptions) {
  var testEmitter = new TestEmitter();
  var subscriptionManager = new SubscriptionManager(testEmitter);
  var result = [];
    console.log('hep')
  var callback = function(data) {
    console.log('pushing')
    result.push(data);
  }
  subscriptions.forEach(function(subcription) {
    subscriptionManager.handleCommand("emptyid", subcription, callback);
  });
  return {
    withInputSignalK: function(signalks) {
      signalks.forEach(function(signalk) {
        signalk.context = signalk.context || 'vessels.self';
        testEmitter.push(signalk);
      })
      return {
        assertSignalkSequence: function(sequence) {
          sequence.length.should.equal(result.length, 'Sequence lengths are equal');
          for (i = 0; i < sequence.length; i += 1) {
            assert.deepEqual(sequence[i], result[i], "Elements [" + i + "] are equal");
          }
        }
      }
    }
  }
}


var selfSubscriptionWithDepthAndSpeed = {
  "context": "vessels.self",
  "subscribe": [{
    "path": "environment.depth.belowTransducer",
  }, {
    "path": "navigation.speedThroughWater",
  }],
}
describe('With simple self subscription', function() {
  it('Correct sequence received', function() {
    withSubscriptions([selfSubscriptionWithDepthAndSpeed])
      .withInputSignalK([stw1, current, stw2, depth])
      .assertSignalkSequence([stw1, stw2, depth]);
  })
});