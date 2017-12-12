const fs = require('fs');
const path = require('path');
const gm = require('gm');
const colors = require('colors');
const imagemin = require('imagemin');
const imageminPng = require('imagemin-pngquant');

colors.setTheme({
    error: 'red',
    help: 'cyan',
    success: 'green'
})

let commands = {
    '-h, --help': '帮助信息',
    '-c, --compress': '进行图片压缩',
    '-s, --source [absolute path]': '需要压缩的图片目录地址（绝对路径）',
    '-d, --dest [absolute path]': '图片压缩后存储的目录地址（绝对路径）',
    '-q, --quality [number]': '图片压缩的质量选择0-100,默认88',
    '-qp, --quality_png [number]': '指定png图片压缩质量0-100',
    '-qj, --quality_jpg [number]': '指定jpg图片压缩质量0-100',
}
let options = {
        source: './images',
        dest: './dest',
        quality: 88
    }, 
    ckMap = keyMap();

// 获取用户输入的命令，并做相应检查
function init() {
    let keys = Object.keys(commands).join(';').match(/(-+\w+)/g);
    let rKey = '', value = '', key = '';
    for (let i = 0, len = process.argv.length; i < len; i++) {
        key = process.argv[i];
        if (!/^-/.test(key)) {
            continue;
        }
        if (keys.includes(key)) {
            rKey = key.replace(/-+/, '');
            value = getArg(key);

            if (checkAbPathByKey(ckMap[rKey] || rKey, value)) {
                options[ckMap[rKey] || rKey] = value;
            } else {
                console.log(`${key}只能输入绝对路径`.error);
                return;
            }                   
        } else {
            options.help = true;
            console.log(`${key}命令不存在，请查看帮助信息`.error);
            break;
        }
    }
    startTask();
}
init();

function startTask() {
    if (options.help) {
        printCommand();
    } else if (options.compress) {
        compress();
    }
}

// 压缩图片
function compress() {
    fs.readdir(options.source, (err, files) => {
        if (err) {
            console.log(err.message.error)
            return;
        }

        files.forEach(file => {
            if (/^\./.test(file)) {
                return;
            }
            if (/\.png/.test(file)) {
                compressPng(file);
            } else {
                compressSingleFile(file);
            }            
        })       
        
    })    
}

// 根据文件名压缩单个文件(jpg)
function compressSingleFile(fileName) {
    gm(`${options.source}/${fileName}`)
    .quality(options.quality_jpg || options.quality)
    .write(`${options.dest}/${fileName}`, function(err) {
        if (err) {
            console.log(`compress ${fileName} error: ${err}`.error)
        } else {
            console.log(`compress ${fileName} success`.success)
        }
    })
}

// 压缩png图片
function compressPng(fileName) {
    imagemin([`${options.source}/${fileName}`], `${options.dest}`, {
        plugins: [
            imageminPng({
                quality: options.quality_png || options.quality
            })
        ]
    }).then(files => {
        console.log(`compress ${fileName} success`.success)
    }).catch(err => {
        console.log(`compress ${fileName} error: ${err}`.error)
    })
}

// 检查用户输入的路径是否是绝对路径
function checkAbPathByKey(key, value) {
    if (['source', 'dest'].includes(key)) {
        if (typeof value != 'string') {
            return false;
        }
        return path.isAbsolute(value);
    }
    return true;
}

// 获取缩写对应的命令map
function keyMap() {
    let map = {};
    for (let key in commands) {
        if (/-(\w+).*--(\w+)/.test(key)) {
            map[RegExp.$1] = RegExp.$2;
        }
    }
    return map;
}

// 获取cli里配置的参数
function getArg(name) {
    let index = process.argv.indexOf(name);
    if (index < 0) {
        return;
    }
    let value = process.argv[index + 1];
    if (!value || /^-/.test(value)) {
        return true;
    }
    return value;
}

// 打印命令信息
function printCommand() {
    for (let k in commands) {
        console.log(`${k}   ${commands[k]}`.help)
    }    
}