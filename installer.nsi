; filepath: installer.nsi
!include "MUI2.nsh"

Name "HBK Device Discovery"
OutFile "HBK_Device_Discovery_Installer.exe"
InstallDir "$PROGRAMFILES\HBK Device Discovery"
RequestExecutionLevel admin

; installer icon
!define MUI_ICON "src\assets\hbk-logo.ico"
!define Icon "src\assets\hbk-logo.ico"

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath $INSTDIR
  File /r "out\HBK Device Discovery-win32-x64\*"
  
  ; desktop shortcut
  CreateShortcut "$DESKTOP\HBK Device Discovery.lnk" "$INSTDIR\HBK Device Discovery.exe"
  
  ; start menu shortcut
  CreateDirectory "$SMPROGRAMS\HBK Device Discovery"
  CreateShortcut "$SMPROGRAMS\HBK Device Discovery\HBK Device Discovery.lnk" "$INSTDIR\HBK Device Discovery.exe"
  CreateShortcut "$SMPROGRAMS\HBK Device Discovery\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

  ; uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\HBK Device Discovery.lnk"
  RMDir /r "$SMPROGRAMS\HBK Device Discovery"
  RMDir /r "$INSTDIR"
  RMDir /r "$LOCALAPPDATA\hbk_device_scan"
SectionEnd