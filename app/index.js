/// <reference path="../typings/tsd.d.ts" />

'use strict';

var lodash = require('lodash'),
	sprintf = require('sprintf-js').sprintf,
	yeoman = require('yeoman-generator'),
	chalk = require('chalk'),
	yosay = require('yosay'),
	path = require('path'),
	logHelper = require('../common/log-helper.js'),
	logError = logHelper.logError, logSuccess = logHelper.logSuccess, logWarning = logHelper.logWarning,
	mkdirp = require('mkdirp');

module.exports = yeoman.Base.extend({
	constructor: function () {
		yeoman.Base.apply(this, arguments);

		if (this.destinationRoot() !== process.cwd()) {
			logError('Please run this command from the root folder of your project!');
			process.exit(1);
		}

		if (process.argv[2] !== 'greymind') {
			logError('Please check the generator name. Unsupported generator: ' + process.argv[2].split(':')[1]);
			process.exit(2);
		}

		this.argument('AppName', { type: String, required: true });
		this.AppName = lodash.camelCase(this.AppName);
		this.AppName = lodash.capitalize(this.AppName);
	},
	prompting: function () {
		this.log(yosay(
			'Welcome to the ' + chalk.bgBlue.black.bold('Greymind') + ' generator!'
			));
	},
	configuring: function () {
		this.config.set('AppName', this.AppName);
		this.log('App name set to ' + chalk.blue(this.AppName) + '!');

		this.BooleanChalk = function (bool) {
			return bool ? chalk.green('True') : chalk.red('False');
		}
	},
	writing: function () {
		this.log('Creating app folders...');
		mkdirp('client/app');
		mkdirp('client/content/images');
		mkdirp('client/content/css');
		mkdirp('client/common');
		mkdirp('client/lib');
		mkdirp('client/tests');
		mkdirp('server');
		mkdirp('server/common');
		mkdirp('server/tests');
		mkdirp('common');

		this.AppNameForConfig = lodash.kebabCase(this.AppName);

		this.CopyTemplate = function (fromTo, context) {
			return this.fs.copyTpl(this.templatePath(fromTo), this.destinationPath(fromTo), context);
		}
		
		// Git Ignore
		this.CopyTemplate('.gitignore');
		
		// Hosting
		this.CopyTemplate('web.config');
		this.CopyTemplate('iisnode.yml');
		this.CopyTemplate('.deployment');
		this.CopyTemplate('deploy.cmd');
		
		// Npm
		this.CopyTemplate('.npmignore');
		this.CopyTemplate('package.json',
			{
				AppName: this.AppName,
				AppNameForConfig: this.AppNameForConfig
			});
			
		// Bower
		this.CopyTemplate('bower.json', { AppNameForConfig: this.AppNameForConfig });
			
		// Tsd
		this.CopyTemplate('tsd.json');
		
		// Gulp
		this.CopyTemplate('gulpfile.js');
		this.CopyTemplate('gulp-common.js');
		this.CopyTemplate('tasks/compile-lib.js');
		this.CopyTemplate('tasks/compile-js.js');
		this.CopyTemplate('tasks/compile-sass.js');
		
		// Client App
		this.CopyTemplate('client/app/app.js', { AppName: this.AppName });
		
		// Index Controller
		this.CopyTemplate('client/app/index.controller.js',
			{
				AppName: this.AppName,
				AppTitle: lodash.startCase(this.AppName)
			});
			
		// Index View
		this.CopyTemplate('client/index.html', { AppName: this.AppName });
			
		// Home
		this.composeWith('greymind:ngcontroller', { args: ['Home'] });
		this.composeWith('greymind:ngview', { args: ['Home'] });
		
		// Content
		this.CopyTemplate('client/content/images/favicon.png');
		this.CopyTemplate('client/content/sass/app.scss');
		
		// Server App
		this.CopyTemplate('server/app.js');
		
		// APIs
		this.CopyTemplate('server/api/config.json');
		this.CopyTemplate('server/api/monitoring.js');
		this.CopyTemplate('server/api/items.js');
		this.CopyTemplate('server/api/g-recaptcha.js');
	},
	install: function () {
		this.installDependencies();
	},
	end: function () {
		this.spawnCommand('./node_modules/.bin/tsd', ['install']);
		this.spawnCommand('./node_modules/.bin/gulp', ['Build']);
	}
});

// initializing - Your initialization methods (checking current project state, getting configs, etc)
// prompting - Where you prompt users for options (where you'd call this.prompt())
// configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
// default
// writing - Where you write the generator specific files (routes, controllers, etc)
// conflicts - Where conflicts are handled (used internally)
// install - Where installation are run (npm, bower)
// end - Called last, cleanup, say good bye, etc