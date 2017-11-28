#!/usr/bin/env node
import chalk from 'chalk'
import clear from 'clear'
import CLI from 'clui'
import figlet from 'figlet'
import inquirer from 'inquirer'
import Preferences from 'preferences'
import shell from 'shelljs'
import fs from 'fs'
import { defineBaseAppPath, defineStandardAppNames, defineAppList } from './messages/snippets'
import standardIndex from './boilerPlate/standard/index'
import standardComponent from './boilerPlate/standard/component'
import standardContainer from './boilerPlate/standard/container'
import files from './lib/files'
import logger from './lib/logger'

const Spinner = CLI.Spinner
const dirList = ['actions', 'components', 'selectors', 'const', '__tests__']
const typeList = ['connected']
let appList = ['small/', 'large/', 'shared/']
let baseAppPath = './src/apps/'

clear()
console.log(
  chalk.yellow(
    figlet.textSync('Reify', { horizontalLayout: 'full' })
  )
)

function postDefinitionSteps(input0, previous, callback) {
  const questions = [
    {
      name: 'appName',
      type: 'checkbox',
      message: 'Choose appName',
      choices: appList,
      default: previous ? previous.appName : null,
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
      name: 'componentName',
      type: 'input',
      message: 'Input component name:',
      default: previous ? previous.componentName : null,
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
  inquirer.prompt(questions).then(input1 => callback({ ...input0, ...input1 }))
}

function definitionStepOne(input0, previous, callback0) {
  inquirer.prompt({
    name: 'defineStandardApps',
    type: 'confirm',
    message: defineStandardAppNames(previous && previous.appList ? previous.appList : appList),
    default: false,
  }).then(input1 => {
    const promptRecursive = (input2, callback1) => {
      inquirer.prompt({
        name: 'standardApp',
        type: 'input',
        message: 'Type an appName as a standard choice.',
        default: 'genericAppName',
        validate: value => {
          if (value.length) {
            return true
          }
          return 'Please type a valid appName.'
        },
      }).then(input3 => {
        const aggregate = { ...input2, ...input3 }

        if (aggregate.appList === undefined) {
          aggregate.appList = []
        }
        aggregate.appList.push(aggregate.standardApp)
        inquirer.prompt([
          {
            type: 'checkbox',
            name: 'addAnother',
            message: defineAppList(aggregate.appList),
            choices: ['Yes, add more appNames.', 'No, the list is fully populated. Move to next step.'],
            default: 'No, the list is fully populated. Move to next step.',
            validate: value => {
              if (value.length) {
                if (value.length > 1) {
                  return 'Please limit choice to one selection.'
                }
                return true
              }
              return 'Please choose to keep adding appNames or move on.'
            },
          },
        ]).then(input4 => callback1({ ...aggregate, ...input4 }))
      })
    }

    const fireRecursion = (inp, cb) => {
      promptRecursive(inp, input5 => {
        if (input5.addAnother[0] === 'Yes, add more appNames.') {
          cb(input5, cb)
          return
        }
        appList = input5.appList
        postDefinitionSteps(input5, previous, callback0)
      })
    }

    if (input1.defineStandardApps) {
      fireRecursion({ ...input0, ...input1 }, fireRecursion)
      return
    }
    postDefinitionSteps({ ...input0, ...input1 }, previous, callback0)
  })
}

function promptInput(previous, callback) {
  inquirer.prompt({
    name: 'defineBaseAppPath',
    type: 'confirm',
    message: defineBaseAppPath(
      previous && previous.baseAppPath ? previous.baseAppPath : baseAppPath
    ),
    default: false,
  }).then(input => {
    if (input.defineBaseAppPath) {
      inquirer.prompt({
        name: 'baseAppPath',
        type: 'input',
        message: 'Type a valid path starting with "./" and ending with "/", to use as the base directory for adding new components.',
        default: previous ? previous.baseAppPath : './...',
        validate: value => {
          if (value.length && value.length > 1 && value.substring(0, 2) === './' && value.slice(-1) === '/') {
            return true
          }
          return 'Please input a valid path.'
        },
      }).then(optInput => definitionStepOne({ ...input, ...optInput }, previous, callback))
      return
    }
    definitionStepOne(input, previous, callback)
  })
}

function setupDirs(input, dirs, callback) {
  dirs.forEach(dir => {
    const dirPath = `${baseAppPath}${input.appName}${input.componentName}/${dir}`

    if (files.directoryExists(dirPath)) {
      logger.log('error', chalk.red(`ERR: Already have that directory! ${dir}`))
      process.exit()
    }
    shell.mkdir('-p', dirPath)
  })
  callback(null, dirs)
}

function promptDirs(previous, input, callback) {
  inquirer.prompt([
    {
      type: 'checkbox',
      name: 'dirs',
      message: 'Select the directories you wish to create:',
      choices: dirList,
      default: previous || ['components'],
      validate: value => {
        if (value.length) {
          return true
        }
        return 'Please choose a directory or several.'
      },
    },
  ]).then(answer => {
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
      if (input.defineBaseAppPath && input.baseAppPath) {
        baseAppPath = input.baseAppPath
      }
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

function createComponent(dirPath, fileName, component, callback) {
  if (!files.directoryExists(dirPath)) {
    logger.log('error', chalk.red(`ERR: That directory didn't exist! ${dirPath}`))
    process.exit()
  }
  fs.writeFileSync(`${dirPath}/${fileName}.js`, component)
  callback(null)
}

function generateFiles(input, dirs, callback) {
  if (dirs.length) {
    const status = new Spinner('Generating the files...')
    status.start()
    dirs.forEach(dir => {
      if (dir === 'components') {
        const dirPath = `${baseAppPath}${input.appName}${input.componentName}/${dir}`
        createComponent(dirPath, input.componentName, standardComponent(input), err => {
          if (err) {
            callback(err)
          }
        })
      }
    })
    const dirPath = `${baseAppPath}${input.appName}${input.componentName}/`
    createComponent(dirPath, 'index', standardIndex(input), err0 => {
      if (err0) {
        callback(err0)
        return
      }
      createComponent(dirPath, 'container', standardContainer(input), err1 => {
        if (err1) {
          callback(err1)
          return
        }
        status.stop()
        callback(null)
      })
    })
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
