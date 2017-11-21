const boilerPlate = input => (`\
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export default class ${input.name} extends PureComponent {
  static propTypes = {}

  constructor(props) {
    super(props)

  }

  render() {

  }
}
`)

export default boilerPlate
