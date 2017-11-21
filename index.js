#!/usr/bin/env node

"use strict";

import chalk from 'chalk';
import clear from 'clear';
import CLI from 'clui';
import figlet from 'figlet';
import inquirer from 'inquirer';
import Preferences from 'preferences';
import shell from 'shelljs'
import fs from 'fs';
import files from './lib/files';
import logger from './lib/logger';

const Spinner = CLI.Spinner;
const appList = ['small', 'large', 'shared']
const dirList = ['actions', 'components', 'selectors', 'const', '__tests__'];

clear();
console.log(
  chalk.yellow(
    figlet.textSync('Reify', {horizontalLayout: 'full'})
  )
);

function promptInput(previous, callback) {
  const questions = [
    {
      type: 'checkbox',
      name: 'app',
      message: 'Choose app to create component within:',
      choices: appList,
      default: previous ? previous.app : null,
      validate: value => {
        if (value.length) {
          return true;
        } else {
          return 'Please choose app to create component within.';
        }
      }
    },
    {
      name: 'name',
      type: 'input',
      message: 'Input component name:',
      default: previous ? previous.name : null,
      validate: value => {
        if (value.length) {
          return true;
        } else {
          return 'Please input a component name.';
        }
      }
    },
    {
      name: 'type',
      type: 'checkbox',
      message: 'What type of component do you want? :',
      choices: ['connected'],
      default: previous ? previous.type : null,
      validate: value => {
        if (value.length) {
          return true;
        } else {
          return 'Please enter what type of component you want.';
        }
      }
    }
  ];

  inquirer.prompt(questions).then(callback);
}

function getUserInput(callback) {
  const prefs = new Preferences('reify');

  logger.log('debug', `Reify prefs. ${JSON.stringify(prefs.saved)}`)

  promptInput(prefs.saved && prefs.saved.previous, items => {
    const status = new Spinner('Storing prefs, please wait...');
    status.start();
    if (items) {
      prefs.saved = { previous: items };
      logger.log('debug', `items stored: ${JSON.stringify(items)}`)
    }
    status.stop();
    return callback(null, items);
  });
}

function createDirs(input, callback) {
  inquirer.prompt(
    [
      {
        type: 'checkbox',
        name: 'dirs',
        message: 'Select the folders you wish to create:',
        choices: dirList,
        default: ['components']
      }
    ]
  ).then(answer => {
      if (answer.dirs.length) {
        answer.dirs.forEach(dir => {
          const dirPath = `./src/apps/${input.app}/${input.name}/${dir}`;
          if (files.directoryExists(dirPath)) {
            logger.log('error', chalk.red(`ERR: Already have that directory! ${dir}`));
            process.exit();
          }
          shell.mkdir('-p', dirPath)
        })
        return callback(null, answer.dirs);
      }
      logger.log('info', 'nothing to do.')
      return callback(null);
    }
  );
}

function createComponent(input, dirs, callback) {
  const boilerPlate = `import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export default class ${input.name} extends PureComponent {
  static propTypes = {}

  constructor(props) {
    super(props)

  }

  render() {

  }
}
`
  if (dirs.length) {
    dirs.forEach(dir => {
      const dirPath = `./src/apps/${input.app}/${input.name}/${dir}`
      if (!files.directoryExists(dirPath)) {
        logger.log('error', chalk.red(`ERR: That directory didn't exist! ${dir}`));
        process.exit();
      }
      fs.writeFileSync(`${dirPath}/${input.name}.js`, boilerPlate);
    })
    return callback(null);
  }
  logger.log('info', 'nothing to do.')
  return callback(null);
}

function setupFiles(input, dirs, callback) {
  const status = new Spinner('Setting up the files...');
  status.start();
  createComponent(input, dirs, err => {
    status.stop();
    if (err) {
      return callback(err);
    }
    return callback(null);
  })
}

function start(callback) {
  getUserInput((err, input) => {
    if (err) {
      return callback(err);
    }
    return callback(null, input);
  });
}

start((err, input) => {
  if (err) {
    logger.log('error', chalk.red(`Broke on start. ${JSON.stringify(err)}`));
    process.exit();
  }
  if (input) {
    logger.log('info', chalk.green('Successfully took input!'));
    createDirs(input, (err, dirs) => {
      if (err) {
        logger.log('error', chalk.red(`Broke on dir creation. ${JSON.stringify(err)}`));
        process.exit();
      }
      if (dirs) {
        logger.log('info', chalk.green('Successfully scaffolded dir(s)!'));
        setupFiles(input, dirs, err => {
          if (err) {
            logger.log('error', chalk.red(`Broke on file setup. ${JSON.stringify(err)}`));
            process.exit();
          }
          if (!err) {
            logger.log('info', chalk.green('Successfully cranked out component(s)!'));
          }
        });
      }
    });
  }
});