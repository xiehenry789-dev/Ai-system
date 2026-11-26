#!/bin/bash
# Builds Wizard Meadow desktop apps from Electron runtime zips.
# usage: build.sh <dir with e-win32-x64.zip / e-darwin-arm64.zip / e-darwin-x64.zip> <out dir> <node_modules dir with resedit>
set -e
HERE=$(cd "$(dirname "$0")" && pwd); DL=$1; OUT=$2; NM=$3
rm -rf "$OUT"; mkdir -p "$OUT"
appfiles(){ mkdir -p "$1"; cp "$HERE/main.js" "$HERE/package.json" "$HERE/icon.png" "$1/"; cp "$HERE/../WizardMeadow.html" "$1/game.html"; }
# Windows
W="$OUT/Wizard Meadow"; mkdir -p "$W"; unzip -q "$DL/e-win32-x64.zip" -d "$W"
mv "$W/electron.exe" "$W/Wizard Meadow.exe"; rm -f "$W/resources/default_app.asar"; appfiles "$W/resources/app"
NODE_PATH="$NM" node "$HERE/winicon.mjs" "$W/Wizard Meadow.exe" "$HERE/icon.ico"
(cd "$OUT" && zip -qr9 WizardMeadow-Windows.zip "Wizard Meadow")
# Mac (Apple Silicon and Intel)
for A in arm64 x64; do D="$OUT/mac-$A"; mkdir -p "$D"; unzip -q "$DL/e-darwin-$A.zip" -d "$D"
  P="$D/Wizard Meadow.app"; mv "$D/Electron.app" "$P"; rm -f "$P/Contents/Resources/default_app.asar"; appfiles "$P/Contents/Resources/app"
  cp "$HERE/icon.icns" "$P/Contents/Resources/electron.icns"
  python3 - "$P/Contents/Info.plist" <<'PY'
import plistlib,sys
p=sys.argv[1];d=plistlib.load(open(p,'rb'));d.update(CFBundleName='Wizard Meadow',CFBundleDisplayName='Wizard Meadow',CFBundleIdentifier='app.wizardmeadow.game',CFBundleShortVersionString='1.0.0')
plistlib.dump(d,open(p,'wb'))
PY
  N=$([ $A = arm64 ] && echo AppleSilicon || echo Intel)
  (cd "$D" && zip -qry9 "../WizardMeadow-Mac-$N.zip" "Wizard Meadow.app"); rm -rf "$D"; done
ls -la "$OUT"
