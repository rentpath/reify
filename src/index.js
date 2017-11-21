#!/usr/bin/env node
import chalk from 'chalk'
import clear from 'clear'
import CLI from 'clui'
import figlet from 'figlet'
import inquirer from 'inquirer'
import Preferences from 'preferences'
import shell from 'shelljs'
import fs from 'fs'
import boilerPlate from './bin/boilerPlate'
import files from './lib/files'
import logger from './lib/logger'

const Spinner = CLI.Spinner
const appList = ['small', 'large', 'shared']
const dirList = ['actions', 'components', 'selectors', 'const', '__tests__']
const typeList = ['connected']

clear()
console.log(
  chalk.yellow(
    figlet.textSync('Reify', { horizontalLayout: 'full' })
  )
)

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
          if (value.length > 1) {
            return 'Please limit choice to one selection.'
          }
          return true
        }
        return 'Please choose an app to create component within.'
      },
    },
    {
      name: 'name',
      type: 'input',
      message: 'Input component name:',
      default: previous ? previous.name : null,
      validate: value => {
        if (value.length) {
          return true
        }
        return 'Please input a component name.'
      },
    },
    {
      name: 'type',
      type: 'checkbox',
      message: 'What type of component do you want? :',
      choices: typeList,
      default: previous ? previous.type : null,
      validate: value => {
        if (value.length) {
          return true
        }
        return 'Please enter what type of component you want.'
      },
    },
  ]

  inquirer.prompt(questions).then(callback)
}

function setupDirs(input, dirs, callback) {
  dirs.forEach(dir => {
    const dirPath = `./src/apps/${input.app}/${input.name}/${dir}`

    if (files.directoryExists(dirPath)) {
      logger.log('error', chalk.red(`ERR: Already have that directory! ${dir}`))
      process.exit()
    }
    shell.mkdir('-p', dirPath)
  })
  callback(null, dirs)
}

function promptDirs(previous, input, callback) {
  inquirer.prompt(
    [
      {
        type: 'checkbox',
        name: 'dirs',
        message: 'Select the directories you wish to create:',
        choices: dirList,
        default: previous || ['components'],
      },
    ]
  ).then(answer => {
    if (answer.dirs.length) {
      setupDirs(input, answer.dirs, callback)
      return
    }
    logger.log('info', 'nothing to do.')
    callback(null)
  })
}

function getUserInput(callback) {
  const prefs = new Preferences('reify')

  logger.log('debug', `Reify prefs. ${JSON.stringify(prefs.saved)}`)

  promptInput(prefs.saved && prefs.saved.input, input => {
    if (input) {
      promptDirs(prefs.saved && prefs.saved.dirs, input, (err, dirs) => {
        if (dirs) {
          const status = new Spinner('Storing prefs, please wait...')
          status.start()
          prefs.saved = { input, dirs }
          logger.log('debug', `items stored: ${JSON.stringify(prefs.saved)}`)
          status.stop()
          callback(null, input, dirs)
          return
        }
        callback('No dirs created.')
      })
      return
    }
    callback('No inputs obtained.')
  })
}

function createComponent(input, dir, callback) {
  const dirPath = `./src/apps/${input.app}/${input.name}/${dir}`

  if (!files.directoryExists(dirPath)) {
    logger.log('error', chalk.red(`ERR: That directory didn't exist! ${dir}`))
    process.exit()
  }
  fs.writeFileSync(`${dirPath}/${input.name}.js`, boilerPlate(input))
  callback(null)
}

function generateFiles(input, dirs, callback) {
  if (dirs.length) {
    const status = new Spinner('Generating the files...')
    status.start()
    dirs.forEach(dir => {
      if (dir === 'components') {
        createComponent(input, dir, err => {
          if (err) {
            callback(err)
          }
        })
      }
    })
    status.stop()
    callback(null)
    return
  }
  logger.log('info', 'nothing to do.')
  callback(null)
}

function start(callback) {
  getUserInput((err, input, dirs) => {
    if (err) {
      callback(err)
      return
    }
    callback(null, input, dirs)
  })
}

start((err, input, dirs) => {
  if (err) {
    logger.log('error', chalk.red(`Broke on start. ${JSON.stringify(err)}`))
    process.exit()
  }
  if (!input || !dirs) {
    logger.log('error', chalk.red('Broke on user input.'))
    process.exit()
  }
  if (input && dirs) {
    logger.log('info', chalk.green('Inputs accepted!'))
    logger.log('info', chalk.green('Successfully scaffolded dir(s)!'))
    generateFiles(input, dirs, __err => {
      if (__err) {
        logger.log('error', chalk.red(`Broke on file generation. ${JSON.stringify(__err)}`))
        process.exit()
      }
      if (!__err) {
        logger.log('info', chalk.green('Successfully cranked out component(s)!'))
      }
    })
  }
})
