#!/usr/bin/env node
import chalk from 'chalk'
import clear from 'clear'
import CLI from 'clui'
import figlet from 'figlet'
import inquirer from 'inquirer'
import Preferences from 'preferences'
import shell from 'shelljs'
import fs from 'fs'
import { defineBaseAppPath, promptAppDomainChoices, promptAppDomain } from './messages'
import {
  _index,
  _component,
  _container,
  _const,
  _actions,
  _reducer,
} from './templates'
import files from './lib/files'
import logger from './lib/logger'

const Spinner = CLI.Spinner
const functionTypesChoices = ['actions', 'components', 'const', 'container', 'index', 'reducer', 'selectors', '__tests__']
const componentTypesChoices = ['functional', 'class', 'connected']
let appDomainChoices = ['small/', 'large/', 'shared/']
let baseAppPath = './src/apps/'

clear()
console.log(
  chalk.yellow(
    figlet.textSync('Reify', { horizontalLayout: 'full' })
  )
)

const makeValidator = opts => {
  return value => {
    const conditional = opts.specialRule ? opts.specialRule(value) : value.length

    if (conditional) {
      if (opts.nestedMessage && conditional > 1) {
        return opts.nestedMessage
      }
      return true
    }
    return opts.message
  }
}

function handleErr(err, msg) {
  if (err) {
    logger.log('error', chalk.red(`${msg} ${JSON.stringify(err)}`))
    process.exit()
  }
}

function postDefinitionSteps(input0, previous, callback) {
  if (previous.appDomainChoices) {
    appDomainChoices = previous.appDomainChoices
  }
  if (input0.appDomainChoices) {
    appDomainChoices = input0.appDomainChoices
  }
  const questions = [
    {
      name: 'appDomain',
      type: 'checkbox',
      message: 'Choose an appDomain',
      choices: appDomainChoices,
      default: previous ? previous.appDomain : null,
      validate: makeValidator({
        message: 'Please choose an app domain to create component within.',
        nestedMessage: 'Please limit choice to one selection.',
      }),
    },
    {
      name: 'componentName',
      type: 'input',
      message: 'Input a component name:',
      default: previous ? previous.componentName : null,
      validate: makeValidator({ message: 'No name input was entered. Please try again.' }),
    },
    {
      name: 'componentType',
      type: 'checkbox',
      message: 'What component type should be used? :',
      choices: componentTypesChoices,
      default: previous ? previous.componentType : null,
      validate: makeValidator({ message: 'Please select what component type you want.' }),
    },
  ]
  inquirer.prompt(questions).then(input1 => callback({ ...input0, ...input1 }))
}

function definitionStepOne(input0, previous, callback0) {
  inquirer.prompt({
    name: 'defineStandardApps',
    type: 'confirm',
    message: promptAppDomainChoices(
      previous && previous.appDomainChoices ? previous.appDomainChoices : appDomainChoices
    ),
    default: false,
  }).then(input1 => {
    const promptRecursive = (input2, callback1) => {
      inquirer.prompt({
        name: 'standardApp',
        type: 'input',
        message: 'Input an appDomain name, which will be added to the choices.',
        default: 'genericAppDomainName',
        validate: makeValidator({ message: 'No appDomain input was entered. Please try again.' }),
      }).then(input3 => {
        const aggregate = { ...input2, ...input3 }

        if (aggregate.appDomainChoices === undefined) {
          aggregate.appDomainChoices = []
        }
        aggregate.appDomainChoices.push(aggregate.standardApp)
        inquirer.prompt([
          {
            type: 'checkbox',
            name: 'addAnother',
            message: promptAppDomain(aggregate.appDomainChoices),
            choices: ['Yes, add more appDomains.', 'No, the list is fully populated. Move to next step.'],
            default: 'No, the list is fully populated. Move to next step.',
            validate: makeValidator({
              message: 'Please choose to keep adding appDomains or move on.',
              nestedMessage: 'Please limit choice to one selection.',
            }),
          },
        ]).then(input4 => callback1({ ...aggregate, ...input4 }))
      })
    }

    const fireRecursion = (inp, cb) => {
      promptRecursive(inp, input5 => {
        if (input5.addAnother[0] === 'Yes, add more appDomains.') {
          cb(input5, cb)
          return
        }
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
        validate: makeValidator({
          message: 'Please input a valid path.',
          specialRule: value => value.length && value.length > 1 && value.substring(0, 2) === './' && value.slice(-1) === '/',
        }),
      }).then(optInput => definitionStepOne({ ...input, ...optInput }, previous, callback))
      return
    }
    definitionStepOne(input, previous, callback)
  })
}

function setupFunctionTypes(input, functionTypes, callback) {
  const componentPath = `${baseAppPath}${input.appDomain}${input.componentName}`
  handleErr(files.directoryExists(componentPath), `ERR: Already have that component! ${componentPath}`)
  shell.mkdir('-p', componentPath)

  functionTypes.forEach(functionType => {
    if (functionType === 'components') {
      const functionTypePath = `${componentPath}/${functionType}`
      handleErr(files.directoryExists(functionTypePath), `ERR: Already have that function type! ${functionType}`)
      shell.mkdir('-p', functionTypePath)
    }
  })
  callback(null, functionTypes)
}

function promptFunctionTypes(previous, input, callback) {
  inquirer.prompt([
    {
      type: 'checkbox',
      name: 'functionTypes',
      message: 'Select the function types you wish to include:',
      choices: functionTypesChoices,
      default: previous || ['components'],
      validate: makeValidator({ message: 'Please choose a function type or several.' }),
    },
  ]).then(answer => {
    if (answer.functionTypes.length) {
      setupFunctionTypes(input, answer.functionTypes, callback)
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
      if (prefs.saved && prefs.saved.input && prefs.saved.input.baseAppPath) {
        baseAppPath = prefs.saved.input.baseAppPath
      }
      if (input.defineBaseAppPath && input.baseAppPath) {
        baseAppPath = input.baseAppPath
      }
      promptFunctionTypes(prefs.saved && prefs.saved.functionTypes, input, (err, functionTypes) => {
        if (functionTypes) {
          const status = new Spinner('Storing prefs, please wait...')
          status.start()
          prefs.saved = { input, functionTypes }
          logger.log('debug', `items stored: ${JSON.stringify(prefs.saved)}`)
          status.stop()
          callback(null, input, functionTypes)
          return
        }
        callback('No function types created.')
      })
      return
    }
    callback('No inputs obtained.')
  })
}

function createComponent(functionTypePath, fileName, component, callback) {
  handleErr(files.directoryExists(!files.directoryExists(functionTypePath)), `ERR: That directory didn't exist! ${functionTypePath}`)
  fs.writeFileSync(`${functionTypePath}/${fileName}.js`, component)
  callback(null)
}

function generateFiles(input, functionTypes, callback) {
  if (functionTypes.length) {
    const status = new Spinner('Generating the files...')
    status.start()
    functionTypes.forEach(functionType => {
      if (functionType === 'components') {
        const functionTypePath = `${baseAppPath}${input.appDomain}${input.componentName}/${functionType}`
        createComponent(functionTypePath, input.componentName, _component(input), err => {
          if (err) {
            callback(err)
          }
        })
      }
    })
    const functionTypePath = `${baseAppPath}${input.appDomain}${input.componentName}/`
    createComponent(functionTypePath, 'index', _index(input), err0 => {
      if (err0) {
        callback(err0)
        return
      }
      createComponent(functionTypePath, 'container', _container(input), err1 => {
        if (err1) {
          callback(err1)
          return
        }
        createComponent(functionTypePath, 'const', _const(input), err2 => {
          if (err2) {
            callback(err2)
            return
          }
          createComponent(functionTypePath, 'actions', _actions(), err3 => {
            if (err3) {
              callback(err3)
              return
            }
            createComponent(functionTypePath, 'reducer', _reducer(), err4 => {
              if (err4) {
                callback(err4)
                return
              }
              status.stop()
              callback(null)
            })
          })
        })
      })
    })
    return
  }
  logger.log('info', 'nothing to do.')
  callback(null)
}

function start(callback) {
  getUserInput((err, input, functionTypes) => {
    if (err) {
      callback(err)
      return
    }
    callback(null, input, functionTypes)
  })
}

start((err, input, functionTypes) => {
  handleErr(err, 'Broke on start.')
  handleErr(!input || !functionTypes, 'Broke on user input.')
  if (input && functionTypes) {
    logger.log('info', chalk.green('Inputs accepted!'))
    logger.log('info', chalk.green('Successfully scaffolded function type(s)!'))
    generateFiles(input, functionTypes, __err => {
      handleErr(__err, 'Broke on component generation.')
      if (!__err) {
        logger.log('info', chalk.green('Successfully cranked out component(s)!'))
      }
    })
  }
})
