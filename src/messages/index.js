export const defineBaseAppPath = baseAppPath => (`\
Define base app path.
'baseAppPath' refers to the base directory within the current directory, in which app domains are contained.
i.e.: app domains will then go into the baseAppPath directory, as so: "{baseAppPath}/{appDomain}/...".
Current value:
baseAppPath = '${baseAppPath}'.
Change base app path?`
)

export const promptAppDomainChoices = appDomainChoices => (`\
Define appDomain choices.
'appDomain' refers to the directory within the baseAppPath, is which to create the functional types (e.g. components, etc).
i.e.: 'functional types' (including new components) go into the appDomain, as so: "{baseAppPath}/{appDomain}/{componentName}".
Current values:
appDomain choices: [${appDomainChoices.map(appDomain => ` '${appDomain}'`)} ].
Change appDomain choices?`
)

export const promptAppDomain = appDomainChoices => (`\
appDomain name accepted.
Current choices: [${appDomainChoices.map(appDomain => ` '${appDomain}'`)} ].
Add another?`
)
