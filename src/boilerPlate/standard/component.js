const component = opts => (`\
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

export default component
