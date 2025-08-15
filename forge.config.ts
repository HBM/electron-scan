import type { ForgeConfig } from '@electron-forge/shared-types'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    osxSign: {},
    icon: './src/assets/hbk-logo'
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        bin: 'HBK Device Discovery',
        executableName: 'HBK Device Discovery',
        icon: './src/assets/hbk-logo.ico',
        setupIcon: './src/assets/hbk-logo.ico',
        loadingGif: './src/assets/loading.gif',
        shortcutName: 'HBK Device Discovery',
        createStartMenuShortcut: true,
        createDesktopShortcut: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        bin: 'HBK Device Discovery',
        executableName: 'HBK Device Discovery',
        icon: 'src/assets/hbk-logo.icns'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        bin: 'HBK Device Discovery',
        executableName: 'HBK Device Discovery',
        icon: 'src/assets/hbk-logo.png'
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          name: 'electron-scan',
          owner: 'HBM'
        },
        prerelease: true
      }
    }
  ]
}

export default config
