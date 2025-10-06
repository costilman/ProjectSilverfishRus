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

const createLocresTxt = async function (folderPath, outputFileName) {
  const files = await getFiles(path.join(__dirname, `./${folderPath}`))
  
  const locresTxt = fs.createWriteStream(path.join(__dirname, `./${outputFileName}.locres.txt`))

  locresTxt.write('=>{}\r\n\r\n')

  files.forEach(async (file, idx) => {
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf8'))

      json.forEach(obj => {
        if (obj.LocalizedString !== "") {
          locresTxt.write(`=>[${obj.Key}][${obj.Hash}]\r\n`)
          locresTxt.write(`${obj.LocalizedString}\r\n\r\n`)
        }
      })
    } catch (err) {
      console.log(file)
    }
  })

  locresTxt.write('=>{[END]}\r\n')

  locresTxt.end()
}

const main = async function () {
  await createLocresTxt('output', 'Game')
}

main()
