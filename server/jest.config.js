module.exports = {
	globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.json'
		}
	},
	moduleFileExtensions: [
		'ts',
		'js'
	],
	transform: {
		'^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
	},
	testMatch: [
		'**/tests/**/*.test.(ts|js)'
	],
	moduleNameMapper: {
		// Jest tests must use @src alias, while src code may use @/* as src/*.
		'^@src(.*)$': '<rootDir>/src$1'
	},
	testEnvironment: 'node'
};
