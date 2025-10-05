const fs = require('fs')
const path = require('path')

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

function getFileName(file) {
  return `${file.split('\\').reverse()[0].split('.')[0]}`
}

const mergeByFiles = async function (_old, _new) {
  const filesNotFound = []
  const filesWithNotEqualSourceString = []
  const errors = []


  const oldFiles = await getFiles(path.join(__dirname, `./${_old}`))
  const newFiles = await getFiles(path.join(__dirname, `./${_new}`))

  const oldFileNames = oldFiles.map(getFileName)
  const newFileNames = newFiles.map(getFileName)

  oldFiles.forEach(async (_oldFile, _idx) => {
    const oldFileName = getFileName(_oldFile)
    try {
      if (newFileNames.includes(oldFileName)) {
        const newFile = newFiles.find(file => {return getFileName(file) === oldFileName})
        
        const oldFileJson = JSON.parse(fs.readFileSync(_oldFile, 'utf8'))
        const newFileJson = JSON.parse(fs.readFileSync(newFile, 'utf8'))
  
        oldFileJson.forEach(oldFileObj => {
          const newFileObj = newFileJson.find(newFileObj => {
            const isKeyEqual = oldFileObj['Key'] === newFileObj['Key']
            const isHashEqual = oldFileObj['Hash'] === newFileObj['Hash']
            const isSourceStringEqual = oldFileObj['SourceString'] === newFileObj['SourceString']
            if (isKeyEqual && isHashEqual && !isSourceStringEqual) {
              filesWithNotEqualSourceString.push(oldFileName)
            }
            return isKeyEqual && isHashEqual
          })
          if (newFileObj && oldFileObj['LocalizedString'] !== '') {
            newFileObj['LocalizedString'] = oldFileObj['LocalizedString']
          }
        })
        fs.writeFile(`./${_new}/${oldFileName}.json`, JSON.stringify(newFileJson, null, 2), 'utf8', (err) => {
          if (err) throw err
        });
      } else {
        filesNotFound.push(oldFileName)
      }
    } catch (e) {
      errors.push(oldFileName)
    }
  })

  console.log('Не найденные файлы', filesNotFound)
  console.log('Файлы у которых не совпадает SourceString', filesWithNotEqualSourceString)
  console.log(errors)
}

const main = async function () {
  await mergeByFiles('output', 'output_new')
}

main()
