module.exports = function(config) {
  config.set({
    // Base path, used for files and exclude properties
    basePath: '',
    
    // Test frameworks
    frameworks: ['jasmine', 'karma-typescript'],
    
    // Files to load into the browser
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/main.ts',
      'src/ai.service.spec.ts',
      'src/sample.spec.js'
    ],
    
    // List of files to exclude
    exclude: [],
    
    // Preprocess files before loading them into the browser
    preprocessors: {
      '**/*.ts': ['karma-typescript']
    },
    
    // Karma-TypeScript configuration
    karmaTypescriptConfig: {
      compilerOptions: {
          target: "ES2022",
          module: "ES2022", // Use ES modules instead of CommonJS
          moduleResolution: "node",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          types: ["vite/client", "jasmine"],
          skipLibCheck: true,
          noEmit: true,
          verbatimModuleSyntax: false,
          allowSyntheticDefaultImports: true
        },
        coverageOptions: {
          instrumentation: false // Disable coverage report functionality
        },
      include: ['src/**/*.ts'],
      exclude: ['node_modules']
    },
    
    // Test result reporters
    reporters: ['progress'],
    
    // Server port
    port: 9876,
    
    // Enable/disable colors in output
    colors: true,
    
    // Log level
    logLevel: config.LOG_INFO,
    
    // Enable/disable auto watching files for changes
    autoWatch: true,
    
    // Browsers to launch for testing
    browsers: ['ChromeHeadless'], // Use headless Chrome to avoid browser crashes
    
    // ChromeHeadless configuration
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-web-security'
        ]
      }
    },
    
    // Continuous integration mode
    // Set to true, Karma will launch browsers, run tests and exit
    singleRun: true,
    
    // Concurrency level
    // Number of browsers to run in parallel
    concurrency: Infinity
  })
}
