export const _index = opts => (`\
export ${opts.componentName} from './container'
export reducer from './reducer'
export { genericAction } from './actions'
export { GENERIC_CONST } from './const'
`)

export const _component = opts => (`\
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export default class ${opts.componentName} extends PureComponent {
  static propTypes = {}

  constructor(props) {
    super(props)
  }

  render() {

  }
}
`)

export const _container = opts => (`\
import { connect } from 'react-redux'
import ${opts.componentName} from './components/${opts.componentName}'

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(${opts.componentName})
`)

export const _const = opts => (`\
export const GENERIC_CONST = '${opts.componentName}/GENERIC_CONST'
`)

export const _actions = () => (`\
import { GENERIC_CONST } from './const'

export const genericAction = () => ({
  type: GENERIC_CONST,
})
`)

export const _reducer = () => (`\
import { GENERIC_CONST } from './const'

export const initialState = {
}

export default (state = initialState, action) => {
  switch (action.type) {
    case GENERIC_CONST:
      return {
        ...state,
        someProperty: true,
      }

    default:
      return state
  }
}
`)
