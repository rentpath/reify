import inquirer from 'inquirer'

export const defineBaseAppPath = baseAppPath => (`\
Define base app path.
${new inquirer.Separator()}
'baseAppPath' refers to the base directory within the current directory, in which app domains are contained.
IOW: 'appDomains' go into the 'baseAppPath' directory, as so: "{baseAppPath}/{appDomain}/...".
Current value:
baseAppPath = '${baseAppPath}'.
~ Change base app path? ~`
)

export const promptAppDomainChoices = appDomainChoices => (`\
Define appDomain choices.
${new inquirer.Separator()}
'appDomain' refers to the directory within the baseAppPath, in which to create components.
IOW: 'components' go into 'appDomains', as so: "{baseAppPath}/{appDomain}/{componentName}".
Current values:
appDomain choices: [${appDomainChoices.map(appDomain => ` '${appDomain}'`)} ].
~ Change appDomain choices? ~`
)

export const promptAppDomain = appDomainChoices => (`\
appDomain name accepted.
${new inquirer.Separator()}
Current choices: [${appDomainChoices.map(appDomain => ` '${appDomain}'`)} ].
~ Add another? ~`
)

export const promptDucksMessage = () => (`\
Select ducks.
${new inquirer.Separator()}
'Ducks' are the semantic groupings of helper methods, components and directories that help structure our react/redux code.
IOW: 'ducks' are the files such as 'reducer.js' & 'actions.js' that we use to logically group bits of code within a given component.
~ Select the ducks you wish to be created: ~
 ◉ component (required)
 ◉ __tests__ (required)
 ◉ index (required)`
)

export const promptNestStructureMessage = () => (`\
Use nested structure?
${new inquirer.Separator()}
A nested structure means we will try to create sub-directories and place the ducks into those, where appropriate.`
)
