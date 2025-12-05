import type { ForgeConfig } from '@electron-forge/shared-types'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    osxSign: {},
    icon: './src/assets/hbk-logo',
    certificateFile: process.env.WIN_CERT_FILE,
    certificatePassword: process.env.WIN_CERT_PASSWORD,
    win32metadata: {
      CompanyName: 'HBM',
      FileDescription: 'HBK Device Discovery',
      ProductName: 'HBK Device Discovery'
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        bin: 'HBK Device Discovery',
        executableName: 'HBK Device Discovery',
        icon: './src/assets/hbk-logo.ico'
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
