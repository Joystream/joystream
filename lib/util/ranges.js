'use strict';

const debug = require('debug')('joystream:util:ranges');

/**
 * Parse a range string, e.g. '0-100' or '-100' or '0-'. Return the values
 * in an array of int or undefined (if not provided).
 **/
function _parse_range(range)
{
  var matches = range.match(/^(\d+-\d+|\d+-|-\d+|\*)$/);
  if (!matches) {
    throw new Error(`Not a valid range: ${range}`);
  }

  var vals = matches[1].split('-').map((v) => {
    return v === '*' || v === '' ? undefined : parseInt(v);
  });

  if (vals[1] <= vals[0]) {
    throw new Error(`Invalid range: start "${vals[0]}" must be before end "${vals[1]}".`);
  }

  return [vals[0], vals[1]];
};


/**
 * Parse a range header value, e.g. unit=ranges, where ranges
 * are a comman separated list of individual ranges, and unit is any
 * custom unit string. If the unit (and equal sign) are not given, assume
 * 'bytes'.
 **/
function parse(range_str)
{
  var res = {};
  debug('Parse range header value:', range_str);
  var matches = range_str.match(/^(([^\s]+)=)?((?:(?:\d+-\d+|-\d+|\d+-),?)+)$/)
  if (!matches) {
    throw new Error(`Not a valid range header: ${range_str}`);
  }

  res.unit = matches[2] || 'bytes';
  res.range_str = matches[3];
  res.ranges = [];

  // Parse individual ranges
  var ranges = []
  res.range_str.split(',').forEach((range) => {
    ranges.push(_parse_range(range));
  });

  // Merge ranges into result.
  ranges.forEach((new_range) => {
    debug('Found range:', new_range);

    var is_merged = false;
    for (var i in res.ranges) {
      var old_range = res.ranges[i];

      // Skip if the new range is fully separate from the old range.
      if (old_range[1] + 1 < new_range[0] || new_range[1] + 1 < old_range[0]) {
        debug('Range does not overlap with', old_range);
        continue;
      }

      // If we know they're adjacent or overlapping, we construct the
      // merged range from the lower start and the higher end of both
      // ranges.
      var merged = [
        Math.min(old_range[0], new_range[0]),
        Math.max(old_range[1], new_range[1])
      ];
      res.ranges[i] = merged;
      is_merged = true;
      debug('Merged', new_range, 'into', old_range, 'as', merged);
    }

    if (!is_merged) {
      debug('Non-overlapping range!');
      res.ranges.push(new_range);
    }
  });

  // Finally, sort ranges
  res.ranges.sort((first, second) => {
    if (first[0] === second[0]) return 0; // Should not happen due to merging.
    return (first[0] < second[0]) ? -1 : 1;
  });

  debug('Result of parse is', res);
  return res;
}


/**
 * Async version of parse().
 **/
function parseAsync(range_str, cb)
{
  try {
    cb(parse(range_str));
  } catch (err) {
    cb(null, err);
  }
}

module.exports =
{
  parse: parse,
  parseAsync: parseAsync,
};
