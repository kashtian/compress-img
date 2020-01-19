const fs = require('fs')
const path = require('path');
const colors = require('colors');
const imagemin = require('imagemin');
const imageminPng = require('imagemin-pngquant');
const imageminJpeg = require('imagemin-mozjpeg')
const losslessJpeg = require('imagemin-jpegtran')
const losslessPng = require('imagemin-optipng')

colors.setTheme({
  error: 'red',
  help: 'cyan',
  success: 'green'
})

let commands = {
  '-h, --help': '帮助信息',
  '-s, --source [path]': '非绝对路径会从当前工作目录查找',
  '-d, --dest [path]': '非绝对路径会从当前工作目录查找',
  '-qp, --quality_png [min: number, max: number]': '指定png图片压缩质量0-1, 默认0.8,0.9',
  '-qj, --quality_jpg [number]': '指定jpg图片压缩质量0-100, 默认90',
}
let options = {
  source: './img',
  dest: './img-dest'
}
let comMap = keyMap()

// 获取用户输入的命令，并做相应检查
function init() {
  let comKey = '', value = '', argvItem = '';
  for (let i = 0, len = process.argv.length; i < len; i++) {
    argvItem = process.argv[i];
    if (!/^-/.test(argvItem)) {
      continue;
    }
    comKey = getCommandKey(argvItem);
    if (comKey) {
      value = getArgByIndex(i + 1);
      if (['source', 'dest'].includes(comKey)) {
        value = path.resolve(value)
        if (!fs.existsSync(value)) {
          return console.log(`${value} 目录不存在`.error)
        }
      }
      options[comKey] = value
    } else {
      options.help = true;
      console.log(`${argvItem}命令不存在，请查看帮助信息\n`.error);
      break;
    }
  }
  startTask();
}
init();

function startTask() {
  if (options.help) {
    return printCommand();
  }
  compressImg()
}

// 压缩图片
function compressImg() {
  let dirPath = path.join(options.source, '/*.{jpg,png}').replace(/\\/g, '/')
  imagemin([dirPath], {
    destination: `${options.dest}`,
    plugins: [
      getJpgPlugin(),
      getPngPlugin()
    ]
  }).then(files => {
    console.log(`compress ${dirPath} success`.success)
  }).catch(err => {
    console.log(`compress ${dirPath} error: ${err}`.error)
  })
}

// 获取jpg插件
function getJpgPlugin() {
  return options.quality_jpg ? imageminJpeg({
    quality: options.quality_jpg === true ? 90 : options.quality_jpg
  }) : losslessJpeg({
    progressive: true
  })
}

// 获取png插件
function getPngPlugin() {
  return options.quality_png ? imageminPng({
    quality: options.quality_png === true ? [0.8,0.9] : options.quality_png
  }) : losslessPng({
    optimizationLevel: 7
  })
}

// 获取缩写对应的命令map
function keyMap() {
  let map = {};
  for (let key in commands) {
    if (/-(\w+).*--(\w+)/.test(key)) {
      map[RegExp.$1] = RegExp.$2;
      map[RegExp.$2] = RegExp.$2
    }
  }
  return map;
}

function getCommandKey(argv) {
  let key = argv.replace(/-+/, '')
  return comMap[key]
}

// 获取cli里配置的参数
function getArgByIndex(index) {
  let value = process.argv[index];
  if (!value || /^-/.test(value)) {
    return true;
  }
  if (value.includes(',')) {
    value = value.split(',')
    value = value.map(item => {
      return parseFloat(item)
    })
  }
  return value;
}

// 打印命令信息
function printCommand() {
  for (let k in commands) {
    console.log(`${k}   ${commands[k]}`.help)
  }
}
