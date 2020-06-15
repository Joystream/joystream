// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
	// The directory where Jest should store its cached dependency information
	cacheDirectory: ".jest-cache",

	// Automatically clear mock calls and instances between every test
	clearMocks: true,

	// The directory where Jest should output its coverage files
	coverageDirectory: ".coverage",

	// An array of regexp pattern strings used to skip coverage collection
	coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/packages/(?:.+?)/dist/"],

	// An array of directory names to be searched recursively up from the requiring module's location
	moduleDirectories: ["node_modules", "packages"],

	// An array of file extensions your modules use
	moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node"],
	// Run tests from one or more projects
	projects: ["<rootDir>", "<rootDir>/packages/*"],

	// A list of paths to modules that run some code to configure or set up the testing framework before each test
	setupFilesAfterEnv: ["<rootDir>/setupTests.js"],

	// An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
	testPathIgnorePatterns: ["/node_modules/", "<rootDir>/packages/(?:.+?)/dist/"],
};
