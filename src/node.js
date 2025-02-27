/**
 * Module dependencies.
 */

import fs from 'fs';
import { mkfifoSync } from 'mkfifo';
import tty from 'tty';
import util from 'util';

/**
 * This is the Node.js implementation of `debug()`.
 */



const destroy = util.deprecate(
	() => {},
	'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
);

/**
 * Colors.
 */

let colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	import supportsColor from './supports-color.js'

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

let OUT_FD = process.stderr

const inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else if (+val === val ){
		val = Number(val);
	} 

	obj[prop] = val;
	return obj;
}, {});


/**
 * This checks for DEBUG_FD and will create a named pipe (if one doesn't exist already), 
 * and write the output to that named pipe.
 * This allows one to follow the drbug messages from a different terminal, which is
 * useful for terminal applications that require the full terminal window. 
 */
function getWriteStream(){
	// If no fd is set, then use process.stderr by default
	if ( ! inspectOpts?.fd ){
		return process.stderr
	}

	const fd = inspectOpts?.fd

	if ( typeof fd === 'string' ){
		// If it already exists, then make sure its a fifo
		if ( fs.existsSync(fd) ){
			const stat = fs.statSync(fd)

			// If its not a fifo, thend efault to stderr for now
      if ( stat.isFIFO() === false ){
        return process.stderr
      }
		}
		// If it doesn't exist, then create a named pipe with that name
		else {
			 mkfifoSync(fd, 0o644);
		}

		// Return the write stream
		return fs.createWriteStream(fd)
	}
}
/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in inspectOpts ?
		Boolean(inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.format()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	//return process.stderr.write(util.format(...args) + '\n');
	return OUT_FD.write(util.format(...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	//_exports.inspectOpts = {};

	const keys = Object.keys(inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		inspectOpts[keys[i]] = inspectOpts[keys[i]];
	}

	OUT_FD = getWriteStream()
}

import setup from './common.js'




const _exports = setup({
	init, log, formatArgs, save, useColors, 
	inspectOpts, getDate, init, destroy,
})

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

_exports.formatters.o = function (v) {
	_exports.inspectOpts.colors = _exports.useColors;
	return util.inspect(v, _exports.inspectOpts)
		.split('\n')
		.map(str => str.trim())
		.join(' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

_exports.formatters.O = function (v) {
	_exports.inspectOpts.colors = _exports.useColors;
	return util.inspect(v, _exports.inspectOpts);
};


export default _exports;

