module.exports = {
    packagerConfig: {
        name: 'DecisionTreeArchitect',
        executableName: 'DecisionTreeArchitect',
        icon: './public/favicon.ico',
        asar: true,
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['win32'],
        },
    ],
};
