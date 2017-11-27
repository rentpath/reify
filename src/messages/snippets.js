export const defineBaseAppPath = baseAppPath => (`\
Define base app path.
('baseAppPath' refers to the subdir within the current directory in which apps are contained.)
New components go in: "{baseAppPath}/{appName}/{componentName}".
Current value:
baseAppPath = '${baseAppPath}'.
Change base app path?`
)

export const defineStandardAppNames = appList => (`\
Define standard appNames.
('appName' refers to the subdir within the baseAppPath in which to create the components.)
New components go in: "{baseAppPath}/{appName}/{componentName}".
Current values:
appName choices: [${appList.map(appName => ` '${appName}'`)} ].
Change standard appNames?`
)

export const defineAppList = appList => (`\
appName accepted.
Current choices: [${appList.map(appName => ` '${appName}'`)} ].
Add another?`
)
