
// Path require.main.paths as in lib/app.js
const path = require('path');
const project_root = path.resolve(__dirname, '..');
require.main.paths.push(path.resolve(project_root, 'lib'))
