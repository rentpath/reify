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
const functionalTypesChoices = ['actions', 'components', 'const', 'container', 'index', 'reducer', 'selectors', '__tests__']
const componentTypesChoices = ['functional', 'class', 'connected']
let appDomainChoices = ['small/', 'large/', 'shared/']
let baseAppPath = './src/apps/'

clear()
console.log(
  chalk.yellow(
    figlet.textSync('Reify', { horizontalLayout: 'full' })
  )
)

const makeValidator = opts => (value => {
  const conditional = opts.specialRule ? opts.specialRule(value) : value.length

  if (conditional) {
    if (opts.nestedMessage && conditional > 1) {
      return opts.nestedMessage
    }
    return true
  }
  return opts.message
})

function handleErr(err, msg) {
  if (err) {
    logger.log('error', chalk.red(`${msg} ${JSON.stringify(err)}`))
    process.exit()
  }
}

function postInput(input0, previous, callback) {
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

function promptInputOne(input0, previous, callback0) {
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
        postInput(input5, previous, callback0)
      })
    }

    if (input1.defineStandardApps) {
      fireRecursion({ ...input0, ...input1 }, fireRecursion)
      return
    }
    postInput({ ...input0, ...input1 }, previous, callback0)
  })
}

function promptInputZero(previous, callback) {
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
      }).then(optInput => promptInputOne({ ...input, ...optInput }, previous, callback))
      return
    }
    promptInputOne(input, previous, callback)
  })
}

function setupFunctionalTypes(input, functionalTypes, callback) {
  const componentPath = `${baseAppPath}${input.appDomain}${input.componentName}`
  handleErr(files.directoryExists(componentPath), `ERR: Already have that component! ${componentPath}`)
  shell.mkdir('-p', componentPath)

  functionalTypes.forEach(functionalType => {
    if (functionalType === 'components') {
      const functionalTypePath = `${componentPath}/${functionalType}`
      handleErr(files.directoryExists(functionalTypePath), `ERR: Already have that functional type! ${functionalType}`)
      shell.mkdir('-p', functionalTypePath)
    }
  })
  callback(null, functionalTypes)
}

function promptFunctionalTypes(previous, input, callback) {
  inquirer.prompt([
    {
      type: 'checkbox',
      name: 'functionalTypes',
      message: 'Select the functional types you wish to be created:',
      choices: functionalTypesChoices,
      default: previous || ['components'],
      validate: makeValidator({ message: 'Please choose a functional type or several.' }),
    },
  ]).then(answer => {
    if (answer.functionalTypes.length) {
      setupFunctionalTypes(input, answer.functionalTypes, callback)
      return
    }
    logger.log('info', 'nothing to do.')
    callback(null)
  })
}

function getUserInput(callback) {
  const prefs = new Preferences('reify')

  logger.log('debug', `Reify prefs. ${JSON.stringify(prefs.saved)}`)

  promptInputZero(prefs.saved && prefs.saved.input, input => {
    if (input) {
      if (prefs.saved && prefs.saved.input && prefs.saved.input.baseAppPath) {
        baseAppPath = prefs.saved.input.baseAppPath
      }
      if (input.defineBaseAppPath && input.baseAppPath) {
        baseAppPath = input.baseAppPath
      }
      promptFunctionalTypes(
        prefs.saved && prefs.saved.functionalTypes,
        input,
        (err, functionalTypes) => {
          if (functionalTypes) {
            const status = new Spinner('Storing prefs, please wait...')
            status.start()
            prefs.saved = { input, functionalTypes }
            logger.log('debug', `items stored: ${JSON.stringify(prefs.saved)}`)
            status.stop()
            callback(null, input, functionalTypes)
            return
          }
          callback('No functional types created.')
        }
      )
      return
    }
    callback('No inputs obtained.')
  })
}

function createComponent(functionalTypePath, fileName, component, callback) {
  handleErr(files.directoryExists(!files.directoryExists(functionalTypePath)), `ERR: That directory didn't exist! ${functionalTypePath}`)
  fs.writeFileSync(`${functionalTypePath}/${fileName}.js`, component)
  callback(null)
}

function generateFiles(input, functionalTypes, callback) {
  if (functionalTypes.length) {
    const status = new Spinner('Generating the files...')
    status.start()
    functionalTypes.forEach(functionalType => {
      if (functionalType === 'components') {
        const functionalTypePath = `${baseAppPath}${input.appDomain}${input.componentName}/${functionalType}`
        createComponent(functionalTypePath, input.componentName, _component(input), err => {
          if (err) {
            callback(err)
          }
        })
      }
    })
    const functionalTypePath = `${baseAppPath}${input.appDomain}${input.componentName}/`
    createComponent(functionalTypePath, 'index', _index(input), err0 => {
      if (err0) {
        callback(err0)
        return
      }
      createComponent(functionalTypePath, 'container', _container(input), err1 => {
        if (err1) {
          callback(err1)
          return
        }
        createComponent(functionalTypePath, 'const', _const(input), err2 => {
          if (err2) {
            callback(err2)
            return
          }
          createComponent(functionalTypePath, 'actions', _actions(), err3 => {
            if (err3) {
              callback(err3)
              return
            }
            createComponent(functionalTypePath, 'reducer', _reducer(), err4 => {
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
  getUserInput((err, input, functionalTypes) => {
    if (err) {
      callback(err)
      return
    }
    callback(null, input, functionalTypes)
  })
}

start((err, input, functionalTypes) => {
  handleErr(err, 'Broke on start.')
  handleErr(!input || !functionalTypes, 'Broke on user input.')
  if (input && functionalTypes) {
    logger.log('info', chalk.green('Inputs accepted!'))
    logger.log('info', chalk.green('Successfully scaffolded functional type(s)!'))
    generateFiles(input, functionalTypes, __err => {
      handleErr(__err, 'Broke on component generation.')
      if (!__err) {
        logger.log('info', chalk.green('Successfully cranked out component(s)!'))
      }
    })
  }
})
