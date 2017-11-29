export const defineBaseAppPath = baseAppPath => (`\
Define base app path.
'baseAppPath' refers to the base directory within the current directory, in which app domains are contained.
New components go in: "{baseAppPath}/{appDomain}/{componentName}".
Current value:
baseAppPath = '${baseAppPath}'.
Change base app path?`
)

export const promptAppDomainChoices = appDomainChoices => (`\
Define appDomain choices.
'appDomain' refers to the directory within the baseAppPath in which to create the functions (components, etc).
New components go in: "{baseAppPath}/{appDomain}/{componentName}".
Current values:
appDomain choices: [${appDomainChoices.map(appDomain => ` '${appDomain}'`)} ].
Change standard appDomains?`
)

export const promptAppDomain = appDomainChoices => (`\
appDomain accepted.
Current choices: [${appDomainChoices.map(appDomain => ` '${appDomain}'`)} ].
Add another?`
)
