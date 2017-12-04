import { reduxComponentTypeChoices, componentParadigmChoices } from '../const'

const componentsPathStub = opts => (opts.duckPaths && opts.duckPaths.components ? 'components/' : '')
const selectorsPathStub = opts => (opts.duckPaths && opts.duckPaths.selectors ? 'selectors/' : '')

export const _index = opts => (`\
export ${opts.input.componentParadigm === componentParadigmChoices[1] ? `{ ${opts.input.componentName} }` : opts.input.componentName} from './${componentsPathStub(opts)}${opts.input.componentName}'
${opts.input.reduxComponentType === reduxComponentTypeChoices[0] ? `export ${opts.input.componentName}Container from './container'
` : ''}${opts.input.ducks.indexOf('selectors') !== -1 ? `export ${opts.input.componentName}Selector from './${selectorsPathStub(opts)}selector'
` : ''}${opts.input.ducks.indexOf('reducer') !== -1 ? `export reducer from './reducer'
` : ''}${opts.input.ducks.indexOf('actions') !== -1 ? `export { genericAction } from './actions'
` : ''}${opts.input.ducks.indexOf('const') !== -1 ? `export { GENERIC_CONST } from './const'
` : ''}`)

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

export const _functional = opts => (`\
import React from 'react'
import PropTypes from 'prop-types'

const ${opts.componentName} = props => (
  <div />
)

${opts.componentName}.propTypes = {}

export default ${opts.componentName}
`)

export const _container = opts => (`\
import { connect } from 'react-redux'
import ${opts.input.componentParadigm === componentParadigmChoices[1] ? `{ ${opts.input.componentName} }` : opts.input.componentName} from './${componentsPathStub(opts)}${opts.input.componentName}'

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

const testsPathStub = opts => (opts.duckPaths && opts.duckPaths.__tests__ ? '..' : '.')

export const _test = opts => (`\
import { React, expect, mount } from 'utils'
import { Provider } from 'react-redux'
import { createMockStore } from 'mocks'

${opts.input.reduxComponentType === reduxComponentTypeChoices[0] ? `import ${opts.input.componentName}Container from '${testsPathStub(opts)}/container'
` : ''}import ${opts.input.componentName} from '${testsPathStub(opts)}/${componentsPathStub(opts)}${opts.input.componentName}'

describe('<${opts.input.componentName}${opts.input.reduxComponentType === reduxComponentTypeChoices[0] ? 'Container' : ''} />', () => {
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
        <${opts.input.componentName}${opts.input.reduxComponentType === reduxComponentTypeChoices[0] ? 'Container' : ''} />
      </Provider>
    )

    component = container.find(${opts.input.componentName})
  })

  it('wraps <${opts.input.componentName} />', () => {
    expect(component.length).to.eq(1)
  })
})
`)
