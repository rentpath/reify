const container = opts => (`\
import { connect } from 'react-redux'
import ${opts.componentName} from './components/${opts.componentName}'

const mapStateToProps = state => ({
})

const mapDispatchToProps = {
}

export default connect(mapStateToProps, mapDispatchToProps)(${opts.componentName})
`)

export default container
