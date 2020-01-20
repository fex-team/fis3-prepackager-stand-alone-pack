独立打包
========================

完全独立打包，所有依赖都打在一起，适用于 worker 模式。

比如： 

```js
fis.match('::package', {
    prepackager: fis.plugin('stand-alone-pack', {
        '/pkg/editor.worker.js': 'monaco-editor/esm/vs/editor/editor.worker.js',
        '/pkg/json.worker.js': 'monaco-editor/esm/vs/language/json/json.worker',
        '/pkg/css.worker.js': 'monaco-editor/esm/vs/language/css/css.worker',
        '/pkg/html.worker.js': 'monaco-editor/esm/vs/language/html/html.worker',
        '/pkg/ts.worker.js': 'monaco-editor/esm/vs/language/typescript/ts.worker',

        // 替换这些文件里面的路径引用。
        // 如果不配置，源码中对于打包文件的引用是不正确的。
        'replaceFiles': ['src/components/Editor.tsx']
    })
});
```

