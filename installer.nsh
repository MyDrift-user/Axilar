!include "MUI2.nsh"

Var AutostartCheckbox
Var RunAfterInstallCheckbox

; Welcome page
!insertmacro MUI_PAGE_WELCOME

; Custom page for autostart option
Page custom AutostartPage

; Custom page for running the app after installation
Page custom RunAfterInstallPage

Function AutostartPage
  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateCheckbox} 0 75% 100% 10u "Start app at system boot"
  Pop $AutostartCheckbox
  ${NSD_SetState} $AutostartPage ${BST_CHECKED}
  nsDialogs::Show
FunctionEnd

Function RunAfterInstallPage
  nsDialogs::Create 1018
  Pop $0

  ${NSD_CreateCheckbox} 0 55% 100% 10u "Run app after installation"
  Pop $RunAfterInstallCheckbox
  ${NSD_SetState} $RunAfterInstallCheckbox ${BST_CHECKED}

  nsDialogs::Show
FunctionEnd

Function .onInstSuccess
  ${NSD_GetState} $RunAfterInstallCheckbox $0
  ${If} $0 == ${BST_CHECKED}
    ExecShell "" "$INSTDIR\YourAppExecutable.exe"
  ${EndIf}

  ${NSD_GetState} $AutostartCheckbox $0
  ${If} $0 == ${BST_CHECKED}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCT_NAME}" "$INSTDIR\YourAppExecutable.exe"
  ${EndIf}
FunctionEnd

Section "Install"
  ; Your installation script here
SectionEnd