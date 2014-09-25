/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var wire = require('wire');
var defaultPlugins = require('wire/lib/plugin/defaultPlugins');
var domready = require('domready');
var es5Transform = require('rave/lib/es5Transform');

var defaultDebugTimeout = 1e4;
var debugPlugin = 'wire/debug';

module.exports = function wireRave(raveContext) {
	return new WireRave(raveContext);
};

function injectDebug() {
	return require.async(debugPlugin).then(function(debugPlugin) {
		debugPlugin.timeout = defaultDebugTimeout;
		defaultPlugins.push(debugPlugin);
	});
}

function WireRave(raveContext) {
	this.raveContext = raveContext;
	this.load = createLoadExtension(raveContext);
}

WireRave.prototype.main = function() {
	var rc = this.raveContext;
	var app = rc.app;
	var env = rc.env;

	var p = env.debug || env.wire && env.wire.debug
		? injectDebug()
		: Promise.resolve();

	if(app && app.main) {
		p = p.then(function() {
			return require.async(app.main).then(wire);
		});
	}

	return p;
};

function createLoadExtension(context) {
	// Create a load extension for only require('domReady!') from
	// within the wire package.
	return [
		{
			package: 'wire',
			pattern: /wire\/domReady$/,
			hooks: {
				locate: noop,
				fetch: noop,
				translate: noop,
				instantiate: instantiate
			}
		}
	];
}

function noop (load) { return ''; }

function instantiate(load) {
	return {
		execute: function () {
			return new Module(es5Transform.toLoader(domready));
		}
	};
}
