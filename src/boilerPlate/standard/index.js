const index = opts => (`\
export ${opts.componentName} from './container'
export reducer from './reducer'
export { genericAction } from './actions'
export { CONST } from './const'
`)

export default index
