/**
 * @file 用来进行独立打包，适用于生成 worker 版本。
 */
const fs = require('fs');
const path = require('path');
const modJS = fs.readFileSync(path.join(__dirname, 'mod.js'), 'utf8');
const root = fis.project.getProjectPath();
const baseFile = fis.file.wrap(path.join(root, 'fis-conf.js'));

module.exports = function(ret, pack, settings, opt) {
    const pkgFiles = Object.keys(settings);
    const replaceFiles = settings.replaceFiles;
    const urlMap = {};
    
    
    pkgFiles.forEach(function(pkgFile) {
        if (pkgFile === 'replaceFiles') {
            return;
        }

        const packedFile = fis.file.wrap(path.join(root, pkgFile));
        const contents = packFile(settings[pkgFile], ret);

        if (contents) {
            packedFile.setContent(contents);
            urlMap[pkgFile] = packedFile.getUrl(opt.hash, opt.domain);
            ret.pkg[packedFile.subpath] = packedFile;
        }
    });

    // 替换文件中对 pkg 文件的引用。
    if (replaceFiles && Object.keys(urlMap).length) {
        const target = !Array.isArray(replaceFiles) ? [replaceFiles] : replaceFiles;
        target.forEach(function(target) {
            const info = fis.project.lookup(target, baseFile);

            if (!info.file) {
                fis.log.warning(target + ' is not found!');
                return;
            } else if (!ret.ids[info.file.id]) {
                fis.log.warning(target + ' is not refered!');
                return;
            }

            const src = ret.ids[info.file.id];
            let contents = src.getContent();

            typeof contents === 'string' && Object.keys(urlMap).forEach(function(origin) {
                contents = contents.replace(origin, urlMap[origin]);
            });

            src.setContent(contents);
        });
    }
};


function packFile(entry, ret) {
    const info = fis.project.lookup(entry, baseFile);

    if (info.file) {
        const entryFile = info.file;
        const pool = [entryFile];

        while (pool.length) {
            const current = pool.shift();
            fis.compile(current);

            Array.isArray(current.requires) && current.requires.forEach(function(subpath) {
                pool.push(fis.file.wrap(path.join(root, subpath)));
            });
        }

        return combine(entryFile, ret);
    } else {
        fis.log.warning(entry + ' is not found!');
    }
}

// 只考虑同步的，如果 worker 里面还有异步用法再扩充。
function combine(entryFile, ret) {
    const list = [];
    const pool = [entryFile];
    const collected = [];

    while (pool.length) {
        const current  = pool.shift();
        list.unshift(current);
        collected.push(current.id);

        Array.isArray(current.requires) && current.requires.forEach(function(id) {
            if (~collected.indexOf(id)) {
                return;
            }

            pool.push(ret.ids[id]);
        });
    }

    return modJS + "\n" + list.map(function(file) {
        if (file.id === entryFile.id) {
            return "/**! " +file.id+ "*/\n" + file.getContent() + "\nrequire('"+ entryFile.moduleId +"')";
        }

        return "/**! " +file.id+ "*/\n" + file.getContent();
    }).join("\n")
}