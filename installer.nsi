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
 
; ---------------------
; AnimGif plugin functions
Function ShowAnimation
  AnimGif::play /NOUNLOAD "$PLUGINSDIR\loading.gif"
  Pop $0
FunctionEnd
 
Function HideAnimation
  AnimGif::stop
  Pop $0
FunctionEnd
; ---------------------
 
Section "Install"
  ; Copy loading.gif to plugin temp folder
  SetOutPath "$PLUGINSDIR"
  File "src\assets\loading.gif"
 
  ; Start animation
  Call ShowAnimation
 
  ; Install program files
  SetOutPath "$INSTDIR"
  File /r "out\HBK Device Discovery-win32-x64\*"
 
  ; Create desktop shortcut
  CreateShortcut "$DESKTOP\HBK Device Discovery.lnk" "$INSTDIR\HBK Device Discovery.exe"
 
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\HBK Device Discovery"
  CreateShortcut "$SMPROGRAMS\HBK Device Discovery\HBK Device Discovery.lnk" "$INSTDIR\HBK Device Discovery.exe"
  CreateShortcut "$SMPROGRAMS\HBK Device Discovery\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
 
  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
 
  ; Stop animation
  Call HideAnimation
SectionEnd
 
Section "Uninstall"
  Delete "$DESKTOP\HBK Device Discovery.lnk"
  RMDir /r "$SMPROGRAMS\HBK Device Discovery"
  RMDir /r "$INSTDIR"
  RMDir /r "$LOCALAPPDATA\hbk_device_scan"
SectionEnd