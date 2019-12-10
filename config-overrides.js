const {override,fixBabelImports,addLessLoader}=require('customize-cra');

module.exports = override(
    fixBabelImports('import',{
        libraryName:'antd',
        libraryDirectory:'es'
        //style:true
    }),
    addLessLoader({
        javascriptEnabled:true
        /*modifyVars: {
            '@layout-body-background': '#ffffff',
            '@layout-footer-background':'#f0f2f5',
            '@layout-sider-background': '@layout-footer-background'
        }
        */
    })
);