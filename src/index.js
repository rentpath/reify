#!/usr/bin/env node
import 'babel-polyfill'
import chalk from 'chalk'
import clear from 'clear'
import CLI from 'clui'
import figlet from 'figlet'
import inquirer from 'inquirer'
import Preferences from 'preferences'
import shell from 'shelljs'
import fs from 'fs'
import { defineBaseAppPath, promptAppDomainChoices, promptAppDomain, promptDucksMessage, promptNestStructureMessage } from './messages'
import {
  _index,
  _component,
  _functional,
  _container,
  _const,
  _actions,
  _reducer,
  _selector,
  _test,
} from './templates'
import files from './lib/files'
import logger from './lib/logger'
import {
  ducksChoices,
  componentParadigmChoices,
  reduxComponentTypeChoices,
  nestStructureChoices,
  addAnotherChoices,
} from './const'

const Spinner = CLI.Spinner

let appDomainChoices = ['small', 'large', 'shared']
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
    if (opts.nestedRule && opts.nestedRule(value)) {
      return opts.nestedRuleMessage
    }

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

function promptInputTwo(input0, previous, callback) {
  if (previous && previous.appDomainChoices) {
    appDomainChoices = previous.appDomainChoices
  }
  if (input0 && input0.appDomainChoices) {
    appDomainChoices = input0.appDomainChoices
  }
  const questions = [
    {
      name: 'appDomain',
      type: 'checkbox',
      message: 'Choose an appDomain:',
      choices: appDomainChoices,
      default: previous ? previous.appDomain : [appDomainChoices[0]],
      validate: makeValidator({
        message: 'Please choose an app domain to create component within.',
        nestedMessage: 'Please limit choice to one selection.',
      }),
    },
    {
      name: 'componentName',
      type: 'input',
      message: 'Input a component name:',
      default: previous ? previous.componentName : 'MyGreatNewComponent',
      validate: makeValidator({ message: 'No name input was entered. Please try again.' }),
    },
    {
      name: 'componentParadigm',
      type: 'list',
      message: 'What ReactJS component paradigm should be used by the component to be created?',
      choices: componentParadigmChoices,
      default: previous ? previous.componentParadigm : componentParadigmChoices[0],
      validate: makeValidator({ message: 'Please select what component paradigm you want used.' }),
    },
    {
      name: 'reduxComponentType',
      type: 'list',
      message: 'What redux component type should be used?',
      choices: reduxComponentTypeChoices,
      default: previous ? previous.reduxComponentType : reduxComponentTypeChoices[0],
      validate: makeValidator({ message: 'Please select what redux type you want used.' }),
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
        validate: makeValidator({
          message: 'Please input a valid appDomain.',
          specialRule: value => (
            value.length &&
            value.length > 1 &&
            !/\s/.test(value)
          ),
        }),
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
            choices: addAnotherChoices,
            default: addAnotherChoices[1],
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
        if (input5.addAnother[0] === addAnotherChoices[0]) {
          cb(input5, cb)
          return
        }
        promptInputTwo(input5, previous, callback0)
      })
    }

    if (input1.defineStandardApps) {
      fireRecursion({ ...input0, ...input1 }, fireRecursion)
      return
    }
    promptInputTwo({ ...input0, ...input1 }, previous, callback0)
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
          specialRule: value => (
            value.length &&
            value.length > 1 &&
            value.substring(0, 2) === './' &&
            value.slice(-1) === '/' &&
            !/\s/.test(value)
          ),
        }),
      }).then(optInput => promptInputOne({ ...input, ...optInput }, previous, callback))
      return
    }
    promptInputOne(input, previous, callback)
  })
}

function setupDucks(_input, callback) {
  const input = { ..._input, ducks: [..._input.ducks, 'components', 'index', '__tests__'] }
  const componentPath = `${baseAppPath}${input.appDomain}/${input.componentName}`
  handleErr(files.directoryExists(componentPath), `ERR: Already have that component! ${componentPath}`)
  shell.mkdir('-p', componentPath)

  if (input.ducks && input.nestStructure === nestStructureChoices[0]) {
    input.ducks.forEach(duck => {
      if (
        duck === 'components' || duck === '__tests__' || duck === 'selectors'
      ) {
        const duckPath = `${componentPath}/${duck}`
        handleErr(files.directoryExists(duckPath), `ERR: Already have that duck! ${duck}`)
        shell.mkdir('-p', duckPath)
      }
    })
  }
  callback(null, input)
}

function promptDucks(previous, input, callback) {
  inquirer.prompt([
    {
      type: 'checkbox',
      name: 'ducks',
      message: promptDucksMessage(),
      choices: ducksChoices,
      default: previous ? previous.ducks : ducksChoices[0],
      validate: makeValidator({
        message: 'Please choose an option, or several.',
        nestedRule: value => (
          value.length > 1 && value.includes(ducksChoices[0])
        ),
        nestedRuleMessage: 'Cannot pick ducks and "none". Unselect the "none" option, or the extra ducks.',
      }),
    },
  ]).then(answer0 => {
    if (answer0.ducks.length) {
      inquirer.prompt([
        {
          type: 'list',
          name: 'nestStructure',
          message: promptNestStructureMessage(),
          choices: nestStructureChoices,
          default: previous ? previous.nestStructure : [nestStructureChoices[0]],
          validate: makeValidator({
            message: 'Please choose to place ducks in subdirs, or toss them all into one directory.',
            nestedMessage: 'Please limit choice to one selection.',
          }),
        },
      ]).then(answer1 => setupDucks({ ...input, ...answer0, ...answer1 }, callback))
      return
    }
    logger.log('info', 'nothing to do.')
    callback(null)
  })
}

function getUserInput(callback) {
  const prefs = new Preferences('reify')

  logger.log('debug', `Reify prefs. ${JSON.stringify(prefs.saved)}`)

  promptInputZero(prefs && prefs.saved && prefs.saved.input, input => {
    if (input) {
      if (prefs.saved && prefs.saved.input && prefs.saved.input.baseAppPath) {
        baseAppPath = prefs.saved.input.baseAppPath
      }
      if (input.defineBaseAppPath && input.baseAppPath) {
        baseAppPath = input.baseAppPath
      }
      promptDucks(
        prefs.saved && prefs.saved.input,
        input,
        (err, _input) => {
          if (_input.ducks) {
            const status = new Spinner('Storing prefs, please wait...')
            status.start()
            prefs.saved = { input: _input }
            logger.log('debug', `items stored: ${JSON.stringify(prefs.saved)}`)
            status.stop()
            callback(null, _input)
            return
          }
          callback('No ducks created.')
        }
      )
      return
    }
    callback('No inputs obtained.')
  })
}

async function createComponent(duckPath, fileName, component) {
  handleErr(files.directoryExists(!files.directoryExists(duckPath)), `ERR: That directory didn't exist! ${duckPath}`)
  await fs.writeFileSync(`${duckPath}/${fileName}.js`, component)
}

async function generateFiles(duckPaths, input, callback) {
  const componentPath = `${baseAppPath}${input.appDomain}/${input.componentName}/`
  await createComponent(
    input.nestStructure === nestStructureChoices[0] && duckPaths.components ?
      duckPaths.components : componentPath,
    input.componentName,
    input.componentParadigm === componentParadigmChoices[1] ?
      _functional(input) : _component(input)
  )
  await createComponent(componentPath, 'index', _index({ duckPaths, input }))
  await createComponent(
    duckPaths.__tests__ || componentPath,
    `${input.componentName}-test`,
    _test({ input, duckPaths })
  )
  if (input.reduxComponentType === reduxComponentTypeChoices[0]) {
    await createComponent(componentPath, 'container', _container({ duckPaths, input }))
  }
  if (input.ducks.indexOf('const') !== -1) {
    await createComponent(componentPath, 'const', _const(input))
  }
  if (input.ducks.indexOf('actions') !== -1) {
    await createComponent(componentPath, 'actions', _actions())
  }
  if (input.ducks.indexOf('reducer') !== -1) {
    await createComponent(componentPath, 'reducer', _reducer())
  }
  if (input.ducks.indexOf('selectors') !== -1) {
    await createComponent(duckPaths.selectors || componentPath, 'selector', _selector(input))
  }
  callback(null)
}

function generateComponents(input, callback) {
  if (
    input.ducks && input.ducks.length
  ) {
    const duckPaths = {}

    if (input.nestStructure === nestStructureChoices[0]) {
      input.ducks.forEach(duck => {
        duckPaths[duck] = `${baseAppPath}${input.appDomain}/${input.componentName}/${duck}`
      })
    }
    generateFiles(duckPaths, input, callback)
    return
  }
  logger.log('info', 'nothing to do.')
  callback(null)
}

function start(callback) {
  getUserInput((err, input) => {
    if (err) {
      callback(err)
      return
    }
    callback(null, input)
  })
}

start((err, input) => {
  handleErr(err, 'Broke on start.')
  handleErr(!input, 'Broke on user input.')
  if (input) {
    logger.log('info', chalk.green('Inputs accepted!'))
    logger.log('info', chalk.green('Successfully scaffolded duck(s)!'))
    const status = new Spinner('Generating the files...')
    status.start()
    generateComponents(input, __err => {
      handleErr(__err, 'Broke on component generation.')
      if (!__err) {
        status.stop()
        logger.log('info', chalk.green('Successfully cranked out component(s)!'))
      }
    })
  }
})
