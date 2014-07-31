/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var wire = require('wire');
var defaultPlugins = require('wire/lib/plugin/defaultPlugins');

var domready = require('domready');

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
	this.load = createLoadExtension(context);
}

WireRave.prototype.main = function() {
	var rc = this.raveContext;
	var app = rc.app;

	var p = rc.debug || rc.wireDebug ? injectDebug() : Promise.resolve();

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
			pattern: /^domReady!$/,
			hooks: {
				instantiate: instantiate
			}
		}
	];
}

function instantiate(load) {
	// wait for dom-ready before returning empty module
	return new Promise(function(resolve) {
		domready(function() {
			resolve({
				execute: function() {
					return new Module({});
				}
			});
		})
	});
}
