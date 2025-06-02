import type { ForgeConfig } from '@electron-forge/shared-types'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    osxSign: {}
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        bin: 'HBK Device Discovery',
        executableName: 'HBK Device Discovery',
        icon: 'src/assets/hbk-logo.png'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        bin: 'HBK Device Discovery',
        executableName: 'HBK Device Discovery',
        icon: 'src/assets/hbk-logo.png'
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
          name: 'HBM/electron-scan',
          owner: 'Florian Schopp'
        },
        prerelease: true
      }
    }
  ]
}

export default config
