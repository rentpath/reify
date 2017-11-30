import fs from 'fs'
import path from 'path'

const files = {
  getCurrentDirectoryBase() {
    return path.basename(process.cwd())
  },

  directoryExists(filePath) {
    try {
      return fs.statSync(filePath).isDirectory()
    } catch (err) {
      return false
    }
  },
}

export default files
