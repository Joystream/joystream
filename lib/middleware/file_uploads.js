'use strict';

const multer = require('multer');

// Taken from express-openapi examples
module.exports = function(req, res, next)
{
  multer().any()(req, res, function(err) {
    if (err) {
      return next(err);
    }
    // Handle both single and multiple files
    const filesMap = req.files.reduce(
      (acc, f) =>
        Object.assign(acc, {
          [f.fieldname]: (acc[f.fieldname] || []).concat(f)
        }),
      {}
    );
    Object.keys(filesMap).forEach(fieldname => {
      const files = filesMap[fieldname];
      req.body[fieldname] = files.length > 1 ? files.map(() => '') : '';
    });
    return next();
  });
}
