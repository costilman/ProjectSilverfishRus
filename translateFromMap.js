const fs = require('fs')
const path = require('path')
const readline = require('readline');
const converter = require('json-2-csv');

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}


const translateFromMap = async function (folderPath, mapFile) {
  const translationMap = JSON.parse(fs.readFileSync(`./${mapFile}.json`, 'utf8'))

  const files = await getFiles(path.join(__dirname, `./${folderPath}`))
  
  files.forEach(async (file, idx) => {
    try {
      const fileName = `${file.split('\\').reverse()[0].split('.')[0]}`
      console.log(fileName)
      const json = JSON.parse(fs.readFileSync(file, 'utf8'))
      json.forEach(obj => {
        if (translationMap[obj.SourceString] !== undefined) {
          obj.LocalizedString = translationMap[obj.SourceString]
        }
      })
      fs.writeFile(`./${folderPath}/${fileName}.json`, JSON.stringify(json, null, 2), 'utf8', (err) => {
        if (err) throw err
      });
      console.log(`complete translateFromMap in ${file}`)
    } catch (err) {
      console.log(file)
    }
  })
}

const main = async function () {
  await translateFromMap('output', 'translation_map_easy')
}

main()
