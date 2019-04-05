'use strict';

const debug = require('debug')('joystream:filter');

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;
const DEFAULT_ACCEPT_TYPES = [
  'video/*',
  'audio/*',
  'image/*',
];
const DEFAULT_REJECT_TYPES = [];

// Configuration defaults
function config_defaults(config)
{
  const filter =  config.filter || {};

  // We accept zero as switching this check off.
  if (typeof filter.max_size == 'undefined' || typeof filter.max_size == 'null') {
    filter.max_size = DEFAULT_MAX_FILE_SIZE;
  }

  // Figure out mime types
  filter.mime = filter.mime || [];
  filter.mime.accept = filter.mime.accept || DEFAULT_ACCEPT_TYPES;
  filter.mime.reject = filter.mime.reject || DEFAULT_REJECT_TYPES;

  return filter;
}

// Mime type matching
function mime_matches(acceptable, provided)
{
  if (acceptable.endsWith('*')) {
    // Wildcard match
    const prefix = acceptable.slice(0, acceptable.length - 1);
    debug('wildcard matching', provided, 'against', acceptable, '/', prefix);
    return provided.startsWith(prefix);
  }
  // Exact match
  debug('exact matching', provided, 'against', acceptable);
  return provided == acceptable;
}

function mime_matches_any(accept, reject, provided)
{
  // Pass accept
  var accepted = false;
  for (var item of accept) {
    if (mime_matches(item, provided)) {
      debug('Content type matches', item, 'which is acceptable.');
      accepted = true;
      break;
    }
  }
  if (!accepted) {
    return false;
  }

  // Don't pass reject
  for (var item of reject) {
    if (mime_matches(item, provided)) {
      debug('Content type matches', item, 'which is unacceptable.');
      return false;
    }
  }

  return true;
}

/**
 * Simple filter function deciding whether or not to accept a content
 * upload.
 *
 * This is a straightforward implementation of
 * https://github.com/Joystream/storage-node-joystream/issues/14 - but should
 * most likely be improved on in future.
 **/
function filter_func(config, headers, mime_type)
{
  const filter = config_defaults(config);

  // Enforce maximum file upload size
  if (filter.max_size) {
    const size = parseInt(headers['content-length'], 10);
    if (!size) {
      return {
        code: 411,
        message: 'A Content-Length header is required.',
      };
    }

    if (size > filter.max_size) {
      return {
        code: 413,
        message: 'The provided Content-Length is too large.',
      };
    }
  }

  // Enforce mime type based filtering
  if (!mime_matches_any(filter.mime.accept, filter.mime.reject, mime_type)) {
    return {
      code: 415,
      message: 'Content has an unacceptable MIME type.',
    };
  }

  return {
    code: 200,
  };
}

module.exports = filter_func;
