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

const componentsStub = opts => (opts.functionalTypes && opts.functionalTypes.component ? 'components/' : '')

export const _container = opts => (`\
import { connect } from 'react-redux'
import ${opts.input.componentName} from './${componentsStub(opts)}${opts.input.componentName}'

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(${opts.input.componentName})
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
  someProperty: false,
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

export const _selector = opts => (`\
const DEFAULT = {}

export default state => state.${opts.componentName} || DEFAULT
`)

const testsPathStub = opts => (opts.functionalTypes && opts.functionalTypes.tests ? '..' : '.')

export const _test = opts => (`\
import { React, expect, mount } from 'utils'
import { Provider } from 'react-redux'
import { createMockStore } from 'mocks'

import ${opts.input.componentName}Container from '${testsPathStub(opts)}/container'
import ${opts.input.componentName} from '${testsPathStub(opts)}/${componentsStub(opts)}${opts.input.componentName}'

describe('<${opts.input.componentName}Container />', () => {
  let component

  before(() => {
    const data = {
      ${opts.input.componentName}: {
        someProperty: false,
      },
    }
    const store = createMockStore(data)
    const container = mount(
      <Provider store={store}>
        <${opts.input.componentName}Container />
      </Provider>
    )

    component = container.find(${opts.input.componentName})
  })

  it('wraps <${opts.input.componentName} />', () => {
    expect(component.length).to.eq(1)
  })
})
`)
